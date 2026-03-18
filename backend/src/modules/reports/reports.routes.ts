import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { reportsController, dashboardController } from './reports.controller.js';

export async function reportsRoutes(app: FastifyInstance) {
  app.get('/dashboard', { preHandler: [authenticate, authorize(['reports.view'])] }, dashboardController.getDashboard);
  app.get('/revenue', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getRevenue);
  app.get('/occupancy', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getOccupancy);
  app.get('/bookings', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getBookings);
  app.get('/memberships', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getMemberships);
  app.get('/services', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getServices);
  app.get('/revenue/detail', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getRevenueDetail);
  app.get('/occupancy/detail', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getOccupancyDetail);
  app.get('/bookings/detail', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getBookingsDetail);
  app.get('/memberships/detail', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getMembershipsDetail);
  app.get('/services/detail', { preHandler: [authenticate, authorize(['reports.view'])] }, reportsController.getServicesDetail);
}
