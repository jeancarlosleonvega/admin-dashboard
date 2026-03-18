import { prisma } from '../../infrastructure/database/client.js';

const DAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function startOfMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export class ReportsService {
  async getDashboard() {
    const now = new Date();
    const mesDesde = startOfMonth();
    const hoyDesde = startOfToday();
    const hoyHasta = endOfToday();

    const [
      pagosAprobadosMes,
      slotsHoy,
      reservasMes,
      membresiaActivas,
      membresiasMes,
      transfersPendientes,
      reservasHoy,
      suspensionesActivasList,
      slotsHoyDetalle,
    ] = await Promise.all([
      prisma.payment.findMany({
        where: { status: 'APPROVED', createdAt: { gte: mesDesde, lte: now } },
        select: { amount: true },
      }),
      prisma.slot.findMany({
        where: { date: { gte: hoyDesde, lte: hoyHasta } },
        select: { status: true },
      }),
      prisma.booking.findMany({
        where: { createdAt: { gte: mesDesde, lte: now } },
        select: { status: true },
      }),
      prisma.userMembership.count({ where: { status: 'ACTIVE' } }),
      prisma.userMembership.count({ where: { createdAt: { gte: mesDesde, lte: now } } }),
      // Transferencias pendientes de validar (accionable)
      prisma.payment.findMany({
        where: { status: 'PENDING_VALIDATION', method: 'TRANSFER' },
        take: 5,
        orderBy: { createdAt: 'asc' },
        include: {
          booking: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true } },
              slot: { include: { venue: { select: { name: true } } } },
            },
          },
        },
      }),
      // Reservas confirmadas de hoy ordenadas por hora
      prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          slot: { date: { gte: hoyDesde, lte: hoyHasta } },
        },
        take: 6,
        orderBy: { slot: { startTime: 'asc' } },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          slot: { include: { venue: { select: { name: true } } } },
        },
      }),
      // Suspensiones activas
      prisma.userSuspension.findMany({
        where: { liftedAt: null, OR: [{ endDate: null }, { endDate: { gt: now } }] },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      // Slots de hoy con detalle para opciones de horario
      prisma.slot.findMany({
        where: { date: { gte: hoyDesde, lte: hoyHasta } },
        include: { venue: { select: { id: true, name: true } } },
        orderBy: [{ venue: { name: 'asc' } }, { startTime: 'asc' }],
      }),
    ]);

    const totalIngresosMes = pagosAprobadosMes.reduce((s, p) => s + Number(p.amount), 0);
    const countPagos = pagosAprobadosMes.length;
    const slotsTotal = slotsHoy.length;
    const slotsReservados = slotsHoy.filter((s) => s.status === 'BOOKED').length;
    const reservasConfirmadas = reservasMes.filter((b) => b.status === 'CONFIRMED').length;
    const reservasCanceladas = reservasMes.filter((b) => b.status === 'CANCELLED').length;
    const reservasNoShow = reservasMes.filter((b) => b.status === 'NO_SHOW').length;
    const reservasPendientes = reservasMes.filter((b) => b.status === 'PENDING_PAYMENT').length;

    return {
      ingresos: {
        mesActual: totalIngresosMes,
        ticketPromedio: countPagos > 0 ? Math.round(totalIngresosMes / countPagos) : 0,
        pendientesValidacion: transfersPendientes.length,
        pagosMes: countPagos,
      },
      ocupacion: {
        hoyTotal: slotsTotal,
        hoyReservados: slotsReservados,
        hoyPct: slotsTotal > 0 ? Math.round((slotsReservados / slotsTotal) * 100) : 0,
      },
      reservas: {
        mesTotalCreadas: reservasMes.length,
        mesConfirmadas: reservasConfirmadas,
        mesCanceladas: reservasCanceladas,
        mesNoShow: reservasNoShow,
        mesPendientes: reservasPendientes,
      },
      membresias: {
        activas: membresiaActivas,
        nuevasMes: membresiasMes,
        suspensionesActivas: suspensionesActivasList.length,
      },
      // Horarios: disponibilidad por cancha
      horariosPorCancha: (() => {
        const venueMap: Record<string, { id: string; name: string; libres: { time: string }[]; ocupados: number }> = {};
        for (const slot of slotsHoyDetalle) {
          const vid = slot.venue.id;
          if (!venueMap[vid]) venueMap[vid] = { id: vid, name: slot.venue.name, libres: [], ocupados: 0 };
          if (slot.status === 'AVAILABLE') venueMap[vid].libres.push({ time: slot.startTime });
          else venueMap[vid].ocupados++;
        }
        return Object.values(venueMap);
      })(),
      // Horarios: próximos turnos libres
      proximosTurnos: (() => {
        const nowTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        return slotsHoyDetalle
          .filter((s) => s.status === 'AVAILABLE' && s.startTime >= nowTime)
          .slice(0, 6)
          .map((s) => ({ id: s.id, venueName: s.venue.name, startTime: s.startTime, endTime: s.endTime }));
      })(),
      // Horarios: heatmap (horas únicas × canchas)
      heatmap: (() => {
        const hours = [...new Set(slotsHoyDetalle.map((s) => s.startTime))].sort();
        const venues = [...new Map(slotsHoyDetalle.map((s) => [s.venue.id, s.venue.name])).entries()]
          .map(([id, name]) => ({ id, name }));
        const grid = venues.map((v) => ({
          venueName: v.name,
          slots: hours.map((h) => {
            const s = slotsHoyDetalle.find((sl) => sl.venue.id === v.id && sl.startTime === h);
            return { time: h, status: s ? s.status : null };
          }),
        }));
        return { hours, grid };
      })(),
      // Listas accionables
      transfersPendientes: transfersPendientes.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        userName: `${p.booking.user.firstName} ${p.booking.user.lastName}`,
        venueName: p.booking.slot.venue?.name ?? '',
        date: p.booking.slot.date,
        startTime: p.booking.slot.startTime,
      })),
      reservasHoy: reservasHoy.map((b) => ({
        id: b.id,
        userName: `${b.user.firstName} ${b.user.lastName}`,
        venueName: b.slot.venue?.name ?? '',
        startTime: b.slot.startTime,
        endTime: b.slot.endTime,
      })),
      suspensionesActivas: suspensionesActivasList.map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: `${s.user.firstName} ${s.user.lastName}`,
        reason: s.reason,
        endDate: s.endDate,
        isAutomatic: s.isAutomatic,
      })),
    };
  }


  async getRevenue(filters: { from: Date; to: Date; venueId?: string; sportTypeId?: string }) {
    const { from, to, venueId, sportTypeId } = filters;

    const paymentWhere: any = {
      status: 'APPROVED',
      createdAt: { gte: from, lte: to },
    };

    if (venueId || sportTypeId) {
      paymentWhere.booking = {
        slot: {
          ...(venueId ? { venueId } : {}),
          ...(sportTypeId ? { venue: { sportTypeId } } : {}),
        },
      };
    }

    const payments = await prisma.payment.findMany({
      where: paymentWhere,
      include: {
        booking: {
          include: {
            slot: {
              include: {
                venue: { include: { sportType: { select: { id: true, name: true } } } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const count = payments.length;

    const byMethod: Record<string, number> = {};
    for (const p of payments) {
      byMethod[p.method] = (byMethod[p.method] ?? 0) + Number(p.amount);
    }

    const bySportTypeMap: Record<string, { id: string; name: string; total: number }> = {};
    for (const p of payments) {
      const st = (p.booking.slot.venue as any)?.sportType;
      if (!st) continue;
      if (!bySportTypeMap[st.id]) bySportTypeMap[st.id] = { id: st.id, name: st.name, total: 0 };
      bySportTypeMap[st.id].total += Number(p.amount);
    }

    const timelineMap: Record<string, number> = {};
    for (const p of payments) {
      const day = p.createdAt.toISOString().slice(0, 10);
      timelineMap[day] = (timelineMap[day] ?? 0) + Number(p.amount);
    }
    const timeline = Object.entries(timelineMap).map(([date, amount]) => ({ date, total: amount }));

    return {
      total,
      count,
      avgTicket: count > 0 ? Math.round(total / count) : 0,
      byMethod,
      bySportType: Object.values(bySportTypeMap),
      timeline,
    };
  }

  async getOccupancy(filters: { from: Date; to: Date; venueId?: string }) {
    const { from, to, venueId } = filters;

    const slotWhere: any = { date: { gte: from, lte: to } };
    if (venueId) slotWhere.venueId = venueId;

    const slots = await prisma.slot.findMany({
      where: slotWhere,
      include: {
        venue: { select: { id: true, name: true } },
      },
    });

    const totalSlots = slots.length;
    const bookedSlots = slots.filter((s) => s.status === 'BOOKED').length;

    const venueMap: Record<string, { id: string; name: string; totalSlots: number; bookedSlots: number }> = {};
    for (const slot of slots) {
      const v = slot.venue;
      if (!venueMap[v.id]) venueMap[v.id] = { id: v.id, name: v.name, totalSlots: 0, bookedSlots: 0 };
      venueMap[v.id].totalSlots++;
      if (slot.status === 'BOOKED') venueMap[v.id].bookedSlots++;
    }

    const dowMap: Record<number, { totalSlots: number; bookedSlots: number }> = {};
    for (let d = 0; d <= 6; d++) dowMap[d] = { totalSlots: 0, bookedSlots: 0 };
    for (const slot of slots) {
      const dow = slot.date.getDay();
      dowMap[dow].totalSlots++;
      if (slot.status === 'BOOKED') dowMap[dow].bookedSlots++;
    }

    const byDayOfWeek = Object.entries(dowMap).map(([d, v]) => ({
      day: Number(d),
      label: DAY_LABELS[Number(d)],
      totalSlots: v.totalSlots,
      bookedSlots: v.bookedSlots,
      occupancyPct: v.totalSlots > 0 ? Math.round((v.bookedSlots / v.totalSlots) * 100) : 0,
    }));

    return {
      overall: {
        totalSlots,
        bookedSlots,
        occupancyPct: totalSlots > 0 ? Math.round((bookedSlots / totalSlots) * 100) : 0,
      },
      byVenue: Object.values(venueMap).map((v) => ({
        ...v,
        occupancyPct: v.totalSlots > 0 ? Math.round((v.bookedSlots / v.totalSlots) * 100) : 0,
      })),
      byDayOfWeek,
    };
  }

  async getBookings(filters: { from: Date; to: Date }) {
    const { from, to } = filters;

    const bookings = await prisma.booking.findMany({
      where: { createdAt: { gte: from, lte: to } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    const summary = {
      total: bookings.length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      cancelled: bookings.filter((b) => b.status === 'CANCELLED').length,
      noShow: bookings.filter((b) => b.status === 'NO_SHOW').length,
      pendingPayment: bookings.filter((b) => b.status === 'PENDING_PAYMENT').length,
    };

    const confirmedByUser: Record<string, { user: any; count: number }> = {};
    for (const b of bookings.filter((b) => b.status === 'CONFIRMED')) {
      const uid = b.user.id;
      if (!confirmedByUser[uid]) confirmedByUser[uid] = { user: b.user, count: 0 };
      confirmedByUser[uid].count++;
    }
    const topSocios = Object.values(confirmedByUser)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ user, count }) => ({ ...user, confirmedCount: count }));

    const noShowByUser: Record<string, { user: any; count: number }> = {};
    for (const b of bookings.filter((b) => b.status === 'NO_SHOW')) {
      const uid = b.user.id;
      if (!noShowByUser[uid]) noShowByUser[uid] = { user: b.user, count: 0 };
      noShowByUser[uid].count++;
    }
    const noShowRanking = Object.values(noShowByUser)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(({ user, count }) => ({ ...user, noShowCount: count }));

    return { summary, topSocios, noShowRanking };
  }

  async getMemberships(filters: { from: Date; to: Date }) {
    const { from, to } = filters;

    const [newMemberships, activeMemberships, suspensions] = await Promise.all([
      prisma.userMembership.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: { membershipPlan: { select: { id: true, name: true } } },
      }),
      prisma.userMembership.findMany({
        where: { status: 'ACTIVE' },
        include: { membershipPlan: { select: { id: true, name: true } } },
      }),
      prisma.userSuspension.findMany({
        where: { createdAt: { gte: from, lte: to } },
      }),
    ]);

    const cancelled = newMemberships.filter((m) => m.status === 'CANCELLED' || m.status === 'INACTIVE').length;

    const byPlanMap: Record<string, { id: string; name: string; active: number }> = {};
    for (const m of activeMemberships) {
      const p = m.membershipPlan;
      if (!byPlanMap[p.id]) byPlanMap[p.id] = { id: p.id, name: p.name, active: 0 };
      byPlanMap[p.id].active++;
    }

    return {
      summary: {
        newInPeriod: newMemberships.length,
        cancelledInPeriod: cancelled,
        totalActive: activeMemberships.length,
        autoSuspensions: suspensions.filter((s) => s.isAutomatic).length,
        manualSuspensions: suspensions.filter((s) => !s.isAutomatic).length,
      },
      byPlan: Object.values(byPlanMap),
    };
  }

  async getServices(filters: { from: Date; to: Date }) {
    const { from, to } = filters;

    const bookingServices = await prisma.bookingService.findMany({
      where: { booking: { createdAt: { gte: from, lte: to } } },
      include: {
        service: { select: { id: true, name: true } },
        booking: { select: { status: true } },
      },
    });

    const serviceMap: Record<string, { id: string; name: string; count: number; revenue: number }> = {};
    for (const bs of bookingServices) {
      const sid = bs.service.id;
      if (!serviceMap[sid]) serviceMap[sid] = { id: sid, name: bs.service.name, count: 0, revenue: 0 };
      serviceMap[sid].count++;
      if (bs.booking.status === 'CONFIRMED') {
        serviceMap[sid].revenue += Number(bs.price);
      }
    }

    const services = Object.values(serviceMap).sort((a, b) => b.count - a.count);

    return {
      totalUsage: bookingServices.length,
      totalRevenue: services.reduce((s, v) => s + v.revenue, 0),
      services,
    };
  }

  async getRevenueDetail(filters: {
    from: Date; to: Date; venueId?: string; sportTypeId?: string;
    search?: string; page: number; limit: number;
    sortBy?: string; sortDirection?: 'asc' | 'desc';
  }) {
    const { from, to, venueId, sportTypeId, search, page, limit, sortBy, sortDirection } = filters;

    const where: any = { status: 'APPROVED', createdAt: { gte: from, lte: to } };

    const bookingFilter: any = {};
    if (venueId) bookingFilter.slot = { venueId };
    if (sportTypeId) bookingFilter.slot = { ...(bookingFilter.slot ?? {}), venue: { sportTypeId } };

    if (search) {
      bookingFilter.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    if (Object.keys(bookingFilter).length > 0) where.booking = bookingFilter;

    const validSortFields: Record<string, any> = {
      date: { createdAt: sortDirection ?? 'desc' },
      amount: { amount: sortDirection ?? 'desc' },
      method: { method: sortDirection ?? 'asc' },
    };
    const orderBy = sortBy && validSortFields[sortBy] ? validSortFields[sortBy] : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          booking: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
              slot: {
                include: {
                  venue: { include: { sportType: { select: { id: true, name: true } } } },
                },
              },
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    const METHOD_LABELS: Record<string, string> = {
      TRANSFER: 'Transferencia', CASH: 'Efectivo', MERCADOPAGO: 'MercadoPago', WALLET: 'Wallet',
    };

    return {
      items: items.map((p) => ({
        id: p.id,
        date: p.createdAt.toISOString(),
        amount: Number(p.amount),
        method: p.method,
        methodLabel: METHOD_LABELS[p.method] ?? p.method,
        status: p.status,
        userId: p.booking.user.id,
        userName: `${p.booking.user.firstName} ${p.booking.user.lastName}`,
        userEmail: p.booking.user.email,
        venueName: p.booking.slot?.venue?.name ?? '',
        sportTypeName: (p.booking.slot?.venue as any)?.sportType?.name ?? '',
        bookingId: p.bookingId,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOccupancyDetail(filters: {
    from: Date; to: Date; venueId?: string;
    search?: string; page: number; limit: number;
    sortBy?: string; sortDirection?: 'asc' | 'desc';
  }) {
    const { from, to, venueId, search, page, limit, sortBy, sortDirection } = filters;

    const where: any = { date: { gte: from, lte: to } };
    if (venueId) where.venueId = venueId;
    if (search) where.venue = { name: { contains: search, mode: 'insensitive' } };

    const validSortFields: Record<string, any> = {
      date: [{ date: sortDirection ?? 'asc' }, { startTime: 'asc' }],
      startTime: { startTime: sortDirection ?? 'asc' },
      venueName: { venue: { name: sortDirection ?? 'asc' } },
      status: { status: sortDirection ?? 'asc' },
    };
    const orderBy = sortBy && validSortFields[sortBy] ? validSortFields[sortBy] : [{ date: 'asc' }, { startTime: 'asc' }];

    const [items, total] = await Promise.all([
      prisma.slot.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: { venue: { select: { id: true, name: true } } },
      }),
      prisma.slot.count({ where }),
    ]);

    const STATUS_LABELS: Record<string, string> = {
      AVAILABLE: 'Disponible', BOOKED: 'Reservado', BLOCKED: 'Bloqueado',
    };

    return {
      items: items.map((s) => ({
        id: s.id,
        date: s.date.toISOString().slice(0, 10),
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        statusLabel: STATUS_LABELS[s.status] ?? s.status,
        venueId: s.venueId,
        venueName: s.venue.name,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getBookingsDetail(filters: {
    from: Date; to: Date;
    search?: string; page: number; limit: number;
    sortBy?: string; sortDirection?: 'asc' | 'desc';
    status?: string;
  }) {
    const { from, to, search, page, limit, sortBy, sortDirection, status } = filters;

    const where: any = { createdAt: { gte: from, lte: to } };
    if (status) where.status = status;
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const validSortFields: Record<string, any> = {
      createdAt: { createdAt: sortDirection ?? 'desc' },
      status: { status: sortDirection ?? 'asc' },
      slotDate: { slot: { date: sortDirection ?? 'asc' } },
    };
    const orderBy = sortBy && validSortFields[sortBy] ? validSortFields[sortBy] : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          slot: { include: { venue: { select: { id: true, name: true } } } },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    const STATUS_LABELS: Record<string, string> = {
      CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', NO_SHOW: 'Ausente',
      PENDING_PAYMENT: 'Pend. pago', COMPLETED: 'Completada',
    };

    return {
      items: items.map((b) => ({
        id: b.id,
        createdAt: b.createdAt.toISOString(),
        status: b.status,
        statusLabel: STATUS_LABELS[b.status] ?? b.status,
        userId: b.user.id,
        userName: `${b.user.firstName} ${b.user.lastName}`,
        userEmail: b.user.email,
        venueName: b.slot?.venue?.name ?? '',
        slotDate: b.slot?.date ? b.slot.date.toISOString().slice(0, 10) : '',
        startTime: b.slot?.startTime ?? '',
        endTime: b.slot?.endTime ?? '',
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMembershipsDetail(filters: {
    from: Date; to: Date;
    search?: string; page: number; limit: number;
    sortBy?: string; sortDirection?: 'asc' | 'desc';
    status?: string;
  }) {
    const { from, to, search, page, limit, sortBy, sortDirection, status } = filters;

    const where: any = { createdAt: { gte: from, lte: to } };
    if (status) where.status = status;
    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const validSortFields: Record<string, any> = {
      createdAt: { createdAt: sortDirection ?? 'desc' },
      status: { status: sortDirection ?? 'asc' },
      startDate: { startDate: sortDirection ?? 'desc' },
      endDate: { endDate: sortDirection ?? 'desc' },
    };
    const orderBy = sortBy && validSortFields[sortBy] ? validSortFields[sortBy] : { createdAt: 'desc' };

    const [items, total] = await Promise.all([
      prisma.userMembership.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          membershipPlan: { select: { id: true, name: true } },
        },
      }),
      prisma.userMembership.count({ where }),
    ]);

    const STATUS_LABELS: Record<string, string> = {
      ACTIVE: 'Activa', INACTIVE: 'Inactiva', CANCELLED: 'Cancelada', SUSPENDED: 'Suspendida',
    };

    return {
      items: items.map((m) => ({
        id: m.id,
        status: m.status,
        statusLabel: STATUS_LABELS[m.status] ?? m.status,
        createdAt: m.createdAt.toISOString(),
        startDate: m.startDate ? m.startDate.toISOString().slice(0, 10) : null,
        endDate: m.endDate ? m.endDate.toISOString().slice(0, 10) : null,
        userId: m.user.id,
        userName: `${m.user.firstName} ${m.user.lastName}`,
        userEmail: m.user.email,
        planId: m.membershipPlan.id,
        planName: m.membershipPlan.name,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getServicesDetail(filters: {
    from: Date; to: Date;
    search?: string; page: number; limit: number;
    sortBy?: string; sortDirection?: 'asc' | 'desc';
  }) {
    const { from, to, search, page, limit, sortBy, sortDirection } = filters;

    const where: any = { booking: { createdAt: { gte: from, lte: to } } };
    if (search) {
      where.OR = [
        { service: { name: { contains: search, mode: 'insensitive' } } },
        { booking: { user: { firstName: { contains: search, mode: 'insensitive' } } } },
        { booking: { user: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const orderBy: any = sortBy === 'price'
      ? { price: sortDirection ?? 'desc' }
      : sortBy === 'serviceName'
      ? { service: { name: sortDirection ?? 'asc' } }
      : { booking: { createdAt: 'desc' } };

    const [items, total] = await Promise.all([
      prisma.bookingService.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          service: { select: { id: true, name: true } },
          booking: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
              slot: { include: { venue: { select: { name: true } } } },
            },
          },
        },
      }),
      prisma.bookingService.count({ where }),
    ]);

    const STATUS_LABELS: Record<string, string> = {
      CONFIRMED: 'Confirmada', CANCELLED: 'Cancelada', NO_SHOW: 'Ausente',
      PENDING_PAYMENT: 'Pend. pago', COMPLETED: 'Completada',
    };

    return {
      items: items.map((bs) => ({
        id: bs.id,
        serviceName: bs.service.name,
        price: Number(bs.price),
        bookingStatus: bs.booking.status,
        bookingStatusLabel: STATUS_LABELS[bs.booking.status] ?? bs.booking.status,
        userId: bs.booking.user.id,
        userName: `${bs.booking.user.firstName} ${bs.booking.user.lastName}`,
        userEmail: bs.booking.user.email,
        venueName: bs.booking.slot?.venue?.name ?? '',
        bookingDate: bs.booking.createdAt.toISOString().slice(0, 10),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const reportsService = new ReportsService();
