import { useQuery } from '@tanstack/react-query';
import { reportsApi, type ReportFilters } from '@api/reports.api';

export function useDashboardReport() {
  return useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => reportsApi.getDashboard(),
    staleTime: 60 * 1000,
  });
}

export function useRevenueReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'revenue', filters],
    queryFn: () => reportsApi.getRevenue(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useOccupancyReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'occupancy', filters],
    queryFn: () => reportsApi.getOccupancy(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useBookingsReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'bookings', filters],
    queryFn: () => reportsApi.getBookings(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useMembershipsReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'memberships', filters],
    queryFn: () => reportsApi.getMemberships(filters),
    staleTime: 2 * 60 * 1000,
  });
}

export function useServicesReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['reports', 'services', filters],
    queryFn: () => reportsApi.getServices(filters),
    staleTime: 2 * 60 * 1000,
  });
}
