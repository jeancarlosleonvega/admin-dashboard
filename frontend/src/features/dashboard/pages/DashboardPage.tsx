import { useNavigate } from 'react-router-dom';
import { DollarSign, BarChart2, Calendar, CreditCard, AlertTriangle, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { useDashboardReport } from '@/hooks/queries/useReports';
import { Spinner } from '@components/ui/Spinner';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

function StatCard({ label, value, sub, icon: Icon, gradient, iconBg }: {
  label: string; value: string; sub?: { text: string; warn?: boolean };
  icon: any; gradient: string; iconBg: string;
}) {
  return (
    <div className={`rounded-xl p-5 text-white shadow-md ${gradient} flex flex-col justify-between gap-4 min-h-[130px]`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-80 uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      {sub && (
        <p className={`text-xs font-medium flex items-center gap-1 ${sub.warn ? 'text-yellow-200' : 'opacity-70'}`}>
          {sub.warn && <AlertTriangle className="w-3 h-3" />}
          {sub.text}
        </p>
      )}
    </div>
  );
}

function ActionCard({ title, icon: Icon, iconColor, count, children, emptyText, onViewAll }: {
  title: string; icon: any; iconColor: string; count: number;
  children: React.ReactNode; emptyText: string; onViewAll?: () => void;
}) {
  return (
    <div className="card flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          {count > 0 && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${iconColor.replace('text-', 'bg-').replace('-500', '-100').replace('-600', '-100')} ${iconColor}`}>
              {count}
            </span>
          )}
        </div>
        {onViewAll && count > 0 && (
          <button onClick={onViewAll} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium">
            Ver todos <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="flex-1 divide-y divide-gray-50">
        {count === 0 ? (
          <p className="px-5 py-6 text-sm text-gray-400 text-center">{emptyText}</p>
        ) : children}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useDashboardReport();

  if (isLoading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (isError || !data) return <div className="text-center py-20 text-red-500 text-sm">Error al cargar el dashboard</div>;

  return (
    <div className="space-y-6">

      {/* Stats principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos del mes"
          value={formatCurrency(data.ingresos.mesActual)}
          sub={data.ingresos.pendientesValidacion > 0
            ? { text: `${data.ingresos.pendientesValidacion} transferencia${data.ingresos.pendientesValidacion > 1 ? 's' : ''} por validar`, warn: true }
            : { text: `${data.ingresos.pagosMes} pagos aprobados` }}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-green-500 to-emerald-600"
          iconBg="bg-white/20"
        />
        <StatCard
          label="Ocupación hoy"
          value={`${data.ocupacion.hoyPct}%`}
          sub={{ text: `${data.ocupacion.hoyReservados} ocupados de ${data.ocupacion.hoyTotal} turnos` }}
          icon={BarChart2}
          gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          iconBg="bg-white/20"
        />
        <StatCard
          label="Reservas del mes"
          value={String(data.reservas.mesConfirmadas)}
          sub={data.reservas.mesPendientes > 0
            ? { text: `${data.reservas.mesPendientes} pendiente${data.reservas.mesPendientes > 1 ? 's' : ''} de pago`, warn: true }
            : { text: 'confirmadas y pagas' }}
          icon={Calendar}
          gradient="bg-gradient-to-br from-violet-500 to-purple-600"
          iconBg="bg-white/20"
        />
        <StatCard
          label="Membresías activas"
          value={String(data.membresias.activas)}
          sub={data.membresias.suspensionesActivas > 0
            ? { text: `${data.membresias.suspensionesActivas} suspensión${data.membresias.suspensionesActivas > 1 ? 'es activas' : ' activa'}`, warn: true }
            : { text: `+${data.membresias.nuevasMes} nuevas este mes` }}
          icon={CreditCard}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          iconBg="bg-white/20"
        />
      </div>

      {/* Listas accionables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Transferencias por validar */}
        <ActionCard
          title="Transferencias por validar"
          icon={Clock}
          iconColor="text-orange-500"
          count={data.transfersPendientes.length}
          emptyText="No hay transferencias pendientes"
          onViewAll={() => navigate('/finanzas?tab=pagos')}
        >
          {data.transfersPendientes.map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">{t.userName}</p>
                <p className="text-xs text-gray-400">{t.venueName} · {t.startTime}</p>
              </div>
              <span className="text-sm font-semibold text-orange-600">{formatCurrency(t.amount)}</span>
            </div>
          ))}
        </ActionCard>

        {/* Reservas de hoy */}
        <ActionCard
          title="Reservas de hoy"
          icon={CheckCircle}
          iconColor="text-blue-500"
          count={data.reservasHoy.length}
          emptyText="Sin reservas confirmadas para hoy"
        >
          {data.reservasHoy.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-medium text-gray-800">{r.userName}</p>
                <p className="text-xs text-gray-400">{r.venueName}</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {r.startTime} – {r.endTime}
              </span>
            </div>
          ))}
        </ActionCard>

        {/* Suspensiones activas */}
        <ActionCard
          title="Suspensiones activas"
          icon={AlertTriangle}
          iconColor="text-red-500"
          count={data.suspensionesActivas.length}
          emptyText="No hay socios suspendidos"
          onViewAll={() => navigate('/socios')}
        >
          {data.suspensionesActivas.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => navigate(`/socios/${s.userId}`)}>
              <div>
                <p className="text-sm font-medium text-gray-800">{s.userName}</p>
                <p className="text-xs text-gray-400">
                  {s.isAutomatic ? 'Automática' : 'Manual'}
                  {s.endDate ? ` · hasta ${new Date(s.endDate).toLocaleDateString('es-AR')}` : ' · indefinida'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300" />
            </div>
          ))}
        </ActionCard>

      </div>

    </div>
  );
}
