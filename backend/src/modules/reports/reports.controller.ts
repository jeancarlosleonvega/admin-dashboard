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
};
