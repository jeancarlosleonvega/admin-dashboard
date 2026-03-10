import { venueSchedulesRepository } from './venue-schedules.repository.js';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import type { CreateVenueScheduleInput, UpdateVenueScheduleInput, VenueScheduleFiltersInput } from './venue-schedules.schema.js';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function dateToISOString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isTimeOverlapping(
  slotStart: string,
  slotEnd: string,
  blockStart: string,
  blockEnd: string
): boolean {
  return slotStart < blockEnd && slotEnd > blockStart;
}

export async function generateSlots(scheduleId: string, generateUntil: Date) {
  const schedule = await venueSchedulesRepository.findById(scheduleId);
  if (!schedule) throw new NotFoundError('Schedule');

  const venue = schedule.venue as any;
  const sportType = venue.sportType;

  // Resolver valores: schedule override → venue override → sportType default
  const intervalMinutes =
    schedule.intervalMinutes ?? venue.intervalMinutes ?? sportType.defaultIntervalMinutes;
  const openTime =
    schedule.openTime ?? venue.openTime ?? sportType.defaultOpenTime;
  const closeTime =
    schedule.closeTime ?? venue.closeTime ?? sportType.defaultCloseTime;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startFrom = new Date(Math.max(schedule.startDate.getTime(), today.getTime()));
  const scheduleEnd = schedule.endDate ?? generateUntil;
  const endAt = new Date(Math.min(scheduleEnd.getTime(), generateUntil.getTime()));

  if (startFrom > endAt) {
    await venueSchedulesRepository.updateGeneratedUntil(scheduleId, endAt);
    return;
  }

  // Obtener BlockedPeriods activos que aplican
  const blockedPeriods = await prisma.blockedPeriod.findMany({
    where: {
      active: true,
      startDate: { lte: endAt },
      endDate: { gte: startFrom },
      OR: [
        { venueId: venue.id },
        { sportTypeId: sportType.id },
        { sportTypeId: null, venueId: null },
      ],
    },
  });

  const slotsToCreate: {
    venueId: string;
    scheduleId: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: 'AVAILABLE';
  }[] = [];

  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  const currentDate = new Date(startFrom);
  while (currentDate <= endAt) {
    // isoDay: 1=Lunes, 7=Domingo
    const isoDay = currentDate.getDay() === 0 ? 7 : currentDate.getDay();

    if (schedule.daysOfWeek.includes(isoDay)) {
      const dateStr = dateToISOString(currentDate);
      const dayDate = new Date(dateStr + 'T00:00:00.000Z');

      // Verificar si el día completo está bloqueado
      const dayBlocked = blockedPeriods.some((bp) => {
        const bpStartStr = bp.startDate.toISOString().split('T')[0];
        const bpEndStr = bp.endDate.toISOString().split('T')[0];
        return !bp.startTime && dateStr >= bpStartStr && dateStr <= bpEndStr;
      });

      if (!dayBlocked) {
        // Generar slots
        for (let start = openMinutes; start + intervalMinutes <= closeMinutes; start += intervalMinutes) {
          const slotStart = formatMinutes(start);
          const slotEnd = formatMinutes(start + intervalMinutes);

          // Verificar si la franja está bloqueada
          const timeBlocked = blockedPeriods.some((bp) => {
            if (!bp.startTime || !bp.endTime) return false;
            const bpStartStr = bp.startDate.toISOString().split('T')[0];
            const bpEndStr = bp.endDate.toISOString().split('T')[0];
            return dateStr >= bpStartStr && dateStr <= bpEndStr && isTimeOverlapping(slotStart, slotEnd, bp.startTime, bp.endTime);
          });

          if (!timeBlocked) {
            slotsToCreate.push({
              venueId: venue.id,
              scheduleId,
              date: dayDate,
              startTime: slotStart,
              endTime: slotEnd,
              status: 'AVAILABLE',
            });
          }
        }
      }
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Insertar en lotes, ignorar duplicados
  if (slotsToCreate.length > 0) {
    await prisma.slot.createMany({
      data: slotsToCreate,
      skipDuplicates: true,
    });
  }

  // Re-aplicar períodos bloqueados activos sobre slots recién generados
  // (por si existían períodos bloqueados antes de generar)
  for (const bp of blockedPeriods) {
    const bpStartStr = bp.startDate.toISOString().split('T')[0];
    const bpEndStr = bp.endDate.toISOString().split('T')[0];

    const where: any = {
      venueId: venue.id,
      scheduleId,
      status: 'AVAILABLE',
      date: {
        gte: new Date(bpStartStr + 'T00:00:00.000Z'),
        lte: new Date(bpEndStr + 'T00:00:00.000Z'),
      },
    };

    if (bp.startTime && bp.endTime) {
      where.startTime = { gte: bp.startTime };
      where.endTime = { lte: bp.endTime };
    }

    await prisma.slot.updateMany({ where, data: { status: 'BLOCKED' } });
  }

  await venueSchedulesRepository.updateGeneratedUntil(scheduleId, endAt);
}

export class VenueSchedulesService {
  async findAll(filters: VenueScheduleFiltersInput) {
    const { page, limit, venueId } = filters;
    const { items, total } = await venueSchedulesRepository.findAll(venueId, page, limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const item = await venueSchedulesRepository.findById(id);
    if (!item) throw new NotFoundError('Schedule de venue');
    return item;
  }

  async create(data: CreateVenueScheduleInput) {
    const venue = await prisma.venue.findUnique({
      where: { id: data.venueId },
      include: { sportType: true },
    });
    if (!venue) throw new ValidationError('Venue no encontrado');

    // Copiar valores del venue (que a su vez ya heredó del sportType) si no se especificaron
    const st = venue.sportType as { defaultOpenTime: string; defaultCloseTime: string; defaultIntervalMinutes: number; defaultPlayersPerSlot: number };
    const resolved = {
      ...data,
      openTime: data.openTime ?? venue.openTime ?? st.defaultOpenTime,
      closeTime: data.closeTime ?? venue.closeTime ?? st.defaultCloseTime,
      intervalMinutes: data.intervalMinutes ?? venue.intervalMinutes ?? st.defaultIntervalMinutes,
      playersPerSlot: data.playersPerSlot ?? venue.playersPerSlot ?? st.defaultPlayersPerSlot,
    };

    const item = await venueSchedulesRepository.create(resolved);

    // Generar slots automáticamente hasta min(endDate, today+60days)
    const today = new Date();
    const defaultUntil = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const generateUntil = item.endDate
      ? new Date(Math.min(item.endDate.getTime(), defaultUntil.getTime()))
      : defaultUntil;

    await generateSlots(item.id, generateUntil);

    return venueSchedulesRepository.findById(item.id);
  }

  async update(id: string, data: UpdateVenueScheduleInput) {
    await this.findById(id);
    if (data.venueId) {
      const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
      if (!venue) throw new ValidationError('Venue no encontrado');
    }
    return venueSchedulesRepository.update(id, data);
  }

  async delete(id: string) {
    await this.findById(id);
    await venueSchedulesRepository.delete(id);
  }

  async generateSlotsManually(id: string, until: string) {
    await this.findById(id);
    const generateUntil = new Date(until);
    await generateSlots(id, generateUntil);
    return venueSchedulesRepository.findById(id);
  }
}

export const venueSchedulesService = new VenueSchedulesService();
