export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  baseBookingPrice: number;
  monthlyReservationLimit: number | null;
  sportTypeId: string | null;
  walletCreditEnabled: boolean;
  walletCreditAmount: number | null;
  walletPaymentEnabled: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  sportType: { id: string; name: string } | null;
}

export interface MembershipPlanFilters {
  search?: string;
  active?: 'true' | 'false';
  sportTypeId?: string;
  page?: number;
  limit?: number;
}
