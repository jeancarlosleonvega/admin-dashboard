import { prisma } from '../../infrastructure/database/client.js';
import type { SlotsSearchInput } from './slots.schema.js';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  membershipPlanId?: string | null;
  sex?: string | null;
  birthDate?: Date | null;
  handicap?: number | null;
}

type SlotBase = {
  id: string;
  venueId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: string;
  [key: string]: unknown;
};

// ─── Helpers de evaluación de condiciones ────────────────────────────────────

function calcularEdad(birthDate: Date): number {
  const hoy = new Date();
  let edad = hoy.getFullYear() - birthDate.getFullYear();
  const mes = hoy.getMonth() - birthDate.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < birthDate.getDate())) edad--;
  return edad;
}

function evaluarCondicion(
  condition: {
    conditionTypeId: string;
    operator: string;
    value: string;
    conditionType: { key: string };
  },
  profile: UserProfile,
): boolean {
  const { key } = condition.conditionType;
  const { operator, value } = condition;

  if (key === 'membership_plan') {
    const userVal = profile.membershipPlanId ?? null;
    if (operator === 'EQ') return userVal === value;
    if (operator === 'NEQ') return userVal !== value;
    return false;
  }

  if (key === 'sex') {
    const userVal = profile.sex ?? null;
    if (operator === 'EQ') return userVal === value;
    if (operator === 'NEQ') return userVal !== value;
    return false;
  }

  if (key === 'age') {
    if (!profile.birthDate) return false;
    const edad = calcularEdad(profile.birthDate);
    const condVal = parseInt(value, 10);
    if (operator === 'EQ') return edad === condVal;
    if (operator === 'NEQ') return edad !== condVal;
    if (operator === 'GT') return edad > condVal;
    if (operator === 'GTE') return edad >= condVal;
    if (operator === 'LT') return edad < condVal;
    if (operator === 'LTE') return edad <= condVal;
    return false;
  }

  if (key === 'handicap') {
    if (profile.handicap == null) return false;
    const condVal = parseFloat(value);
    if (operator === 'EQ') return profile.handicap === condVal;
    if (operator === 'NEQ') return profile.handicap !== condVal;
    if (operator === 'GT') return profile.handicap > condVal;
    if (operator === 'GTE') return profile.handicap >= condVal;
    if (operator === 'LT') return profile.handicap < condVal;
    if (operator === 'LTE') return profile.handicap <= condVal;
    return false;
  }

  return false;
}

function evaluarRule(
  rule: {
    conditions: Array<{
      order: number;
      logicalOperator: string | null;
      conditionTypeId: string;
      operator: string;
      value: string;
      conditionType: { key: string };
    }>;
  },
  profile: UserProfile,
): boolean {
  const conditions = [...rule.conditions].sort((a, b) => a.order - b.order);
  if (conditions.length === 0) return true;

  let resultado = evaluarCondicion(conditions[0], profile);
  for (let i = 1; i < conditions.length; i++) {
    const cond = conditions[i];
    const condResult = evaluarCondicion(cond, profile);
    if (cond.logicalOperator === 'AND') {
      resultado = resultado && condResult;
    } else if (cond.logicalOperator === 'OR') {
      resultado = resultado || condResult;
    }
  }
  return resultado;
}

// ─── Resumen de condiciones de acceso ────────────────────────────────────────

function buildConditionsSummary(
  rules: Array<{
    conditions: Array<{
      conditionType: { key: string };
      operator: string;
      value: string;
    }>;
  }>,
  planNames: Map<string, string>,
): string | null {
  if (rules.length === 0) return null;
  const opLabel: Record<string, string> = { EQ: '=', NEQ: '≠', GT: '>', GTE: '≥', LT: '<', LTE: '≤' };
  const parts: string[] = [];
  for (const rule of rules) {
    for (const cond of rule.conditions) {
      const { key } = cond.conditionType;
      const op = cond.operator;
      const val = cond.value;
      if (key === 'membership_plan') {
        const name = planNames.get(val) ?? 'membresía';
        parts.push(op === 'EQ' ? `Solo ${name}` : `Sin ${name}`);
      } else if (key === 'sex') {
        parts.push(val === 'MALE' ? 'Solo hombres' : 'Solo mujeres');
      } else if (key === 'age') {
        parts.push(`Edad ${opLabel[op] ?? op} ${val}`);
      } else if (key === 'handicap') {
        parts.push(`Handicap ${opLabel[op] ?? op} ${val}`);
      }
    }
  }
  const unique = Array.from(new Set(parts));
  return unique.length > 0 ? unique.join(' · ') : null;
}

