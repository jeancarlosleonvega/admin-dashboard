import { venueSchedulesRepository } from './venue-schedules.repository.js';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { broadcast } from '../../shared/utils/wsBroadcast.js';
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
  const timeRanges = (schedule as any).timeRanges as Array<{
    id: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    intervalMinutes: number;
    playersPerSlot: number;
    active: boolean;
  }>;

  const activeTimeRanges = timeRanges.filter((tr) => tr.active);
  if (activeTimeRanges.length === 0) return;

  const endDateStr = generateUntil.toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  // startDate del schedule es opcional: si null, empezar desde hoy
  const startDateStr = schedule.startDate
    ? schedule.startDate.toISOString().split('T')[0]
    : todayStr;
  const startFromStr = startDateStr > todayStr ? startDateStr : todayStr;

  if (startFromStr > endDateStr) {
    await venueSchedulesRepository.updateGeneratedUntil(scheduleId, new Date(endDateStr + 'T00:00:00.000Z'));
    return;
  }

  // Obtener BlockedPeriods activos que aplican
  const blockedPeriods = await prisma.blockedPeriod.findMany({
    where: {
      active: true,
      startDate: { lte: new Date(endDateStr + 'T00:00:00.000Z') },
      endDate: { gte: new Date(startFromStr + 'T00:00:00.000Z') },
      OR: [
        { venueId: venue.id },
        { sportTypeId: venue.sportType.id },
        { sportTypeId: null, venueId: null },
      ],
    },
  });

  const slotsToCreate: {
    venueId: string;
    scheduleId: string;
    timeRangeId: string;
    date: Date;
    startTime: string;
    endTime: string;
    status: 'AVAILABLE';
  }[] = [];

  let currentDateStr = startFromStr;
  while (currentDateStr <= endDateStr) {
    const dateStr = currentDateStr;
    const dayDate = new Date(dateStr + 'T00:00:00.000Z');
    const tempDate = new Date(dateStr + 'T12:00:00.000Z');
    const isoDay = tempDate.getUTCDay() === 0 ? 7 : tempDate.getUTCDay();

    // Verificar si el día completo está bloqueado
    const dayBlocked = blockedPeriods.some((bp) => {
      const bpStartStr = bp.startDate.toISOString().split('T')[0];
      const bpEndStr = bp.endDate.toISOString().split('T')[0];
      return !bp.startTime && dateStr >= bpStartStr && dateStr <= bpEndStr;
    });

    if (!dayBlocked) {
      for (const tr of activeTimeRanges) {
        if (!tr.daysOfWeek.includes(isoDay)) continue;

        const openMinutes = timeToMinutes(tr.startTime);
        const closeMinutes = timeToMinutes(tr.endTime);

        for (let start = openMinutes; start + tr.intervalMinutes <= closeMinutes; start += tr.intervalMinutes) {
          const slotStart = formatMinutes(start);
          const slotEnd = formatMinutes(start + tr.intervalMinutes);

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
              timeRangeId: tr.id,
              date: dayDate,
              startTime: slotStart,
              endTime: slotEnd,
              status: 'AVAILABLE',
            });
          }
        }
      }
    }

    const next = new Date(currentDateStr + 'T12:00:00.000Z');
    next.setUTCDate(next.getUTCDate() + 1);
    currentDateStr = next.toISOString().split('T')[0];
  }

  if (slotsToCreate.length > 0) {
    await prisma.slot.createMany({
      data: slotsToCreate,
      skipDuplicates: true,
    });
  }

  // Re-aplicar períodos bloqueados
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

  await prisma.slot.deleteMany({
    where: {
      scheduleId,
      venueId: venue.id,
      status: 'AVAILABLE',
      date: { gt: new Date(endDateStr + 'T00:00:00.000Z') },
    },
  });

  await venueSchedulesRepository.updateGeneratedUntil(scheduleId, new Date(endDateStr + 'T00:00:00.000Z'));
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

    const item = await venueSchedulesRepository.create(data);
    if (!item) throw new ValidationError('Error al crear el schedule');

    const today = new Date();
    const defaultUntil = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
    const generateUntil = item.endDate ?? defaultUntil;

    await generateSlots(item.id, generateUntil);

    broadcast('slots:invalidate', { source: 'Horarios actualizados' });
    return venueSchedulesRepository.findById(item.id);
  }

  async update(id: string, data: UpdateVenueScheduleInput) {
    await this.findById(id);
    if (data.venueId) {
      const venue = await prisma.venue.findUnique({ where: { id: data.venueId } });
      if (!venue) throw new ValidationError('Venue no encontrado');
    }
    const updated = await venueSchedulesRepository.update(id, data);
    if (!updated) throw new ValidationError('Error al actualizar el schedule');

    // Borrar todos los slots AVAILABLE futuros de este schedule
    const todayDate = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
    await prisma.slot.deleteMany({
      where: {
        scheduleId: id,
        status: 'AVAILABLE',
        date: { gte: todayDate },
      },
    });

    // Resetear generatedUntil para forzar regeneración completa
    await venueSchedulesRepository.updateGeneratedUntil(id, null);

    const defaultUntilStr = new Date(new Date().getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const newEndStr = updated.endDate ? updated.endDate.toISOString().split('T')[0] : defaultUntilStr;
    try {
      await generateSlots(id, new Date(newEndStr + 'T00:00:00.000Z'));
    } catch (err) {
      console.error('[VenueSchedules] Error al regenerar slots tras update:', err);
    }

    broadcast('slots:invalidate', { source: 'Horarios actualizados' });
    return venueSchedulesRepository.findById(id);
  }

  async delete(id: string) {
    await this.findById(id);

    const activeBookings = await prisma.booking.count({
      where: {
        slot: { scheduleId: id },
        status: { in: ['PENDING_PAYMENT', 'CONFIRMED'] },
      },
    });
    if (activeBookings > 0) {
      throw new ValidationError(
        `No se puede eliminar el horario porque tiene ${activeBookings} reserva${activeBookings > 1 ? 's' : ''} activa${activeBookings > 1 ? 's' : ''}. Cancelalas primero.`
      );
    }

    await prisma.booking.deleteMany({
      where: { slot: { scheduleId: id } },
    });

    await venueSchedulesRepository.delete(id);
    broadcast('slots:invalidate', { source: 'Horarios actualizados' });
  }

  async generateSlotsManually(id: string, until: string) {
    await this.findById(id);
    const generateUntil = new Date(until);

    await venueSchedulesRepository.update(id, { endDate: until });

    const todayDate = new Date(new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');
    await prisma.slot.deleteMany({
      where: { scheduleId: id, status: 'AVAILABLE', date: { gte: todayDate } },
    });
    await venueSchedulesRepository.updateGeneratedUntil(id, null);

    await generateSlots(id, generateUntil);
    broadcast('slots:invalidate', { source: 'Horarios actualizados' });
    return venueSchedulesRepository.findById(id);
  }
}

export const venueSchedulesService = new VenueSchedulesService();
