import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2, TrendingUp, Calendar, Users, AlertTriangle,
  DollarSign, CheckCircle, XCircle, CreditCard, Package, Download,
} from 'lucide-react';
import { cn } from '@lib/utils';
import {
  useRevenueReport, useOccupancyReport, useBookingsReport,
  useMembershipsReport, useServicesReport,
  useRevenueDetail, useOccupancyDetail, useBookingsDetail,
  useMembershipsDetail, useServicesDetail,
} from '@/hooks/queries/useReports';
import { Spinner } from '@components/ui/Spinner';
import type { ReportFilters, DetailFilters } from '@api/reports.api';
import DataToolbar from '@components/shared/DataToolbar';
import type { FilterRule } from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}
function fmtNum(n: number) { return new Intl.NumberFormat('es-AR').format(n); }

function getDefaultRange() {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

function downloadCsv(filename: string, rows: string[][]) {
  const content = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const METHOD_LABELS: Record<string, string> = {
  TRANSFER: 'Transferencia', CASH: 'Efectivo', MERCADOPAGO: 'MercadoPago', WALLET: 'Wallet',
};

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function KpiCard({ icon: Icon, label, value, color = 'text-gray-800', sub }: {
  icon: any; label: string; value: string; color?: string; sub?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-500">{label}</p>
        <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary-600" />
        </div>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function BarRow({ label, value, max, suffix }: { label: string; value: number; max: number; suffix: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-36 text-xs text-gray-600 text-right shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className="h-2.5 bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-32 text-xs text-gray-700 text-right shrink-0 font-medium">{suffix}</span>
    </div>
  );
}

function SubCard({ title, children, empty }: { title: string; children?: React.ReactNode; empty?: boolean }) {
  return (
    <div className="card p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h3>
      {empty ? <p className="text-sm text-gray-400">Sin datos para el período</p> : children}
    </div>
  );
}

function SectionLoader() {
  return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
}

function DetailPager({ meta, page, setPage }: {
  meta: { page: number; total: number; limit: number; totalPages: number };
  page: number; setPage: (p: number) => void;
}) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Mostrando {(meta.page - 1) * meta.limit + 1} a {Math.min(meta.page * meta.limit, meta.total)} de {meta.total}
      </p>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage(page - 1)} disabled={page <= 1}
          className="p-1.5 rounded border border-gray-300 disabled:opacity-50">‹</button>
        {Array.from({ length: Math.min(meta.totalPages, 5) }, (_, i) => {
          const p = Math.max(1, Math.min(meta.page - 2, meta.totalPages - 4)) + i;
          return (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 text-sm rounded ${p === meta.page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => setPage(page + 1)} disabled={page >= meta.totalPages}
          className="p-1.5 rounded border border-gray-300 disabled:opacity-50">›</button>
      </div>
    </div>
  );
}

// ─── Column definitions ────────────────────────────────────────────────────────

const INGRESOS_SORT_MAP: Record<string, string> = {
  date: 'date', amount: 'amount', method: 'method',
};
const ingresosColumns: ColumnDef[] = [
  { key: 'date', label: 'Fecha', sortable: true, filterable: false },
  { key: 'userName', label: 'Socio', sortable: false, filterable: true, type: 'text' },
  { key: 'venueName', label: 'Cancha', sortable: false, filterable: true, type: 'text' },
  { key: 'sportTypeName', label: 'Deporte', sortable: false, filterable: false },
  { key: 'method', label: 'Método', sortable: true, filterable: true, type: 'select', options: [
    { label: 'Transferencia', value: 'TRANSFER' },
    { label: 'Efectivo', value: 'CASH' },
    { label: 'MercadoPago', value: 'MERCADOPAGO' },
    { label: 'Wallet', value: 'WALLET' },
  ]},
  { key: 'amount', label: 'Monto', sortable: true, filterable: false },
  { key: 'status', label: 'Estado', sortable: false, filterable: false },
];

const OCUPACION_SORT_MAP: Record<string, string> = {
  date: 'date', startTime: 'startTime', venueName: 'venueName', status: 'status',
};
const ocupacionColumns: ColumnDef[] = [
  { key: 'date', label: 'Fecha', sortable: true, filterable: false },
  { key: 'venueName', label: 'Cancha', sortable: true, filterable: true, type: 'text' },
  { key: 'startTime', label: 'Hora inicio', sortable: true, filterable: false },
  { key: 'endTime', label: 'Hora fin', sortable: false, filterable: false },
  { key: 'status', label: 'Estado', sortable: true, filterable: true, type: 'select', options: [
    { label: 'Disponible', value: 'AVAILABLE' },
    { label: 'Reservado', value: 'BOOKED' },
    { label: 'Bloqueado', value: 'BLOCKED' },
  ]},
];

const RESERVAS_SORT_MAP: Record<string, string> = {
  createdAt: 'createdAt', slotDate: 'slotDate', status: 'status',
};
const reservasColumns: ColumnDef[] = [
  { key: 'createdAt', label: 'Fecha creación', sortable: true, filterable: false },
  { key: 'userName', label: 'Socio', sortable: false, filterable: true, type: 'text' },
  { key: 'venueName', label: 'Cancha', sortable: false, filterable: false },
  { key: 'slotDate', label: 'Fecha turno', sortable: true, filterable: false },
  { key: 'startTime', label: 'Hora', sortable: false, filterable: false },
  { key: 'status', label: 'Estado', sortable: false, filterable: true, type: 'select', options: [
    { label: 'Confirmada', value: 'CONFIRMED' },
    { label: 'Cancelada', value: 'CANCELLED' },
    { label: 'Ausente', value: 'NO_SHOW' },
    { label: 'Pend. pago', value: 'PENDING_PAYMENT' },
  ]},
];

const MEMBRESIAS_SORT_MAP: Record<string, string> = {
  createdAt: 'createdAt', startDate: 'startDate', endDate: 'endDate', status: 'status',
};
const membresiasColumns: ColumnDef[] = [
  { key: 'userName', label: 'Socio', sortable: false, filterable: true, type: 'text' },
  { key: 'planName', label: 'Plan', sortable: false, filterable: false },
  { key: 'status', label: 'Estado', sortable: true, filterable: true, type: 'select', options: [
    { label: 'Activa', value: 'ACTIVE' },
    { label: 'Inactiva', value: 'INACTIVE' },
    { label: 'Cancelada', value: 'CANCELLED' },
    { label: 'Suspendida', value: 'SUSPENDED' },
  ]},
  { key: 'startDate', label: 'Inicio', sortable: true, filterable: false },
  { key: 'endDate', label: 'Vencimiento', sortable: true, filterable: false },
  { key: 'createdAt', label: 'Creada', sortable: true, filterable: false },
];

const SERVICIOS_SORT_MAP: Record<string, string> = {
  price: 'price', serviceName: 'serviceName', bookingDate: 'bookingDate',
};
const serviciosColumns: ColumnDef[] = [
  { key: 'serviceName', label: 'Servicio', sortable: true, filterable: true, type: 'text' },
  { key: 'userName', label: 'Socio', sortable: false, filterable: true, type: 'text' },
  { key: 'venueName', label: 'Cancha', sortable: false, filterable: false },
  { key: 'bookingDate', label: 'Fecha', sortable: true, filterable: false },
  { key: 'price', label: 'Precio', sortable: true, filterable: false },
  { key: 'bookingStatus', label: 'Estado', sortable: false, filterable: false },
];

// ─── Secciones ────────────────────────────────────────────────────────────────

function SeccionIngresos({ filters, from, to, onReady }: { filters: ReportFilters; from: string; to: string; onReady: (fn: () => void) => void }) {
  const { data, isLoading } = useRevenueReport(filters);
  const [detailFilters, setDetailFilters] = useState<DetailFilters>({ from, to, page: 1, limit: 20 });
  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('report-ingresos-cols', ingresosColumns);

  useEffect(() => {
    setDetailFilters(f => ({ ...f, from, to, page: 1 }));
  }, [from, to]);

  const { data: detail, isLoading: detailLoading } = useRevenueDetail(detailFilters);

  useEffect(() => {
    if (!detail) return;
    onReady(() => {
      const rows: string[][] = [['Fecha', 'Socio', 'Email', 'Cancha', 'Deporte', 'Método', 'Monto', 'Estado']];
      for (const item of detail.data) {
        rows.push([
          new Date(item.date).toLocaleDateString('es-AR'),
          item.userName, item.userEmail, item.venueName, item.sportTypeName,
          item.methodLabel, String(item.amount), item.status,
        ]);
      }
      downloadCsv(`ingresos_${from}_${to}.csv`, rows);
    });
  }, [detail, from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleIngresosSearch = useCallback((s: string) => setDetailFilters(f => ({ ...f, search: s || undefined, page: 1 })), []);
  const handleIngresosSort = useCallback((sort: import('@components/shared/DataToolbar').SortState | null) => setDetailFilters(f => ({ ...f, sortBy: sort ? INGRESOS_SORT_MAP[sort.field] ?? sort.field : undefined, sortDirection: sort?.direction, page: 1 })), []);
  const handleIngresosFilters = useCallback((_rules: FilterRule[]) => {}, []);

  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const maxMethod = Math.max(0, ...Object.values(data.byMethod));
  const maxSport = Math.max(0, ...data.bySportType.map((s) => s.total));

  const STATUS_COLORS: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    REJECTED: 'bg-red-100 text-red-700',
    PENDING_VALIDATION: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Total recaudado" value={fmt(data.total)} color="text-green-700" />
        <KpiCard icon={CheckCircle} label="Pagos aprobados" value={fmtNum(data.count)} />
        <KpiCard icon={TrendingUp} label="Ticket promedio" value={fmt(data.avgTicket)} />
        <KpiCard icon={BarChart2} label="Principal deporte" value={data.bySportType[0]?.name ?? '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SubCard title="Por método de pago" empty={Object.keys(data.byMethod).length === 0}>
          <div className="space-y-2.5">
            {Object.entries(data.byMethod).map(([m, a]) => (
              <BarRow key={m} label={METHOD_LABELS[m] ?? m} value={a} max={maxMethod} suffix={fmt(a)} />
            ))}
          </div>
        </SubCard>
        <SubCard title="Por tipo de deporte" empty={data.bySportType.length === 0}>
          <div className="space-y-2.5">
            {data.bySportType.map((s) => (
              <BarRow key={s.id} label={s.name} value={s.total} max={maxSport} suffix={fmt(s.total)} />
            ))}
          </div>
        </SubCard>
      </div>

      {data.timeline.length > 1 && (
        <SubCard title="Evolución diaria">
          <div className="flex items-end gap-0.5 h-28">
            {(() => {
              const maxVal = Math.max(...data.timeline.map((t) => t.total), 1);
              return data.timeline.map((t) => (
                <div key={t.date} className="flex flex-col flex-1 min-w-[6px] group relative"
                  title={`${t.date}: ${fmt(t.total)}`}>
                  <div className="w-full bg-primary-400 group-hover:bg-primary-600 rounded-t-sm transition-colors"
                    style={{ height: `${Math.max(Math.round((t.total / maxVal) * 100), 2)}%` }} />
                </div>
              ));
            })()}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400">
            <span>{data.timeline[0]?.date}</span>
            <span>{data.timeline[data.timeline.length - 1]?.date}</span>
          </div>
        </SubCard>
      )}

      <DataToolbar
        columns={ingresosColumns}
        onSearchChange={handleIngresosSearch}
        onSortChange={handleIngresosSort}
        onFiltersChange={handleIngresosFilters}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
      />

      <div className="card overflow-hidden">
        {detailLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !detail || detail.data.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500"><p>Sin pagos en el período</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('date') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>}
                    {visibleColumns.includes('userName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>}
                    {visibleColumns.includes('venueName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancha</th>}
                    {visibleColumns.includes('sportTypeName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deporte</th>}
                    {visibleColumns.includes('method') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>}
                    {visibleColumns.includes('amount') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>}
                    {visibleColumns.includes('status') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detail.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('date') && <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(item.date).toLocaleDateString('es-AR')}</td>}
                      {visibleColumns.includes('userName') && (
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{item.userName}</p>
                          <p className="text-xs text-gray-500">{item.userEmail}</p>
                        </td>
                      )}
                      {visibleColumns.includes('venueName') && <td className="px-6 py-4 text-sm text-gray-700">{item.venueName}</td>}
                      {visibleColumns.includes('sportTypeName') && <td className="px-6 py-4 text-sm text-gray-700">{item.sportTypeName}</td>}
                      {visibleColumns.includes('method') && <td className="px-6 py-4 text-sm text-gray-700">{item.methodLabel}</td>}
                      {visibleColumns.includes('amount') && <td className="px-6 py-4 text-sm font-semibold text-gray-900">{fmt(item.amount)}</td>}
                      {visibleColumns.includes('status') && (
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            item.status === 'PENDING_VALIDATION' ? 'bg-blue-100 text-blue-700' :
                            STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-700'
                          }`}>
                            {item.status === 'APPROVED' ? 'Aprobado' : item.status === 'PENDING_VALIDATION' ? 'Pend. validación' : item.status}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DetailPager meta={detail.meta} page={detailFilters.page ?? 1} setPage={(p) => setDetailFilters(f => ({ ...f, page: p }))} />
          </>
        )}
      </div>
    </div>
  );
}

function SeccionOcupacion({ filters, from, to, onReady }: { filters: ReportFilters; from: string; to: string; onReady: (fn: () => void) => void }) {
  const { data, isLoading } = useOccupancyReport(filters);
  const [detailFilters, setDetailFilters] = useState<DetailFilters & { status?: string }>({ from, to, page: 1, limit: 20 });
  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('report-ocupacion-cols', ocupacionColumns);

  useEffect(() => {
    setDetailFilters(f => ({ ...f, from, to, page: 1 }));
  }, [from, to]);

  const { data: detail, isLoading: detailLoading } = useOccupancyDetail(detailFilters);

  useEffect(() => {
    if (!detail) return;
    onReady(() => {
      const rows = [
        ['Fecha', 'Cancha', 'Hora inicio', 'Hora fin', 'Estado'],
        ...detail.data.map((s) => [s.date, s.venueName, s.startTime, s.endTime, s.statusLabel]),
      ];
      downloadCsv(`ocupacion_${from}_${to}.csv`, rows);
    });
  }, [detail, from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOcupacionSearch = useCallback((s: string) => setDetailFilters(f => ({ ...f, search: s || undefined, page: 1 })), []);
  const handleOcupacionSort = useCallback((sort: import('@components/shared/DataToolbar').SortState | null) => setDetailFilters(f => ({ ...f, sortBy: sort ? OCUPACION_SORT_MAP[sort.field] ?? sort.field : undefined, sortDirection: sort?.direction, page: 1 })), []);
  const handleOcupacionFilters = useCallback((rules: FilterRule[]) => {
    setDetailFilters(f => {
      const next = { ...f, page: 1 };
      const statusRule = rules.find(r => r.field === 'status');
      if (statusRule) (next as any).status = statusRule.value;
      else delete (next as any).status;
      return next;
    });
  }, []);

  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const maxVenue = Math.max(0, ...data.byVenue.map((v) => v.occupancyPct));
  const maxDow = Math.max(0, ...data.byDayOfWeek.map((d) => d.occupancyPct));

  const STATUS_COLORS: Record<string, string> = {
    AVAILABLE: 'bg-green-100 text-green-700',
    BOOKED: 'bg-blue-100 text-blue-700',
    BLOCKED: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard icon={BarChart2} label="Total turnos" value={fmtNum(data.overall.totalSlots)} />
        <KpiCard icon={CheckCircle} label="Reservados" value={fmtNum(data.overall.bookedSlots)} color="text-blue-700" />
        <KpiCard icon={TrendingUp} label="Ocupación general" value={`${data.overall.occupancyPct}%`}
          color={data.overall.occupancyPct >= 70 ? 'text-green-700' : data.overall.occupancyPct >= 40 ? 'text-yellow-600' : 'text-red-600'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SubCard title="Ocupación por cancha" empty={data.byVenue.length === 0}>
          <div className="space-y-2.5">
            {data.byVenue.map((v) => (
              <BarRow key={v.id} label={v.name} value={v.occupancyPct} max={Math.max(maxVenue, 1)}
                suffix={`${v.occupancyPct}% (${v.bookedSlots}/${v.totalSlots})`} />
            ))}
          </div>
        </SubCard>
        <SubCard title="Ocupación por día de la semana">
          <div className="space-y-2.5">
            {data.byDayOfWeek.filter((d) => d.totalSlots > 0).length === 0
              ? <p className="text-sm text-gray-400">Sin datos</p>
              : data.byDayOfWeek.filter((d) => d.totalSlots > 0).map((d) => (
                  <BarRow key={d.day} label={d.label} value={d.occupancyPct} max={Math.max(maxDow, 1)} suffix={`${d.occupancyPct}%`} />
                ))}
          </div>
        </SubCard>
      </div>

      <DataToolbar
        columns={ocupacionColumns}
        onSearchChange={handleOcupacionSearch}
        onSortChange={handleOcupacionSort}
        onFiltersChange={handleOcupacionFilters}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
        quickFilters={[{
          key: 'status',
          label: 'Estado',
          value: detailFilters.status ?? '',
          onChange: (v) => setDetailFilters(f => ({ ...f, status: v || undefined, page: 1 })),
          options: [
            { label: 'Disponible', value: 'AVAILABLE' },
            { label: 'Reservado', value: 'BOOKED' },
            { label: 'Bloqueado', value: 'BLOCKED' },
          ],
        }]}
      />

      <div className="card overflow-hidden">
        {detailLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !detail || detail.data.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500"><p>Sin turnos en el período</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('date') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>}
                    {visibleColumns.includes('venueName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancha</th>}
                    {visibleColumns.includes('startTime') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora inicio</th>}
                    {visibleColumns.includes('endTime') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora fin</th>}
                    {visibleColumns.includes('status') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detail.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('date') && <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.date}</td>}
                      {visibleColumns.includes('venueName') && <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.venueName}</td>}
                      {visibleColumns.includes('startTime') && <td className="px-6 py-4 text-sm text-gray-600">{item.startTime}</td>}
                      {visibleColumns.includes('endTime') && <td className="px-6 py-4 text-sm text-gray-600">{item.endTime}</td>}
                      {visibleColumns.includes('status') && (
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {item.statusLabel}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DetailPager meta={detail.meta} page={detailFilters.page ?? 1} setPage={(p) => setDetailFilters(f => ({ ...f, page: p }))} />
          </>
        )}
      </div>
    </div>
  );
}

function SeccionReservas({ filters, from, to, onReady }: { filters: ReportFilters; from: string; to: string; onReady: (fn: () => void) => void }) {
  const { data, isLoading } = useBookingsReport(filters);
  const [detailFilters, setDetailFilters] = useState<DetailFilters & { status?: string }>({ from, to, page: 1, limit: 20 });
  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('report-reservas-cols', reservasColumns);

  useEffect(() => {
    setDetailFilters(f => ({ ...f, from, to, page: 1 }));
  }, [from, to]);

  const { data: detail, isLoading: detailLoading } = useBookingsDetail(detailFilters);

  useEffect(() => {
    if (!detail) return;
    onReady(() => {
      const rows = [
        ['Fecha creación', 'Socio', 'Email', 'Cancha', 'Fecha turno', 'Hora', 'Estado'],
        ...detail.data.map((b) => [
          new Date(b.createdAt).toLocaleDateString('es-AR'),
          b.userName, b.userEmail, b.venueName, b.slotDate,
          `${b.startTime}–${b.endTime}`, b.statusLabel,
        ]),
      ];
      downloadCsv(`reservas_${from}_${to}.csv`, rows);
    });
  }, [detail, from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReservasSearch = useCallback((s: string) => setDetailFilters(f => ({ ...f, search: s || undefined, page: 1 })), []);
  const handleReservasSort = useCallback((sort: import('@components/shared/DataToolbar').SortState | null) => setDetailFilters(f => ({ ...f, sortBy: sort ? RESERVAS_SORT_MAP[sort.field] ?? sort.field : undefined, sortDirection: sort?.direction, page: 1 })), []);
  const handleReservasFilters = useCallback((rules: FilterRule[]) => {
    setDetailFilters(f => {
      const next = { ...f, page: 1 };
      const statusRule = rules.find(r => r.field === 'status');
      if (statusRule) (next as any).status = statusRule.value;
      else delete (next as any).status;
      return next;
    });
  }, []);

  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-orange-100 text-orange-700',
    PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={Calendar} label="Total creadas" value={fmtNum(data.summary.total)} />
        <KpiCard icon={CheckCircle} label="Confirmadas" value={fmtNum(data.summary.confirmed)} color="text-green-700" />
        <KpiCard icon={XCircle} label="Canceladas" value={fmtNum(data.summary.cancelled)} color="text-red-600" />
        <KpiCard icon={AlertTriangle} label="No-shows" value={fmtNum(data.summary.noShow)} color="text-orange-600" />
        <KpiCard icon={DollarSign} label="Pend. de pago" value={fmtNum(data.summary.pendingPayment)} color="text-yellow-600" />
      </div>

      <DataToolbar
        columns={reservasColumns}
        onSearchChange={handleReservasSearch}
        onSortChange={handleReservasSort}
        onFiltersChange={handleReservasFilters}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
        quickFilters={[{
          key: 'status',
          label: 'Estado',
          value: detailFilters.status ?? '',
          onChange: (v) => setDetailFilters(f => ({ ...f, status: v || undefined, page: 1 })),
          options: [
            { label: 'Confirmada', value: 'CONFIRMED' },
            { label: 'Cancelada', value: 'CANCELLED' },
            { label: 'Ausente', value: 'NO_SHOW' },
            { label: 'Pend. pago', value: 'PENDING_PAYMENT' },
          ],
        }]}
      />

      <div className="card overflow-hidden">
        {detailLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !detail || detail.data.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500"><p>Sin reservas en el período</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('createdAt') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha creación</th>}
                    {visibleColumns.includes('userName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>}
                    {visibleColumns.includes('venueName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancha</th>}
                    {visibleColumns.includes('slotDate') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha turno</th>}
                    {visibleColumns.includes('startTime') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>}
                    {visibleColumns.includes('status') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detail.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('createdAt') && <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString('es-AR')}</td>}
                      {visibleColumns.includes('userName') && (
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{item.userName}</p>
                          <p className="text-xs text-gray-500">{item.userEmail}</p>
                        </td>
                      )}
                      {visibleColumns.includes('venueName') && <td className="px-6 py-4 text-sm text-gray-700">{item.venueName}</td>}
                      {visibleColumns.includes('slotDate') && <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.slotDate}</td>}
                      {visibleColumns.includes('startTime') && <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.startTime}–{item.endTime}</td>}
                      {visibleColumns.includes('status') && (
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {item.statusLabel}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DetailPager meta={detail.meta} page={detailFilters.page ?? 1} setPage={(p) => setDetailFilters(f => ({ ...f, page: p }))} />
          </>
        )}
      </div>
    </div>
  );
}

function SeccionMembresias({ filters, from, to, onReady }: { filters: ReportFilters; from: string; to: string; onReady: (fn: () => void) => void }) {
  const { data, isLoading } = useMembershipsReport(filters);
  const [detailFilters, setDetailFilters] = useState<DetailFilters & { status?: string }>({ from, to, page: 1, limit: 20 });
  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('report-membresias-cols', membresiasColumns);

  useEffect(() => {
    setDetailFilters(f => ({ ...f, from, to, page: 1 }));
  }, [from, to]);

  const { data: detail, isLoading: detailLoading } = useMembershipsDetail(detailFilters);

  useEffect(() => {
    if (!detail) return;
    onReady(() => {
      const rows = [
        ['Socio', 'Email', 'Plan', 'Estado', 'Fecha inicio', 'Fecha fin'],
        ...detail.data.map((m) => [m.userName, m.userEmail, m.planName, m.statusLabel, m.startDate ?? '', m.endDate ?? '']),
      ];
      downloadCsv(`membresias_${from}_${to}.csv`, rows);
    });
  }, [detail, from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMembresiasSearch = useCallback((s: string) => setDetailFilters(f => ({ ...f, search: s || undefined, page: 1 })), []);
  const handleMembresiasSort = useCallback((sort: import('@components/shared/DataToolbar').SortState | null) => setDetailFilters(f => ({ ...f, sortBy: sort ? MEMBRESIAS_SORT_MAP[sort.field] ?? sort.field : undefined, sortDirection: sort?.direction, page: 1 })), []);
  const handleMembresiasFilters = useCallback((rules: FilterRule[]) => {
    setDetailFilters(f => {
      const next = { ...f, page: 1 };
      const statusRule = rules.find(r => r.field === 'status');
      if (statusRule) (next as any).status = statusRule.value;
      else delete (next as any).status;
      return next;
    });
  }, []);

  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const maxPlan = Math.max(0, ...data.byPlan.map((p) => p.active));

  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    INACTIVE: 'bg-gray-100 text-gray-600',
    CANCELLED: 'bg-red-100 text-red-700',
    SUSPENDED: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={CreditCard} label="Activas hoy" value={fmtNum(data.summary.totalActive)} color="text-green-700" />
        <KpiCard icon={CheckCircle} label="Nuevas en período" value={fmtNum(data.summary.newInPeriod)} />
        <KpiCard icon={XCircle} label="Canceladas" value={fmtNum(data.summary.cancelledInPeriod)} color="text-red-600" />
        <KpiCard icon={AlertTriangle} label="Susp. automáticas" value={fmtNum(data.summary.autoSuspensions)} color="text-orange-600" />
        <KpiCard icon={Users} label="Susp. manuales" value={fmtNum(data.summary.manualSuspensions)} color="text-yellow-600" />
      </div>

      {data.byPlan.length > 0 && (
        <SubCard title="Socios activos por plan">
          <div className="space-y-2.5">
            {data.byPlan.map((p) => (
              <BarRow key={p.id} label={p.name} value={p.active} max={Math.max(maxPlan, 1)} suffix={`${p.active} socios`} />
            ))}
          </div>
        </SubCard>
      )}

      <DataToolbar
        columns={membresiasColumns}
        onSearchChange={handleMembresiasSearch}
        onSortChange={handleMembresiasSort}
        onFiltersChange={handleMembresiasFilters}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
        quickFilters={[{
          key: 'status',
          label: 'Estado',
          value: detailFilters.status ?? '',
          onChange: (v) => setDetailFilters(f => ({ ...f, status: v || undefined, page: 1 })),
          options: [
            { label: 'Activa', value: 'ACTIVE' },
            { label: 'Inactiva', value: 'INACTIVE' },
            { label: 'Cancelada', value: 'CANCELLED' },
            { label: 'Suspendida', value: 'SUSPENDED' },
          ],
        }]}
      />

      <div className="card overflow-hidden">
        {detailLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !detail || detail.data.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500"><p>Sin membresías en el período</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('userName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>}
                    {visibleColumns.includes('planName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>}
                    {visibleColumns.includes('status') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>}
                    {visibleColumns.includes('startDate') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>}
                    {visibleColumns.includes('endDate') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>}
                    {visibleColumns.includes('createdAt') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creada</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detail.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('userName') && (
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{item.userName}</p>
                          <p className="text-xs text-gray-500">{item.userEmail}</p>
                        </td>
                      )}
                      {visibleColumns.includes('planName') && <td className="px-6 py-4 text-sm text-gray-700">{item.planName}</td>}
                      {visibleColumns.includes('status') && (
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[item.status] ?? 'bg-gray-100 text-gray-700'}`}>
                            {item.statusLabel}
                          </span>
                        </td>
                      )}
                      {visibleColumns.includes('startDate') && <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.startDate ?? '—'}</td>}
                      {visibleColumns.includes('endDate') && <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.endDate ?? '—'}</td>}
                      {visibleColumns.includes('createdAt') && <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{new Date(item.createdAt).toLocaleDateString('es-AR')}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DetailPager meta={detail.meta} page={detailFilters.page ?? 1} setPage={(p) => setDetailFilters(f => ({ ...f, page: p }))} />
          </>
        )}
      </div>
    </div>
  );
}

function SeccionServicios({ filters, from, to, onReady }: { filters: ReportFilters; from: string; to: string; onReady: (fn: () => void) => void }) {
  const { data, isLoading } = useServicesReport(filters);
  const [detailFilters, setDetailFilters] = useState<DetailFilters>({ from, to, page: 1, limit: 20 });
  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('report-servicios-cols', serviciosColumns);

  useEffect(() => {
    setDetailFilters(f => ({ ...f, from, to, page: 1 }));
  }, [from, to]);

  const { data: detail, isLoading: detailLoading } = useServicesDetail(detailFilters);

  useEffect(() => {
    if (!detail) return;
    onReady(() => {
      const rows = [
        ['Servicio', 'Socio', 'Email', 'Cancha', 'Fecha', 'Precio', 'Estado reserva'],
        ...detail.data.map((s) => [s.serviceName, s.userName, s.userEmail, s.venueName, s.bookingDate, String(s.price), s.bookingStatusLabel]),
      ];
      downloadCsv(`servicios_${from}_${to}.csv`, rows);
    });
  }, [detail, from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleServiciosSearch = useCallback((s: string) => setDetailFilters(f => ({ ...f, search: s || undefined, page: 1 })), []);
  const handleServiciosSort = useCallback((sort: import('@components/shared/DataToolbar').SortState | null) => setDetailFilters(f => ({ ...f, sortBy: sort ? SERVICIOS_SORT_MAP[sort.field] ?? sort.field : undefined, sortDirection: sort?.direction, page: 1 })), []);
  const handleServiciosFilters = useCallback((_rules: FilterRule[]) => {}, []);

  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const maxService = Math.max(0, ...data.services.map((s) => s.count));

  const STATUS_COLORS: Record<string, string> = {
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    NO_SHOW: 'bg-orange-100 text-orange-700',
    PENDING_PAYMENT: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <KpiCard icon={Package} label="Usos en período" value={fmtNum(data.totalUsage)} />
        <KpiCard icon={DollarSign} label="Ingresos por servicios" value={fmt(data.totalRevenue)} color="text-green-700" />
      </div>

      {data.services.length > 0 ? (
        <SubCard title="Uso por servicio">
          <div className="space-y-2.5">
            {data.services.map((s) => (
              <BarRow key={s.id} label={s.name} value={s.count} max={Math.max(maxService, 1)}
                suffix={`${s.count} uso${s.count !== 1 ? 's' : ''} · ${fmt(s.revenue)}`} />
            ))}
          </div>
        </SubCard>
      ) : (
        <div className="card p-10 text-center text-sm text-gray-400">
          Sin servicios adicionales usados en este período
        </div>
      )}

      <DataToolbar
        columns={serviciosColumns}
        onSearchChange={handleServiciosSearch}
        onSortChange={handleServiciosSort}
        onFiltersChange={handleServiciosFilters}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
      />

      <div className="card overflow-hidden">
        {detailLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : !detail || detail.data.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500"><p>Sin usos de servicios en el período</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('serviceName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>}
                    {visibleColumns.includes('userName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>}
                    {visibleColumns.includes('venueName') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancha</th>}
                    {visibleColumns.includes('bookingDate') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>}
                    {visibleColumns.includes('price') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>}
                    {visibleColumns.includes('bookingStatus') && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detail.data.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {visibleColumns.includes('serviceName') && <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.serviceName}</td>}
                      {visibleColumns.includes('userName') && (
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">{item.userName}</p>
                          <p className="text-xs text-gray-500">{item.userEmail}</p>
                        </td>
                      )}
                      {visibleColumns.includes('venueName') && <td className="px-6 py-4 text-sm text-gray-700">{item.venueName}</td>}
                      {visibleColumns.includes('bookingDate') && <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{item.bookingDate}</td>}
                      {visibleColumns.includes('price') && <td className="px-6 py-4 text-sm font-semibold text-gray-900">{fmt(item.price)}</td>}
                      {visibleColumns.includes('bookingStatus') && (
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[item.bookingStatus] ?? 'bg-gray-100 text-gray-700'}`}>
                            {item.bookingStatusLabel}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DetailPager meta={detail.meta} page={detailFilters.page ?? 1} setPage={(p) => setDetailFilters(f => ({ ...f, page: p }))} />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'ingresos',    label: 'Ingresos',    icon: DollarSign  },
  { id: 'ocupacion',   label: 'Ocupación',   icon: BarChart2   },
  { id: 'reservas',    label: 'Reservas',    icon: Calendar    },
  { id: 'membresias',  label: 'Membresías',  icon: CreditCard  },
  { id: 'servicios',   label: 'Servicios',   icon: Package     },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

export default function ReportesPage() {
  const defaults = getDefaultRange();
  const [section, setSection] = useState<SectionId>('ingresos');
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [exportFn, setExportFn] = useState<(() => void) | null>(null);
  const filters: ReportFilters = { from, to };

  function applyPreset(preset: 'hoy' | 'semana' | 'mes' | 'anio') {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ds = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todayStr = ds(now);
    if (preset === 'hoy') { setFrom(todayStr); setTo(todayStr); }
    else if (preset === 'semana') {
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      setFrom(ds(mon)); setTo(todayStr);
    } else if (preset === 'mes') {
      setFrom(ds(new Date(now.getFullYear(), now.getMonth(), 1))); setTo(todayStr);
    } else if (preset === 'anio') {
      setFrom(`${now.getFullYear()}-01-01`); setTo(todayStr);
    }
  }

  return (
    <div className="space-y-5">

      {/* Título */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Reportes</h2>
        <p className="text-sm text-gray-500 mt-0.5">Análisis de ingresos, ocupación, reservas, membresías y servicios</p>
      </div>

      {/* Toolbar: secciones + filtros + exportar */}
      <div className="card p-0 overflow-hidden">
        {/* Tabs de sección */}
        <div className="flex items-center border-b border-gray-100 px-1 overflow-x-auto">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setSection(id); setExportFn(null); }}
              className={cn(
                'flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                section === id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Filtros de período + exportar */}
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          <span className="text-xs font-medium text-gray-500">Período:</span>
          {(['hoy', 'semana', 'mes', 'anio'] as const).map((p) => (
            <button key={p} onClick={() => applyPreset(p)}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              {p === 'anio' ? 'Este año' : p === 'mes' ? 'Este mes' : p === 'semana' ? 'Esta semana' : 'Hoy'}
            </button>
          ))}
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input text-sm py-1 px-2" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input text-sm py-1 px-2" />
          </div>
          <div className="flex-1" />
          {exportFn && (
            <button onClick={exportFn}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
              <Download className="w-4 h-4" /> Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Contenido de sección */}
      {section === 'ingresos'   && <SeccionIngresos   filters={filters} from={from} to={to} onReady={(fn) => setExportFn(() => fn)} />}
      {section === 'ocupacion'  && <SeccionOcupacion  filters={filters} from={from} to={to} onReady={(fn) => setExportFn(() => fn)} />}
      {section === 'reservas'   && <SeccionReservas   filters={filters} from={from} to={to} onReady={(fn) => setExportFn(() => fn)} />}
      {section === 'membresias' && <SeccionMembresias filters={filters} from={from} to={to} onReady={(fn) => setExportFn(() => fn)} />}
      {section === 'servicios'  && <SeccionServicios  filters={filters} from={from} to={to} onReady={(fn) => setExportFn(() => fn)} />}

    </div>
  );
}