// ─── Precio base del plan de membresía por deporte ───────────────────────────

async function getMembershipSportPrice(membershipPlanId: string | null, sportTypeId: string): Promise<number | null> {
  if (!membershipPlanId) return null;
  const sportPrice = await prisma.membershipPlanSportPrice.findUnique({
    where: {
      membershipPlanId_sportTypeId: { membershipPlanId, sportTypeId },
    },
    select: { baseBookingPrice: true },
  });
  return sportPrice ? parseFloat(sportPrice.baseBookingPrice.toString()) : null;
}

// ─── Motor de Revenue Management ─────────────────────────────────────────────

async function calcularPrecioRevenue(
  basePrice: number,
  slotStartTime: string,
  slotDate: Date,
  slotVenueId: string,
  sportTypeId: string,
  userProfile?: UserProfile,
): Promise<number> {
  const config = await prisma.pricingConfig.findUnique({
    where: { sportTypeId },
    include: {
      factors: {
        where: { enabled: true },
        include: {
          factorType: true,
          rules: true,
        },
      },
    },
  });

  if (!config || !config.enabled) return basePrice;

  const dow = slotDate.getDay();
  const dayType = dow === 0 || dow === 6 ? 'WEEKEND' : dow === 5 ? 'FRIDAY' : 'WEEKDAY';

  const [totalSlots, bookedSlots] = await Promise.all([
    prisma.slot.count({ where: { venueId: slotVenueId, date: slotDate } }),
    prisma.slot.count({ where: { venueId: slotVenueId, date: slotDate, status: 'BOOKED' } }),
  ]);
  const occupancyPct = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  const age = userProfile?.birthDate ? calcularEdad(userProfile.birthDate) : null;

  const resolver: Record<string, unknown> = {
    startTime: slotStartTime,
    dayOfWeek: dayType,
    occupancyPct,
    age,
    sex: userProfile?.sex ?? null,
    handicap: userProfile?.handicap ?? null,
  };

  let price = basePrice;

  for (const factor of config.factors) {
    const key = factor.factorType.key;
    const valueType = factor.factorType.valueType;
    const contextValue = resolver[key];
    if (contextValue === null || contextValue === undefined) continue;

    let multiplier: number | null = null;

    if (valueType === 'ENUM') {
      const rule = factor.rules.find((r) => r.enumValue === String(contextValue));
      if (rule) multiplier = parseFloat(rule.multiplier.toString());
    } else if (valueType === 'TIME_RANGE') {
      const rule = factor.rules.find(
        (r) => r.minValue && r.maxValue && String(contextValue) >= r.minValue && String(contextValue) < r.maxValue,
      );
      if (rule) multiplier = parseFloat(rule.multiplier.toString());
    } else if (valueType === 'NUMBER_RANGE') {
      const numVal = typeof contextValue === 'number' ? contextValue : parseFloat(String(contextValue));
      const rule = factor.rules.find(
        (r) => r.minValue !== null && r.maxValue !== null && numVal >= parseFloat(r.minValue!) && numVal <= parseFloat(r.maxValue!),
      );
      if (rule) multiplier = parseFloat(rule.multiplier.toString());
    }

    if (multiplier !== null) price *= multiplier;
  }

  const minP = parseFloat(config.minPrice.toString());
  const maxP = parseFloat(config.maxPrice.toString());
  if (minP > 0) price = Math.max(price, minP);
  if (maxP < 999999) price = Math.min(price, maxP);
  if (config.roundingStep > 0) {
    price = Math.round(price / config.roundingStep) * config.roundingStep;
  }

  return price;
}

// ─── Filtrado por reglas (lógica central compartida) ─────────────────────────

