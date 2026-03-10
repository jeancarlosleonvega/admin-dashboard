import { usersRepository } from './users.repository.js';
import { hashPassword } from '../../shared/utils/password.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import { ValidationError } from '../../shared/errors/ValidationError.js';
import { invalidateUserPermissions } from '../../shared/middlewares/authorize.js';
import { prisma } from '../../infrastructure/database/client.js';
import type { CreateUserInput, UpdateUserInput, UserFiltersInput, UpdateProfileInput } from './users.schema.js';
import type { PaginatedUsers, UserWithRoles, SafeUser } from './users.types.js';

export class UsersService {
  async findAll(filters: UserFiltersInput): Promise<PaginatedUsers> {
    const { page, limit, ...filterParams } = filters;
    const { users, total } = await usersRepository.findAll(filterParams, page, limit);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<UserWithRoles> {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async create(data: CreateUserInput): Promise<SafeUser> {
    // Check if email already exists
    const existing = await usersRepository.findByEmail(data.email);
    if (existing) {
      throw new ValidationError('Email already registered');
    }

    const passwordHash = await hashPassword(data.password);

    return usersRepository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      roleIds: data.roleIds,
    });
  }

  async update(id: string, data: UpdateUserInput): Promise<SafeUser> {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check email uniqueness if being updated
    if (data.email && data.email !== user.email) {
      const existing = await usersRepository.findByEmail(data.email);
      if (existing) {
        throw new ValidationError('Email already in use');
      }
    }

    const updatedUser = await usersRepository.update(id, data);

    // Invalidate permissions cache if roles were updated
    if (data.roleIds) {
      await invalidateUserPermissions(id);
    }

    return updatedUser;
  }

  async delete(id: string): Promise<void> {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await usersRepository.delete(id);
  }

  async bulkDelete(ids: string[]): Promise<number> {
    return usersRepository.bulkDelete(ids);
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new NotFoundError('Usuario');

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        sex: data.sex as any,
        birthDate: new Date(data.birthDate),
        handicap: data.handicap,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        sex: true,
        birthDate: true,
        handicap: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const profileCompleted = !!(updated.sex && updated.birthDate && updated.handicap != null);
    return { ...updated, profileCompleted };
  }
}

export const usersService = new UsersService();
