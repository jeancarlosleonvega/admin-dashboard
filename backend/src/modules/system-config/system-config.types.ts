export interface SystemConfigItem {
  id: string;
  key: string;
  value: string;
  label: string | null;
  group: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertConfigInput {
  key: string;
  value: string;
  label?: string;
  group?: string;
}
