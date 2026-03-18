import { configRepository } from './config.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import type { ConfigItem } from './config.types.js';
import type { UpsertConfigInput, UpsertManyConfigInput } from './config.schema.js';

export class ConfigService {
  async findAll(group?: string): Promise<ConfigItem[]> {
    return configRepository.findAll(group);
  }

  async findByKey(key: string): Promise<ConfigItem> {
    const config = await configRepository.findByKey(key);
    if (!config) throw new NotFoundError(`Config key '${key}'`);
    return config;
  }

  async upsert(data: UpsertConfigInput): Promise<ConfigItem> {
    return configRepository.upsert(data);
  }

  async upsertMany(data: UpsertManyConfigInput): Promise<ConfigItem[]> {
    return configRepository.upsertMany(data.items);
  }

  async delete(key: string): Promise<void> {
    const config = await configRepository.findByKey(key);
    if (!config) throw new NotFoundError(`Config key '${key}'`);
    await configRepository.delete(key);
  }
}

export const configService = new ConfigService();
