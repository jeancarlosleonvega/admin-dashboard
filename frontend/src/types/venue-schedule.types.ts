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
    allowedValues?: { value: string; label: string }[] | null;
    isSystem?: boolean;
  };
}

export interface ScheduleRule {
  id: string;
  canBook: boolean;
  priceOverride?: number | null;
  revenueManagementEnabled: boolean;
  conditions: ScheduleRuleCondition[];
}

export interface ScheduleTimeRange {
  id: string;
  scheduleId: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  playersPerSlot: number;
  active: boolean;
  rules?: ScheduleRule[];
}

export interface VenueOperatingHours {
  id: string;
  venueId: string;
  daysOfWeek: number[];
  openTime: string;
  closeTime: string;
}

export interface VenueSchedule {
  id: string;
  venueId: string;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  generatedUntil?: string | null;
  active: boolean;
  createdAt: string;
  venue?: { id: string; name: string; sportType: { id: string; name: string }; operatingHours?: VenueOperatingHours[] };
  timeRanges?: ScheduleTimeRange[];
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
    priceOverride?: number | null;
    revenueManagementEnabled: boolean;
  } | null;
  venue?: {
    id: string;
    name: string;
    sportType: { id: string; name: string };
  };
}

export interface DayAvailability {
  date: string;
  availableSlots: number;
}
