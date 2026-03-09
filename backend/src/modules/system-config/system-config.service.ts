import { systemConfigRepository } from './system-config.repository.js';
import { NotFoundError } from '../../shared/errors/NotFoundError.js';
import type { SystemConfigItem } from './system-config.types.js';
import type { UpsertConfigInput } from './system-config.schema.js';

export class SystemConfigService {
  async findAll(): Promise<SystemConfigItem[]> {
    return systemConfigRepository.findAll();
  }

  async findByKey(key: string): Promise<SystemConfigItem> {
    const config = await systemConfigRepository.findByKey(key);
    if (!config) throw new NotFoundError(`Config key '${key}'`);
    return config;
  }

  async upsert(data: UpsertConfigInput): Promise<SystemConfigItem> {
    return systemConfigRepository.upsert(data);
  }

  async delete(key: string): Promise<void> {
    const config = await systemConfigRepository.findByKey(key);
    if (!config) throw new NotFoundError(`Config key '${key}'`);
    await systemConfigRepository.delete(key);
  }
}

export const systemConfigService = new SystemConfigService();