async function applyRuleFilter<T extends SlotBase>(
  slots: T[],
  userProfile: UserProfile,
  sportTypeId: string,
): Promise<(Omit<T, 'scheduleId'> & { price: number | null; scheduleRule: object | null })[]> {
  const resultado: (Omit<T, 'scheduleId'> & { price: number | null; scheduleRule: object | null })[] = [];

  const baseBookingPrice = await getMembershipSportPrice(userProfile.membershipPlanId ?? null, sportTypeId);

  for (const slot of slots) {
    const slotWithTr = slot as T & { timeRangeId?: string | null };
    const slotDate = slot.date;
    const isoDay = slotDate.getUTCDay() === 0 ? 7 : slotDate.getUTCDay();

    let timeRangesWithRules: Array<{
      id: string;
      startTime: string;
      endTime: string;
      playersPerSlot: number;
      schedule: { startDate: Date | null; endDate: Date | null };
      rules: Array<{
        id: string;
        canBook: boolean;
        priceOverride: any;
        revenueManagementEnabled: boolean;
        conditions: Array<{
          order: number;
          logicalOperator: string | null;
          conditionTypeId: string;
          operator: string;
          value: string;
          conditionType: { key: string };
        }>;
      }>;
    }> = [];

    if (slotWithTr.timeRangeId) {
      // Lookup directo por timeRangeId
      const tr = await prisma.scheduleTimeRange.findUnique({
        where: { id: slotWithTr.timeRangeId },
        include: {
          schedule: { select: { startDate: true, endDate: true, active: true } },
          rules: {
            include: {
              conditions: {
                include: { conditionType: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });
      if (tr && tr.schedule.active) {
        timeRangesWithRules = [tr as any];
      }
    } else {
      // Legacy: buscar timeRanges que cubren este slot
      const coveringTimeRanges = await prisma.scheduleTimeRange.findMany({
        where: {
          active: true,
          daysOfWeek: { has: isoDay },
          startTime: { lte: slot.startTime },
          endTime: { gt: slot.startTime },
          schedule: {
            venueId: slot.venueId,
            active: true,
            OR: [{ startDate: null }, { startDate: { lte: slotDate } }],
            AND: [{ OR: [{ endDate: null }, { endDate: { gte: slotDate } }] }],
          },
        },
        include: {
          schedule: { select: { startDate: true, endDate: true, active: true } },
          rules: {
            include: {
              conditions: {
                include: { conditionType: true },
                orderBy: { order: 'asc' },
              },
            },
          },
        },
      });
      timeRangesWithRules = coveringTimeRanges as any;
    }

    // Sin timeRange activo: incluir con precio base
    if (timeRangesWithRules.length === 0) {
      const { scheduleId: _sid, ...slotSinScheduleId } = slot as T & { scheduleId?: unknown };
      resultado.push({ ...slotSinScheduleId, price: baseBookingPrice, playersPerSlot: null, scheduleRule: null });
      continue;
    }

    const withRules = timeRangesWithRules.filter((tr) => tr.rules.length > 0);

    if (withRules.length === 0) {
      // Sin reglas: acceso libre con precio base
      const tr = timeRangesWithRules[0];
      const { scheduleId: _sid, ...slotSinScheduleId } = slot as T & { scheduleId?: unknown };
      resultado.push({ ...slotSinScheduleId, price: baseBookingPrice, playersPerSlot: tr.playersPerSlot, scheduleRule: null });
      continue;
    }

    // El timeRange más específico (menor rango de fecha)
    const masEspecifico = withRules.sort((a, b) => {
      const msPerDay = 1000 * 60 * 60 * 24;
      const endA = a.schedule.endDate ?? new Date((a.schedule.startDate?.getTime() ?? Date.now()) + 365 * msPerDay);
      const endB = b.schedule.endDate ?? new Date((b.schedule.startDate?.getTime() ?? Date.now()) + 365 * msPerDay);
      const startA = a.schedule.startDate ?? new Date(0);
      const startB = b.schedule.startDate ?? new Date(0);
      const rangoA = (endA.getTime() - startA.getTime()) / msPerDay;
      const rangoB = (endB.getTime() - startB.getTime()) / msPerDay;
      return rangoA - rangoB;
    })[0];

    let ruleGanadora: any = null;
    let maxConditions = -1;
    for (const rule of masEspecifico.rules) {
      if (evaluarRule(rule, userProfile)) {
        const condCount = rule.conditions.length;
        if (condCount > maxConditions) {
          maxConditions = condCount;
          ruleGanadora = rule;
        }
      }
    }

    if (!ruleGanadora) continue;
    if (!ruleGanadora.canBook) continue;

    const { scheduleId: _sid, ...slotSinScheduleId } = slot as T & { scheduleId?: unknown };

    // priceOverride tiene prioridad; si no hay, usar precio base de membresía
    const priceOverride = ruleGanadora.priceOverride != null ? parseFloat(ruleGanadora.priceOverride.toString()) : null;
    const effectiveBasePrice = priceOverride ?? baseBookingPrice ?? 0;

    const finalPrice = ruleGanadora.revenueManagementEnabled && sportTypeId
      ? await calcularPrecioRevenue(effectiveBasePrice, slot.startTime, slot.date, slot.venueId, sportTypeId, userProfile)
      : effectiveBasePrice;

    resultado.push({
      ...slotSinScheduleId,
      price: finalPrice,
      playersPerSlot: masEspecifico.playersPerSlot,
      scheduleRule: {
        ruleId: ruleGanadora.id,
        canBook: ruleGanadora.canBook,
        priceOverride: priceOverride,
        revenueManagementEnabled: ruleGanadora.revenueManagementEnabled,
      },
    });
  }

  return resultado;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class SlotsRepository {
  async findByVenueAndDate(venueId: string, date: string, scheduleId?: string, userProfile?: UserProfile) {
    const dateObj = new Date(date + 'T00:00:00.000Z');
    const slots = await prisma.slot.findMany({
      where: { venueId, date: dateObj, status: 'AVAILABLE', ...(scheduleId && { scheduleId }) },
      orderBy: { startTime: 'asc' },
      select: {
        id: true,
        venueId: true,
        timeRangeId: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        venue: {
          select: {
            id: true,
            name: true,
            sportType: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!userProfile) return slots.map((s) => ({ ...s, price: null, scheduleRule: null }));

    const venueInfo = slots.length > 0
      ? await prisma.venue.findUnique({ where: { id: slots[0].venueId }, select: { sportTypeId: true } })
      : null;
    const sportTypeId = venueInfo?.sportTypeId ?? '';

    return applyRuleFilter(slots, userProfile, sportTypeId);
  }

  async searchAvailable(input: SlotsSearchInput, userProfile?: UserProfile) {
    const start = new Date(input.startDate + 'T00:00:00.000Z');
    const end = input.endDate ? new Date(input.endDate + 'T00:00:00.000Z') : undefined;

    const now = new Date();
    const nowArgentina = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayArgentina = nowArgentina.toISOString().slice(0, 10);
    const currentTimeArgentina = nowArgentina.toISOString().slice(11, 16);

    const slots = await prisma.slot.findMany({
      where: {
        date: end ? { gte: start, lte: end } : { gte: start },
        status: 'AVAILABLE',
        ...(input.venueId && { venueId: input.venueId }),
        ...(input.startTime && { startTime: { gte: input.startTime } }),
        ...(input.endTime && { endTime: { lte: input.endTime } }),
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }, { venue: { name: 'asc' } }],
      select: {
        id: true,
        venueId: true,
        scheduleId: true,
        timeRangeId: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        timeRange: { select: { playersPerSlot: true } },
        venue: {
          select: {
            id: true,
            name: true,
            sportType: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Filtrar slots cuya fecha+hora ya pasó en Argentina
    const futureSlots = slots.filter((s) => {
      const slotDate = s.date.toISOString().slice(0, 10);
      if (slotDate > todayArgentina) return true;
      if (slotDate < todayArgentina) return false;
      return s.startTime > currentTimeArgentina;
    });

    const withPPS = futureSlots.map((s) => ({
      ...s,
      price: null as number | null,
      playersPerSlot: s.timeRange?.playersPerSlot ?? null,
      scheduleRule: null as object | null,
    }));

    const filterByPlayers = (items: typeof withPPS) =>
      input.numPlayers && input.numPlayers > 0
        ? items.filter((s) => s.playersPerSlot == null || s.playersPerSlot <= input.numPlayers!)
        : items;

    if (!userProfile) return filterByPlayers(withPPS);

    // Obtener sportTypeId del primer venue
    const venueInfo = futureSlots.length > 0
      ? await prisma.venue.findUnique({ where: { id: futureSlots[0].venueId }, select: { sportTypeId: true } })
      : null;
    const sportTypeId = venueInfo?.sportTypeId ?? '';

    const filtered = await applyRuleFilter(futureSlots, userProfile, sportTypeId);
    return input.numPlayers && input.numPlayers > 0
      ? filtered.filter((s) => (s as any).playersPerSlot == null || (s as any).playersPerSlot <= input.numPlayers!)
      : filtered;
  }

  async getAgenda(date: string) {
    const dateObj = new Date(date + 'T00:00:00.000Z');

    const plans = await prisma.membershipPlan.findMany({ select: { id: true, name: true } });
    const planNames = new Map(plans.map((p) => [p.id, p.name]));

    const slots = await prisma.slot.findMany({
      where: { date: dateObj },
      orderBy: [{ venue: { name: 'asc' } }, { startTime: 'asc' }],
      include: {
        venue: { select: { id: true, name: true } },
        schedule: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        timeRange: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            rules: {
              include: {
                conditions: {
                  include: { conditionType: { select: { key: true } } },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        booking: {
          select: {
            id: true,
            numPlayers: true,
            status: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    // Build columns: 1 per unique venue
    const venueMap = new Map<string, { venueId: string; venueName: string }>();
    for (const slot of slots) {
      if (!venueMap.has(slot.venueId)) {
        venueMap.set(slot.venueId, { venueId: slot.venueId, venueName: slot.venue.name });
      }
    }
    const columns = Array.from(venueMap.values()).sort((a, b) => a.venueName.localeCompare(b.venueName));

    // Unique sorted hours
    const hoursSet = new Set<string>();
    for (const slot of slots) hoursSet.add(slot.startTime);
    const hours = Array.from(hoursSet).sort();

    // Group by (venueId, startTime) — pick "winning" slot per cell
    const groups = new Map<string, (typeof slots)[number][]>();
    for (const slot of slots) {
      const key = `${slot.venueId}__${slot.startTime}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(slot);
    }

    const slotList = Array.from(groups.values()).map((group) => {
      // Prefer slots whose timeRange has rules; otherwise pick first
      const withRules = group.filter((s) => s.timeRange && s.timeRange.rules.length > 0);
      const winner = withRules.length > 0 ? withRules[0] : group[0];

      const conditions = buildConditionsSummary(winner.timeRange?.rules ?? [], planNames);
      const activeBooking =
        winner.booking && ['CONFIRMED', 'PENDING_PAYMENT'].includes(winner.booking.status)
          ? winner.booking
          : null;

      return {
        id: winner.id,
        venueId: winner.venueId,
        startTime: winner.startTime,
        endTime: winner.endTime,
        status: winner.status,
        scheduleName: winner.schedule?.name ?? null,
        conditions,
        booking: activeBooking
          ? {
              id: activeBooking.id,
              userName: `${activeBooking.user.firstName} ${activeBooking.user.lastName}`,
              numPlayers: activeBooking.numPlayers,
            }
          : null,
      };
    });

    return { columns, hours, slots: slotList };
  }

  async getAgendaMonthAvailability(startDate: string, endDate: string) {
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');

    const results = await prisma.slot.groupBy({
      by: ['date', 'status'],
      where: { date: { gte: start, lte: end } },
      _count: { id: true },
    });

    const dayMap = new Map<string, { available: number; booked: number; blocked: number }>();
    for (const row of results) {
      const ds = row.date.toISOString().split('T')[0];
      if (!dayMap.has(ds)) dayMap.set(ds, { available: 0, booked: 0, blocked: 0 });
      const entry = dayMap.get(ds)!;
      if (row.status === 'AVAILABLE') entry.available += row._count.id;
      else if (row.status === 'BOOKED') entry.booked += row._count.id;
      else if (row.status === 'BLOCKED') entry.blocked += row._count.id;
    }

    return Array.from(dayMap.entries()).map(([date, counts]) => ({ date, ...counts }));
  }

  async findAvailabilityByVenueAndRange(venueId: string, startDate: string, endDate: string, scheduleId?: string, openTime?: string, closeTime?: string) {
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');

    const slots = await prisma.slot.groupBy({
      by: ['date'],
      where: {
        venueId,
        date: { gte: start, lte: end },
        status: 'AVAILABLE',
        ...(scheduleId && { scheduleId }),
        ...(openTime && { startTime: { gte: openTime } }),
        ...(closeTime && { startTime: { lt: closeTime } }),
      },
      _count: { id: true },
      orderBy: { date: 'asc' },
    });

    return slots.map((s) => ({
      date: s.date.toISOString().split('T')[0],
      availableSlots: s._count.id,
    }));
  }
}

export const slotsRepository = new SlotsRepository();
