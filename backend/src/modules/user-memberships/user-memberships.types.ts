export interface UserMembershipWithRelations {
  id: string;
  userId: string;
  membershipPlanId: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'EXPIRED';
  startDate: Date;
  endDate: Date | null;
  reservationsUsedMonth: number;
  currentMonthYear: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  membershipPlan: {
    id: string;
    name: string;
    price: any;
    monthlyReservationLimit: number | null;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
