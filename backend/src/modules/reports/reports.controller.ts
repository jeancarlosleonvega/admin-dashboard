import type { FastifyRequest, FastifyReply } from 'fastify';
import { reportsService } from './reports.service.js';

export const dashboardController = {
  async getDashboard(_req: FastifyRequest, reply: FastifyReply) {
    const data = await reportsService.getDashboard();
    reply.send({ success: true, data });
  },
};

function parseDate(val: string, defaultDate: Date): Date {
  const d = new Date(val);
  return isNaN(d.getTime()) ? defaultDate : d;
}

export const reportsController = {
  async getRevenue(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);

    const data = await reportsService.getRevenue({
      from,
      to,
      venueId: query.venueId || undefined,
      sportTypeId: query.sportTypeId || undefined,
    });

    reply.send({ success: true, data });
  },

  async getOccupancy(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);

    const data = await reportsService.getOccupancy({
      from,
      to,
      venueId: query.venueId || undefined,
    });

    reply.send({ success: true, data });
  },

  async getBookings(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);

    const data = await reportsService.getBookings({ from, to });
    reply.send({ success: true, data });
  },

  async getMemberships(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);

    const data = await reportsService.getMemberships({ from, to });
    reply.send({ success: true, data });
  },

  async getServices(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);

    const data = await reportsService.getServices({ from, to });
    reply.send({ success: true, data });
  },

  async getRevenueDetail(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));

    const data = await reportsService.getRevenueDetail({
      from, to,
      venueId: query.venueId || undefined,
      sportTypeId: query.sportTypeId || undefined,
      search: query.search || undefined,
      sortBy: query.sortBy || undefined,
      sortDirection: (query.sortDirection as 'asc' | 'desc') || undefined,
      page, limit,
    });
    reply.send({ success: true, data: data.items, meta: { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } });
  },

  async getOccupancyDetail(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));

    const data = await reportsService.getOccupancyDetail({
      from, to,
      venueId: query.venueId || undefined,
      search: query.search || undefined,
      sortBy: query.sortBy || undefined,
      sortDirection: (query.sortDirection as 'asc' | 'desc') || undefined,
      page, limit,
    });
    reply.send({ success: true, data: data.items, meta: { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } });
  },

  async getBookingsDetail(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));

    const data = await reportsService.getBookingsDetail({
      from, to,
      search: query.search || undefined,
      status: query.status || undefined,
      sortBy: query.sortBy || undefined,
      sortDirection: (query.sortDirection as 'asc' | 'desc') || undefined,
      page, limit,
    });
    reply.send({ success: true, data: data.items, meta: { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } });
  },

  async getMembershipsDetail(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));

    const data = await reportsService.getMembershipsDetail({
      from, to,
      search: query.search || undefined,
      status: query.status || undefined,
      sortBy: query.sortBy || undefined,
      sortDirection: (query.sortDirection as 'asc' | 'desc') || undefined,
      page, limit,
    });
    reply.send({ success: true, data: data.items, meta: { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } });
  },

  async getServicesDetail(req: FastifyRequest, reply: FastifyReply) {
    const query = req.query as Record<string, string>;
    const now = new Date();
    const from = parseDate(query.from, new Date(now.getFullYear(), now.getMonth(), 1));
    const to = parseDate(query.to, now);
    to.setHours(23, 59, 59, 999);
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));

    const data = await reportsService.getServicesDetail({
      from, to,
      search: query.search || undefined,
      sortBy: query.sortBy || undefined,
      sortDirection: (query.sortDirection as 'asc' | 'desc') || undefined,
      page, limit,
    });
    reply.send({ success: true, data: data.items, meta: { page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages } });
  },
};
