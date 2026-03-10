import { prisma } from '../../infrastructure/database/client.js';
import type { SlotsSearchInput } from './slots.schema.js';

// Perfil del usuario para evaluar reglas
export interface UserProfile {
  membershipPlanId?: string | null;
  sex?: string | null;
  birthDate?: Date | null;
  handicap?: number | null;
}

function calcularEdad(birthDate: Date): number {
  const hoy = new Date();
  let edad = hoy.getFullYear() - birthDate.getFullYear();
  const mes = hoy.getMonth() - birthDate.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < birthDate.getDate())) {
    edad--;
  }
  return edad;
}

function evaluarCondicion(
  condition: { conditionTypeId: string; operator: string; value: string; conditionType: { key: string } },
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
  rule: { conditions: Array<{ order: number; logicalOperator: string | null; conditionTypeId: string; operator: string; value: string; conditionType: { key: string } }> },
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

function calcularEspecificidad(schedule: { startDate: Date; endDate: Date | null; openTime: string | null; closeTime: string | null }) {
  // Menor rango de días = más específico
  const msPerDay = 1000 * 60 * 60 * 24;
  const endDate = schedule.endDate ?? new Date(schedule.startDate.getTime() + 365 * msPerDay);
  const rangoDias = (endDate.getTime() - schedule.startDate.getTime()) / msPerDay;

  // Menor rango de horas = más específico
  let rangoHoras = 24;
  if (schedule.openTime && schedule.closeTime) {
    const [oh, om] = schedule.openTime.split(':').map(Number);
    const [ch, cm] = schedule.closeTime.split(':').map(Number);
    rangoHoras = (ch * 60 + cm - (oh * 60 + om)) / 60;
  }

  return rangoDias + rangoHoras; // menor = más específico
}

export class SlotsRepository {
  async findByVenueAndDate(venueId: string, date: string) {
    const dateObj = new Date(date + 'T00:00:00.000Z');
    return prisma.slot.findMany({
      where: {
        venueId,
        date: dateObj,
        status: 'AVAILABLE',
      },
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
  }

  async searchAvailable(input: SlotsSearchInput, userProfile?: UserProfile) {
    const start = new Date(input.startDate + 'T00:00:00.000Z');
    const end = input.endDate ? new Date(input.endDate + 'T00:00:00.000Z') : undefined;

    // Obtener slots disponibles básicos
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

    if (!userProfile) {
      // Sin perfil, devolver todos (compatibilidad hacia atrás)
      return slots.map((s) => ({ ...s, price: null, scheduleRule: null }));
    }

    // Obtener la membresía del usuario para conocer baseBookingPrice
    let membershipPlan: { baseBookingPrice: number } | null = null;
    if (userProfile.membershipPlanId) {
      const plan = await prisma.membershipPlan.findUnique({
        where: { id: userProfile.membershipPlanId },
        select: { baseBookingPrice: true },
      });
      if (plan) membershipPlan = { baseBookingPrice: parseFloat(plan.baseBookingPrice.toString()) };
    }

    const resultado: any[] = [];

    for (const slot of slots) {
      const dateStr = slot.date.toISOString().split('T')[0];
      const slotDate = slot.date;
      // isoDay: 1=Lunes, 7=Domingo
      const isoDay = slotDate.getDay() === 0 ? 7 : slotDate.getDay();

      // Buscar todos los schedules que cubren este slot
      const coveringSchedules = await prisma.venueSchedule.findMany({
        where: {
          venueId: slot.venueId,
          active: true,
          startDate: { lte: slotDate },
          OR: [
            { endDate: null },
            { endDate: { gte: slotDate } },
          ],
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
        const openTime = sch.openTime;
        const closeTime = sch.closeTime;
        if (!openTime || !closeTime) return true; // sin restricción horaria
        return slot.startTime >= openTime && slot.startTime < closeTime;
      });

      if (schedulesConHorario.length === 0) {
        // No hay schedule activo: incluir sin precio específico
        resultado.push({
          ...slot,
          price: membershipPlan?.baseBookingPrice ?? null,
          scheduleRule: null,
        });
        continue;
      }

      // Separar schedules con y sin rules
      const schedulesConRules = schedulesConHorario.filter((s) => s.rules.length > 0);
      const schedulesSinRules = schedulesConHorario.filter((s) => s.rules.length === 0);

      if (schedulesConRules.length === 0) {
        // Solo hay schedules sin reglas: abierto a todos
        resultado.push({
          ...slot,
          price: membershipPlan?.baseBookingPrice ?? null,
          scheduleRule: null,
        });
        continue;
      }

      // Hay schedules con rules: el más específico tiene prioridad
      const masEspecifico = schedulesConRules.sort((a, b) => calcularEspecificidad(a) - calcularEspecificidad(b))[0];

      // Evaluar las rules del schedule más específico
      let ruleGanadora: any = null;
      for (const rule of masEspecifico.rules) {
        if (evaluarRule(rule, userProfile)) {
          ruleGanadora = rule;
          break;
        }
      }

      if (!ruleGanadora) {
        // No cumple ninguna rule con canBook=true → excluir
        continue;
      }

      if (!ruleGanadora.canBook) {
        // La rule ganadora dice que NO puede reservar
        continue;
      }

      resultado.push({
        ...slot,
        price: parseFloat(ruleGanadora.basePrice.toString()),
        scheduleRule: {
          ruleId: ruleGanadora.id,
          canBook: ruleGanadora.canBook,
          basePrice: parseFloat(ruleGanadora.basePrice.toString()),
          revenueManagementEnabled: ruleGanadora.revenueManagementEnabled,
        },
      });
    }

    return resultado;
  }

  async findAvailabilityByVenueAndRange(venueId: string, startDate: string, endDate: string) {
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T00:00:00.000Z');

    const slots = await prisma.slot.groupBy({
      by: ['date'],
      where: {
        venueId,
        date: { gte: start, lte: end },
        status: 'AVAILABLE',
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
