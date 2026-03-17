import { apiClient } from './client';

export interface RevenueReport {
  total: number;
  count: number;
  avgTicket: number;
  byMethod: Record<string, number>;
  bySportType: { id: string; name: string; total: number }[];
  timeline: { date: string; total: number }[];
}

export interface OccupancyReport {
  overall: { totalSlots: number; bookedSlots: number; occupancyPct: number };
  byVenue: { id: string; name: string; totalSlots: number; bookedSlots: number; occupancyPct: number }[];
  byDayOfWeek: { day: number; label: string; totalSlots: number; bookedSlots: number; occupancyPct: number }[];
}

export interface BookingsReport {
  summary: { total: number; confirmed: number; cancelled: number; noShow: number; pendingPayment: number };
  topSocios: { id: string; firstName: string; lastName: string; email: string; confirmedCount: number }[];
  noShowRanking: { id: string; firstName: string; lastName: string; email: string; noShowCount: number }[];
}

export interface ReportFilters {
  from: string;
  to: string;
  venueId?: string;
  sportTypeId?: string;
}

export interface DashboardReport {
  ingresos: { mesActual: number; ticketPromedio: number; pendientesValidacion: number; pagosMes: number };
  ocupacion: { hoyTotal: number; hoyReservados: number; hoyPct: number };
  reservas: { mesTotalCreadas: number; mesConfirmadas: number; mesCanceladas: number; mesNoShow: number; mesPendientes: number };
  membresias: { activas: number; nuevasMes: number; suspensionesActivas: number };
  transfersPendientes: { id: string; amount: number; userName: string; venueName: string; date: string; startTime: string }[];
  reservasHoy: { id: string; userName: string; venueName: string; startTime: string; endTime: string }[];
  suspensionesActivas: { id: string; userId: string; userName: string; reason: string; endDate: string | null; isAutomatic: boolean }[];
  horariosPorCancha: { id: string; name: string; libres: { time: string }[]; ocupados: number }[];
  proximosTurnos: { id: string; venueName: string; startTime: string; endTime: string }[];
  heatmap: {
    hours: string[];
    grid: { venueName: string; slots: { time: string; status: string | null }[] }[];
  };
}

export interface MembershipsReport {
  summary: {
    newInPeriod: number;
    cancelledInPeriod: number;
    totalActive: number;
    autoSuspensions: number;
    manualSuspensions: number;
  };
  byPlan: { id: string; name: string; active: number }[];
}

export interface ServicesReport {
  totalUsage: number;
  totalRevenue: number;
  services: { id: string; name: string; count: number; revenue: number }[];
}

export const reportsApi = {
  async getDashboard(): Promise<DashboardReport> {
    const res = await apiClient.get('/reports/dashboard');
    return res.data.data;
  },

  async getRevenue(filters: ReportFilters): Promise<RevenueReport> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.venueId) params.append('venueId', filters.venueId);
    if (filters.sportTypeId) params.append('sportTypeId', filters.sportTypeId);
    const res = await apiClient.get(`/reports/revenue?${params}`);
    return res.data.data;
  },

  async getOccupancy(filters: ReportFilters): Promise<OccupancyReport> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.venueId) params.append('venueId', filters.venueId);
    const res = await apiClient.get(`/reports/occupancy?${params}`);
    return res.data.data;
  },

  async getBookings(filters: ReportFilters): Promise<BookingsReport> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    const res = await apiClient.get(`/reports/bookings?${params}`);
    return res.data.data;
  },

  async getMemberships(filters: ReportFilters): Promise<MembershipsReport> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    const res = await apiClient.get(`/reports/memberships?${params}`);
    return res.data.data;
  },

  async getServices(filters: ReportFilters): Promise<ServicesReport> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    const res = await apiClient.get(`/reports/services?${params}`);
    return res.data.data;
  },
};
