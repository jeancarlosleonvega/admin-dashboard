import { useState } from 'react';
import {
  BarChart2, TrendingUp, Calendar, Users, AlertTriangle,
  DollarSign, CheckCircle, XCircle, CreditCard, Package, Download,
} from 'lucide-react';
import { cn } from '@lib/utils';
import {
  useRevenueReport, useOccupancyReport, useBookingsReport,
  useMembershipsReport, useServicesReport,
} from '@/hooks/queries/useReports';
import { Spinner } from '@components/ui/Spinner';
import type { ReportFilters } from '@api/reports.api';

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

// ─── Secciones ────────────────────────────────────────────────────────────────

function SeccionIngresos({ filters, from, to }: { filters: ReportFilters; from: string; to: string }) {
  const { data, isLoading } = useRevenueReport(filters);
  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const maxMethod = Math.max(0, ...Object.values(data.byMethod));
  const maxSport = Math.max(0, ...data.bySportType.map((s) => s.total));

  function exportar() {
    const rows: string[][] = [['Fecha', 'Total']];
    for (const t of data!.timeline) rows.push([t.date, String(t.total)]);
    downloadCsv(`ingresos_${from}_${to}.csv`, rows);
  }

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

      <div className="flex justify-end">
        <button onClick={exportar}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>
    </div>
  );
}

function SeccionOcupacion({ filters, from, to }: { filters: ReportFilters; from: string; to: string }) {
  const { data, isLoading } = useOccupancyReport(filters);
  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const maxVenue = Math.max(0, ...data.byVenue.map((v) => v.occupancyPct));
  const maxDow = Math.max(0, ...data.byDayOfWeek.map((d) => d.occupancyPct));

  function exportar() {
    const rows = [
      ['Cancha', 'Total turnos', 'Reservados', 'Ocupación %'],
      ...data!.byVenue.map((v) => [v.name, String(v.totalSlots), String(v.bookedSlots), String(v.occupancyPct)]),
    ];
    downloadCsv(`ocupacion_${from}_${to}.csv`, rows);
  }

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

      <div className="flex justify-end">
        <button onClick={exportar}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>
    </div>
  );
}

function SeccionReservas({ filters, from, to }: { filters: ReportFilters; from: string; to: string }) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useBookingsReport(filters);
  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const maxTop = data.topSocios[0]?.confirmedCount ?? 0;
  const maxNoShow = data.noShowRanking[0]?.noShowCount ?? 0;

  const filteredTop = data.topSocios.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const filteredNoShow = data.noShowRanking.filter((s) =>
    `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search.toLowerCase())
  );

  function exportar() {
    const rows = [
      ['Tipo', 'Nombre', 'Email', 'Cantidad'],
      ...data!.topSocios.map((s) => ['Top reservas', `${s.firstName} ${s.lastName}`, s.email, String(s.confirmedCount)]),
      ...data!.noShowRanking.map((s) => ['Ausencias', `${s.firstName} ${s.lastName}`, s.email, String(s.noShowCount)]),
    ];
    downloadCsv(`reservas_${from}_${to}.csv`, rows);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard icon={Calendar} label="Total creadas" value={fmtNum(data.summary.total)} />
        <KpiCard icon={CheckCircle} label="Confirmadas" value={fmtNum(data.summary.confirmed)} color="text-green-700" />
        <KpiCard icon={XCircle} label="Canceladas" value={fmtNum(data.summary.cancelled)} color="text-red-600" />
        <KpiCard icon={AlertTriangle} label="No-shows" value={fmtNum(data.summary.noShow)} color="text-orange-600" />
        <KpiCard icon={DollarSign} label="Pend. de pago" value={fmtNum(data.summary.pendingPayment)} color="text-yellow-600" />
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar socio por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input flex-1 max-w-sm text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600">Limpiar</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SubCard title="Top socios (más reservas confirmadas)" empty={filteredTop.length === 0}>
          <div className="space-y-2.5">
            {filteredTop.map((s) => (
              <BarRow key={s.id} label={`${s.firstName} ${s.lastName}`} value={s.confirmedCount}
                max={Math.max(maxTop, 1)} suffix={`${s.confirmedCount} reserva${s.confirmedCount !== 1 ? 's' : ''}`} />
            ))}
          </div>
        </SubCard>
        <SubCard title="Ranking de ausencias" empty={filteredNoShow.length === 0}>
          {filteredNoShow.length === 0 && !search
            ? <p className="text-sm text-gray-400">Sin ausencias registradas en el período</p>
            : <div className="space-y-2.5">
                {filteredNoShow.map((s) => (
                  <BarRow key={s.id} label={`${s.firstName} ${s.lastName}`} value={s.noShowCount}
                    max={Math.max(maxNoShow, 1)} suffix={`${s.noShowCount} ausencia${s.noShowCount !== 1 ? 's' : ''}`} />
                ))}
              </div>}
        </SubCard>
      </div>

      <div className="flex justify-end">
        <button onClick={exportar}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>
    </div>
  );
}

function SeccionMembresias({ filters, from, to }: { filters: ReportFilters; from: string; to: string }) {
  const { data, isLoading } = useMembershipsReport(filters);
  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const maxPlan = Math.max(0, ...data.byPlan.map((p) => p.active));

  function exportar() {
    const rows = [
      ['Plan', 'Activas'],
      ...data!.byPlan.map((p) => [p.name, String(p.active)]),
    ];
    downloadCsv(`membresias_${from}_${to}.csv`, rows);
  }

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

      <div className="flex justify-end">
        <button onClick={exportar}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>
    </div>
  );
}

function SeccionServicios({ filters, from, to }: { filters: ReportFilters; from: string; to: string }) {
  const { data, isLoading } = useServicesReport(filters);
  if (isLoading) return <SectionLoader />;
  if (!data) return null;

  const maxService = Math.max(0, ...data.services.map((s) => s.count));

  function exportar() {
    const rows = [
      ['Servicio', 'Usos', 'Ingresos'],
      ...data!.services.map((s) => [s.name, String(s.count), String(s.revenue)]),
    ];
    downloadCsv(`servicios_${from}_${to}.csv`, rows);
  }

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

      <div className="flex justify-end">
        <button onClick={exportar}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
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
  const filters: ReportFilters = { from, to };

  // Presets rápidos
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

      {/* Toolbar: secciones + filtros */}
      <div className="card p-0 overflow-hidden">
        {/* Tabs de sección */}
        <div className="flex items-center border-b border-gray-100 px-1 overflow-x-auto">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
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

        {/* Filtros de período */}
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          <span className="text-xs font-medium text-gray-500">Período:</span>

          {/* Presets */}
          {(['hoy', 'semana', 'mes', 'anio'] as const).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors capitalize"
            >
              {p === 'anio' ? 'Este año' : p === 'mes' ? 'Este mes' : p === 'semana' ? 'Esta semana' : 'Hoy'}
            </button>
          ))}

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="input text-sm py-1 px-2" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="input text-sm py-1 px-2" />
          </div>
        </div>
      </div>

      {/* Contenido de sección */}
      {section === 'ingresos'   && <SeccionIngresos   filters={filters} from={from} to={to} />}
      {section === 'ocupacion'  && <SeccionOcupacion  filters={filters} from={from} to={to} />}
      {section === 'reservas'   && <SeccionReservas   filters={filters} from={from} to={to} />}
      {section === 'membresias' && <SeccionMembresias filters={filters} from={from} to={to} />}
      {section === 'servicios'  && <SeccionServicios  filters={filters} from={from} to={to} />}

    </div>
  );
}
