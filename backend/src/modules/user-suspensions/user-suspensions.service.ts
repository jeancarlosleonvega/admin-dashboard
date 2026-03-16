import { userSuspensionsRepository } from './user-suspensions.repository.js';
import { prisma } from '../../infrastructure/database/client.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import type { CreateSuspensionInput } from './user-suspensions.schema.js';

export class UserSuspensionsService {
  async findByUser(userId: string) {
    return userSuspensionsRepository.findByUser(userId);
  }

  async create(adminId: string, data: CreateSuspensionInput) {
    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) throw new NotFoundError('Usuario');

    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : undefined;

    if (endDate && endDate <= startDate) {
      throw new ValidationError('La fecha de fin debe ser posterior a la de inicio');
    }

    const suspension = await userSuspensionsRepository.create({
      userId: data.userId,
      reason: data.reason,
      startDate,
      endDate: endDate ?? null,
      isAutomatic: false,
      createdById: adminId,
    });

    // Si la suspensión ya está vigente, actualizar el estado del usuario
    if (startDate <= new Date()) {
      await prisma.user.update({
        where: { id: data.userId },
        data: { status: 'SUSPENDED' },
      });
    }

    return suspension;
  }

  async lift(id: string, adminId: string) {
    const suspension = await userSuspensionsRepository.findById(id);
    if (!suspension) throw new NotFoundError('Suspensión');
    if (suspension.liftedAt) throw new ValidationError('La suspensión ya fue levantada');

    const lifted = await userSuspensionsRepository.lift(id, adminId);

    // Verificar si hay otras suspensiones activas
    const otherActive = await userSuspensionsRepository.findActive(suspension.userId);
    if (!otherActive) {
      await prisma.user.update({
        where: { id: suspension.userId },
        data: { status: 'ACTIVE' },
      });
    }

    return lifted;
  }
}

export const userSuspensionsService = new UserSuspensionsService();
