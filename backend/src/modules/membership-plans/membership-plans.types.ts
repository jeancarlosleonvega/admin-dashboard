export interface MembershipPlanSportPrice {
  id: string;
  membershipPlanId: string;
  sportTypeId: string;
  baseBookingPrice: any; // Decimal
}

export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: any; // Decimal
  monthlyReservationLimit: number | null;
  sportTypeId: string | null;
  active: boolean;
  walletCreditEnabled: boolean;
  walletCreditAmount: any | null;
  walletPaymentEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipPlanWithSportType extends MembershipPlan {
  sportType: { id: string; name: string } | null;
  sportPrices: MembershipPlanSportPrice[];
}
