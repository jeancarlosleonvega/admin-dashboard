export interface ScheduleRuleCondition {
  id: string;
  conditionTypeId: string;
  operator: 'EQ' | 'NEQ' | 'GT' | 'GTE' | 'LT' | 'LTE';
  value: string;
  logicalOperator?: 'AND' | 'OR' | null;
  order: number;
  conditionType: {
    id: string;
    name: string;
    key: string;
    dataType: 'NUMBER' | 'STRING' | 'UUID' | 'ENUM';
    allowedOperators: string[];
  };
}

export interface ScheduleRule {
  id: string;
  canBook: boolean;
  basePrice: number;
  revenueManagementEnabled: boolean;
  conditions: ScheduleRuleCondition[];
}

export interface VenueSchedule {
  id: string;
  venueId: string;
  name: string;
  startDate: string;
  endDate?: string | null;
  daysOfWeek: number[];
  openTime?: string | null;
  closeTime?: string | null;
  intervalMinutes?: number | null;
  playersPerSlot?: number | null;
  generatedUntil?: string | null;
  active: boolean;
  createdAt: string;
  venue?: { id: string; name: string; playersPerSlot?: number | null; sportType: { id: string; name: string; defaultPlayersPerSlot?: number } };
  rules?: ScheduleRule[];
}

export interface SlotAvailability {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
  venueId?: string;
  playersPerSlot?: number | null;
  price?: number | null;
  scheduleRule?: {
    ruleId: string;
    canBook: boolean;
    basePrice: number;
    revenueManagementEnabled: boolean;
  } | null;
  venue?: {
    id: string;
    name: string;
    playersPerSlot?: number | null;
    sportType: { id: string; name: string; defaultPlayersPerSlot?: number };
  };
}

export interface DayAvailability {
  date: string;
  availableSlots: number;
}
