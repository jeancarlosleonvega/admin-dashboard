import { prisma } from '../../infrastructure/database/client.js';
import type { SystemConfigItem } from './system-config.types.js';

export class SystemConfigRepository {
  async findAll(): Promise<SystemConfigItem[]> {
    return prisma.systemConfig.findMany({ orderBy: [{ group: 'asc' }, { key: 'asc' }] });
  }

  async findByKey(key: string): Promise<SystemConfigItem | null> {
    return prisma.systemConfig.findUnique({ where: { key } });
  }

  async upsert(data: { key: string; value: string; label?: string; group?: string }): Promise<SystemConfigItem> {
    return prisma.systemConfig.upsert({
      where: { key: data.key },
      update: { value: data.value, label: data.label, group: data.group },
      create: data,
    });
  }

  async delete(key: string): Promise<void> {
    await prisma.systemConfig.delete({ where: { key } });
  }
}

export const systemConfigRepository = new SystemConfigRepository();
