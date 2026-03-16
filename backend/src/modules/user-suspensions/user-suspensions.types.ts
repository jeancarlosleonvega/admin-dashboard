export interface UserSuspensionItem {
  id: string;
  userId: string;
  reason: string;
  startDate: Date;
  endDate: Date | null;
  isAutomatic: boolean;
  liftedAt: Date | null;
  liftedById: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: { firstName: string; lastName: string };
  liftedBy?: { firstName: string; lastName: string } | null;
}

export interface CreateSuspensionInput {
  userId: string;
  reason: string;
  startDate: string;
  endDate?: string;
}
