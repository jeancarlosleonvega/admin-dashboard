import { prisma } from '../../infrastructure/database/client.js';
import type { ConfigItem } from './config.types.js';

export class ConfigRepository {
  async findAll(group?: string): Promise<ConfigItem[]> {
    return prisma.systemConfig.findMany({
      where: group ? { group } : undefined,
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    });
  }

  async findByKey(key: string): Promise<ConfigItem | null> {
    return prisma.systemConfig.findUnique({ where: { key } });
  }

  async upsert(data: { key: string; value: string; label?: string; group?: string }): Promise<ConfigItem> {
    return prisma.systemConfig.upsert({
      where: { key: data.key },
      update: { value: data.value, label: data.label, group: data.group },
      create: data,
    });
  }

  async upsertMany(items: { key: string; value: string; label?: string; group?: string }[]): Promise<ConfigItem[]> {
    const results = await Promise.all(items.map((item) => this.upsert(item)));
    return results;
  }

  async delete(key: string): Promise<void> {
    await prisma.systemConfig.delete({ where: { key } });
  }
}

export const configRepository = new ConfigRepository();
