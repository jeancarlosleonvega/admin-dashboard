export type UserMembershipStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';

export interface UserMembership {
  id: string;
  userId: string;
  membershipPlanId: string;
  status: UserMembershipStatus;
  startDate: string;
  endDate?: string | null;
  reservationsUsedMonth: number;
  currentMonthYear?: string | null;
  notes?: string | null;
  mpSubscriptionId?: string | null;
  createdAt: string;
  updatedAt: string;
  membershipPlan: { id: string; name: string; price: number; monthlyReservationLimit: number | null };
  user?: { id: string; firstName: string; lastName: string; email: string };
}
