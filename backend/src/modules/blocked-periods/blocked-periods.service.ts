import { blockedPeriodsRepository } from './blocked-periods.repository.js';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { broadcast } from '../../shared/utils/wsBroadcast.js';
import type { CreateBlockedPeriodInput, UpdateBlockedPeriodInput, BlockedPeriodFiltersInput } from './blocked-periods.schema.js';

async function applyBlockedPeriodToSlots(
  startDate: Date,
  endDate: Date,
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  venueId: string | null | undefined,
  sportTypeId: string | null | undefined
) {
  const where: any = {
    status: 'AVAILABLE',
    date: { gte: startDate, lte: endDate },
  };

  if (venueId) {
    where.venueId = venueId;
  } else if (sportTypeId) {
    where.venue = { sportTypeId };
  }

  if (startTime && endTime) {
    where.startTime = { gte: startTime };
    where.endTime = { lte: endTime };
  }

  await prisma.slot.updateMany({ where, data: { status: 'BLOCKED' } });
}

async function revertBlockedPeriodSlots(
  startDate: Date,
  endDate: Date,
  startTime: string | null | undefined,
  endTime: string | null | undefined,
  venueId: string | null | undefined,
  sportTypeId: string | null | undefined
) {
  const where: any = {
    status: 'BLOCKED',
    date: { gte: startDate, lte: endDate },
    booking: null,
  };

  if (venueId) {
    where.venueId = venueId;
  } else if (sportTypeId) {
    where.venue = { sportTypeId };
  }

  if (startTime && endTime) {
    where.startTime = { gte: startTime };
    where.endTime = { lte: endTime };
  }

  await prisma.slot.updateMany({ where, data: { status: 'AVAILABLE' } });
}

export class BlockedPeriodsService {
  async findAll(filters: BlockedPeriodFiltersInput) {
    const { page, limit, ...rest } = filters;
    const { items, total } = await blockedPeriodsRepository.findAll(rest, page, limit);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    const item = await blockedPeriodsRepository.findById(id);
    if (!item) throw new NotFoundError('Período bloqueado');
    return item;
  }

  async create(data: CreateBlockedPeriodInput) {
    const item = await blockedPeriodsRepository.create(data);

    if (item.active) {
      await applyBlockedPeriodToSlots(
        item.startDate,
        item.endDate,
        item.startTime,
        item.endTime,
        item.venueId,
        item.sportTypeId
      );
    }

    broadcast('slots:invalidate', { source: 'Horarios actualizados' });
    return item;
  }

  async update(id: string, data: UpdateBlockedPeriodInput) {
    const existing = await this.findById(id);
    const updated = await blockedPeriodsRepository.update(id, data);

    // Si se activa, bloquear slots
    if (!existing.active && updated.active) {
      await applyBlockedPeriodToSlots(
        updated.startDate,
        updated.endDate,
        updated.startTime,
        updated.endTime,
        updated.venueId,
        updated.sportTypeId
      );
    }

    // Si se desactiva, revertir slots sin booking
    if (existing.active && !updated.active) {
      await revertBlockedPeriodSlots(
        updated.startDate,
        updated.endDate,
        updated.startTime,
        updated.endTime,
        updated.venueId,
        updated.sportTypeId
      );
    }

    broadcast('slots:invalidate', { source: 'Horarios actualizados' });
    return updated;
  }

  async delete(id: string) {
    const existing = await this.findById(id);

    // Revertir slots si estaba activo
    if (existing.active) {
      await revertBlockedPeriodSlots(
        existing.startDate,
        existing.endDate,
        existing.startTime,
        existing.endTime,
        existing.venueId,
        existing.sportTypeId
      );
    }

    await blockedPeriodsRepository.delete(id);
    broadcast('slots:invalidate', { source: 'Horarios actualizados' });
  }
}

export const blockedPeriodsService = new BlockedPeriodsService();
