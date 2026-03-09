export interface MembershipPlan {
  id: string;
  name: string;
  description: string | null;
  price: any; // Decimal
  monthlyReservationLimit: number | null;
  sportTypeId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MembershipPlanWithSportType extends MembershipPlan {
  sportType: { id: string; name: string } | null;
}
