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

function calcularEspecificidad(schedule: {
  startDate: Date;
  endDate: Date | null;
  openTime: string | null;
  closeTime: string | null;
}) {
  const msPerDay = 1000 * 60 * 60 * 24;
  const endDate = schedule.endDate ?? new Date(schedule.startDate.getTime() + 365 * msPerDay);
  const rangoDias = (endDate.getTime() - schedule.startDate.getTime()) / msPerDay;
  let rangoHoras = 24;
  if (schedule.openTime && schedule.closeTime) {
    const [oh, om] = schedule.openTime.split(':').map(Number);
    const [ch, cm] = schedule.closeTime.split(':').map(Number);
    rangoHoras = (ch * 60 + cm - (oh * 60 + om)) / 60;
  }
  return rangoDias + rangoHoras; // menor = más específico
}

// ─── Precio base del plan de membresía ───────────────────────────────────────

async function getMembershipBasePrice(userProfile: UserProfile): Promise<number | null> {
  if (!userProfile.membershipPlanId) return null;
  const plan = await prisma.membershipPlan.findUnique({
    where: { id: userProfile.membershipPlanId },
    select: { baseBookingPrice: true },
  });
  return plan ? parseFloat(plan.baseBookingPrice.toString()) : null;
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

  // Calcular valores del contexto
  const dow = slotDate.getDay();
  const dayType = dow === 0 || dow === 6 ? 'WEEKEND' : dow === 5 ? 'FRIDAY' : 'WEEKDAY';

  const [totalSlots, bookedSlots] = await Promise.all([
    prisma.slot.count({ where: { venueId: slotVenueId, date: slotDate } }),
    prisma.slot.count({ where: { venueId: slotVenueId, date: slotDate, status: 'BOOKED' } }),
  ]);
  const occupancyPct = totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0;

  const age = userProfile?.birthDate ? calcularEdad(userProfile.birthDate) : null;

  // Resolver de valores por key
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

  // Límites
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
  baseBookingPrice: number | null,
): Promise<(Omit<T, 'scheduleId'> & { price: number | null; scheduleRule: object | null })[]> {
  const resultado: (Omit<T, 'scheduleId'> & { price: number | null; scheduleRule: object | null })[] = [];

  // Obtener sportTypeId del venue (todos los slots son del mismo venue)
  const venueInfo = slots.length > 0
    ? await prisma.venue.findUnique({
        where: { id: slots[0].venueId },
        select: { sportTypeId: true },
      })
    : null;
  const sportTypeId = venueInfo?.sportTypeId ?? '';

  for (const slot of slots) {
    const slotDate = slot.date;
    const isoDay = slotDate.getUTCDay() === 0 ? 7 : slotDate.getUTCDay();

    // Buscar todos los schedules activos que cubren este slot
    const coveringSchedules = await prisma.venueSchedule.findMany({
      where: {
        venueId: slot.venueId,
        active: true,
        startDate: { lte: slotDate },
        OR: [{ endDate: null }, { endDate: { gte: slotDate } }],
        daysOfWeek: { has: isoDay },
      },
      include: {
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

    // Filtrar por rango horario
    const schedulesConHorario = coveringSchedules.filter((sch) => {
      if (!sch.openTime || !sch.closeTime) return true;
      return slot.startTime >= sch.openTime && slot.startTime < sch.closeTime;
    });

    const slotVenue = (slot as any).venue;

    // Sin schedule activo: incluir con precio base
    if (schedulesConHorario.length === 0) {
      const pps = slotVenue?.playersPerSlot ?? slotVenue?.sportType?.defaultPlayersPerSlot ?? null;
      resultado.push({ ...slot, price: baseBookingPrice, playersPerSlot: pps, scheduleRule: null });
      continue;
    }

    const schedulesConRules = schedulesConHorario.filter((s) => s.rules.length > 0);

    // Solo schedules sin reglas: abierto a todos
    if (schedulesConRules.length === 0) {
      const pps = schedulesConHorario[0].playersPerSlot ?? slotVenue?.playersPerSlot ?? slotVenue?.sportType?.defaultPlayersPerSlot ?? null;
      resultado.push({ ...slot, price: baseBookingPrice, playersPerSlot: pps, scheduleRule: null });
      continue;
    }

    // El schedule más específico con reglas tiene prioridad
    const masEspecifico = schedulesConRules.sort(
      (a, b) => calcularEspecificidad(a) - calcularEspecificidad(b),
    )[0];

    // Evaluar las rules — gana la que tiene más condiciones cumplidas
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

    // No cumple ninguna regla → excluir slot
    if (!ruleGanadora) continue;

    // La regla ganadora bloquea la reserva → excluir slot
    if (!ruleGanadora.canBook) continue;

    const { scheduleId: _sid, ...slotSinScheduleId } = slot as T & { scheduleId?: unknown };
    const ruleBasePrice = parseFloat(ruleGanadora.basePrice.toString());
    // La regla tiene precio custom → ese precio manda siempre
    const finalPrice = ruleGanadora.revenueManagementEnabled && sportTypeId
      ? await calcularPrecioRevenue(ruleBasePrice, slot.startTime, slot.date, slot.venueId, sportTypeId, userProfile)
      : ruleBasePrice;

    const effectivePPS = masEspecifico.playersPerSlot ?? (slot as any).schedule?.playersPerSlot ?? slotVenue?.playersPerSlot ?? slotVenue?.sportType?.defaultPlayersPerSlot ?? null;

    resultado.push({
      ...slotSinScheduleId,
      price: finalPrice,
      playersPerSlot: effectivePPS,
      scheduleRule: {
        ruleId: ruleGanadora.id,
        canBook: ruleGanadora.canBook,
        basePrice: ruleBasePrice,
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

    const baseBookingPrice = await getMembershipBasePrice(userProfile);
    return applyRuleFilter(slots, userProfile, baseBookingPrice);
  }

  async searchAvailable(input: SlotsSearchInput, userProfile?: UserProfile) {
    const start = new Date(input.startDate + 'T00:00:00.000Z');
    const end = input.endDate ? new Date(input.endDate + 'T00:00:00.000Z') : undefined;

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
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        schedule: { select: { playersPerSlot: true } },
        venue: {
          select: {
            id: true,
            name: true,
            playersPerSlot: true,
            sportType: { select: { id: true, name: true, defaultPlayersPerSlot: true } },
          },
        },
      },
    });

    const withPPS = slots.map((s) => ({
      ...s,
      price: null as number | null,
      playersPerSlot: s.schedule?.playersPerSlot ?? s.venue?.playersPerSlot ?? s.venue?.sportType?.defaultPlayersPerSlot ?? null,
      scheduleRule: null as object | null,
    }));

    const filterByPlayers = (items: typeof withPPS) =>
      input.numPlayers && input.numPlayers > 0
        ? items.filter((s) => s.playersPerSlot == null || s.playersPerSlot <= input.numPlayers!)
        : items;

    if (!userProfile) return filterByPlayers(withPPS);

    const baseBookingPrice = await getMembershipBasePrice(userProfile);
    const filtered = await applyRuleFilter(slots, userProfile, baseBookingPrice);
    return input.numPlayers && input.numPlayers > 0
      ? filtered.filter((s) => (s as any).playersPerSlot == null || (s as any).playersPerSlot <= input.numPlayers!)
      : filtered;
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
