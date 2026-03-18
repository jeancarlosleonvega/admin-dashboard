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

export interface DetailFilters {
  from: string;
  to: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedDetail<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface RevenueDetailItem {
  id: string;
  date: string;
  amount: number;
  method: string;
  methodLabel: string;
  status: string;
  userId: string;
  userName: string;
  userEmail: string;
  venueName: string;
  sportTypeName: string;
  bookingId: string;
}

export interface OccupancyDetailItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  statusLabel: string;
  venueId: string;
  venueName: string;
}

export interface BookingDetailItem {
  id: string;
  createdAt: string;
  status: string;
  statusLabel: string;
  userId: string;
  userName: string;
  userEmail: string;
  venueName: string;
  slotDate: string;
  startTime: string;
  endTime: string;
}

export interface MembershipDetailItem {
  id: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  planName: string;
}

export interface ServiceDetailItem {
  id: string;
  serviceName: string;
  price: number;
  bookingStatus: string;
  bookingStatusLabel: string;
  userId: string;
  userName: string;
  userEmail: string;
  venueName: string;
  bookingDate: string;
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

  async getRevenueDetail(filters: DetailFilters & { venueId?: string; sportTypeId?: string }): Promise<PaginatedDetail<RevenueDetailItem>> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
    if (filters.venueId) params.append('venueId', filters.venueId);
    if (filters.sportTypeId) params.append('sportTypeId', filters.sportTypeId);
    const res = await apiClient.get(`/reports/revenue/detail?${params}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async getOccupancyDetail(filters: DetailFilters & { venueId?: string }): Promise<PaginatedDetail<OccupancyDetailItem>> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
    if (filters.venueId) params.append('venueId', filters.venueId);
    const res = await apiClient.get(`/reports/occupancy/detail?${params}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async getBookingsDetail(filters: DetailFilters & { status?: string }): Promise<PaginatedDetail<BookingDetailItem>> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
    if (filters.status) params.append('status', filters.status);
    const res = await apiClient.get(`/reports/bookings/detail?${params}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async getMembershipsDetail(filters: DetailFilters & { status?: string }): Promise<PaginatedDetail<MembershipDetailItem>> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
    if (filters.status) params.append('status', filters.status);
    const res = await apiClient.get(`/reports/memberships/detail?${params}`);
    return { data: res.data.data, meta: res.data.meta };
  },

  async getServicesDetail(filters: DetailFilters): Promise<PaginatedDetail<ServiceDetailItem>> {
    const params = new URLSearchParams({ from: filters.from, to: filters.to });
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortDirection) params.append('sortDirection', filters.sortDirection);
    const res = await apiClient.get(`/reports/services/detail?${params}`);
    return { data: res.data.data, meta: res.data.meta };
  },
};
