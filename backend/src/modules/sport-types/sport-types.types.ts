export interface SportType {
  id: string;
  name: string;
  description: string | null;
  defaultIntervalMinutes: number;
  defaultPlayersPerSlot: number;
  defaultOpenTime: string;
  defaultCloseTime: string;
  defaultEnabledDays: number[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
