import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, User, CreditCard, Calendar, DollarSign, Ban,
  CheckCircle, XCircle, AlertTriangle, Clock,
} from 'lucide-react';
import { useUser } from '@/hooks/queries/useUsers';
import { useBookings } from '@/hooks/queries/useBookings';
import { useUserMemberships } from '@/hooks/queries/useUserMemberships';
import { useUserSuspensions, useCreateSuspension, useLiftSuspension } from '@/hooks/queries/useSuspensions';
import { Spinner } from '@components/ui/Spinner';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import { DetailSection } from '@components/ui/DetailSection';
import StatusBadge from '@components/shared/StatusBadge';
import BookingDetailModal from '@components/shared/BookingDetailModal';
import type { TabDef } from '@components/ui/Tabs';
import type { Booking } from '@/types/booking.types';
import { formatDate, formatDateTime } from '@lib/formatDate';
import toast from 'react-hot-toast';

const tabs: TabDef[] = [
  { id: 'perfil',      label: 'Perfil',      icon: User },
  { id: 'membresia',   label: 'Membresía',   icon: CreditCard },
  { id: 'reservas',    label: 'Reservas',    icon: Calendar },
  { id: 'pagos',       label: 'Pagos',       icon: DollarSign },
  { id: 'suspensiones',label: 'Suspensiones',icon: Ban },
];

const MEMBERSHIP_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  ACTIVE:    { label: 'Activa',    cls: 'bg-green-100 text-green-700' },
  PENDING:   { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
  INACTIVE:  { label: 'Inactiva',  cls: 'bg-gray-100 text-gray-600' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-red-100 text-red-700' },
  EXPIRED:   { label: 'Vencida',   cls: 'bg-orange-100 text-orange-700' },
};

const METHOD_LABELS: Record<string, string> = {
  MERCADOPAGO: 'MercadoPago',
  TRANSFER: 'Transferencia',
  CASH: 'Efectivo',
  WALLET: 'Wallet',
};

const PAYMENT_STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  APPROVED:           { label: 'Aprobado',   icon: <CheckCircle className="w-3.5 h-3.5 text-green-600" /> },
  PENDING_PROOF:      { label: 'Sin comprobante', icon: <Clock className="w-3.5 h-3.5 text-yellow-500" /> },
  PENDING_VALIDATION: { label: 'Pendiente validación', icon: <Clock className="w-3.5 h-3.5 text-blue-500" /> },
  PENDING_CASH:       { label: 'Pago en efectivo', icon: <Clock className="w-3.5 h-3.5 text-gray-400" /> },
  REJECTED:           { label: 'Rechazado',  icon: <XCircle className="w-3.5 h-3.5 text-red-500" /> },
  REFUNDED:           { label: 'Reembolsado',icon: <AlertTriangle className="w-3.5 h-3.5 text-orange-500" /> },
};

export default function SocioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'perfil';

  const { data: user, isLoading, isError } = useUser(id!);
  const { data: bookingsData } = useBookings({ userId: id, limit: 100 });
  const { data: membershipsData } = useUserMemberships({ userId: id });
  const { data: suspensions = [] } = useUserSuspensions(id!);
  const createSuspension = useCreateSuspension();
  const liftSuspension = useLiftSuspension(id!);

  const bookings = bookingsData?.data ?? [];
  const memberships = membershipsData?.data ?? [];

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showSuspendForm, setShowSuspendForm] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendStart, setSuspendStart] = useState(new Date().toISOString().split('T')[0]);
  const [suspendEnd, setSuspendEnd] = useState('');

  const activeSuspension = suspensions.find(
    (s) => !s.liftedAt && (!s.endDate || new Date(s.endDate) > new Date())
  );

  const noShowCount = bookings.filter((b) => b.status === 'NO_SHOW').length;

  const handleCreateSuspension = async () => {
    if (!id || !suspendReason) return;
    try {
      await createSuspension.mutateAsync({ userId: id, reason: suspendReason, startDate: suspendStart, endDate: suspendEnd || undefined });
      toast.success('Suspensión creada');
      setShowSuspendForm(false);
      setSuspendReason('');
      setSuspendEnd('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Error al suspender');
    }
  };

  const handleLiftSuspension = async (suspId: string) => {
    try {
      await liftSuspension.mutateAsync(suspId);
      toast.success('Suspensión levantada');
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message ?? 'Error al levantar suspensión');
    }
  };

  const suspensionStatus = (s: { liftedAt: string | null; endDate: string | null }) => {
    if (s.liftedAt) return { label: 'Levantada', cls: 'text-gray-500 bg-gray-100' };
    if (s.endDate && new Date(s.endDate) <= new Date()) return { label: 'Vencida', cls: 'text-yellow-700 bg-yellow-100' };
    return { label: 'Activa', cls: 'text-red-700 bg-red-100' };
  };

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;
  if (isError || !user) return (
    <div className="text-center py-16">
      <p className="text-red-500">Socio no encontrado</p>
      <button onClick={() => navigate('/socios')} className="mt-3 text-blue-600 hover:underline text-sm">Volver</button>
    </div>
  );

  const activeMembership = memberships.find((m) => m.status === 'ACTIVE');

  return (
    <div>
      <button onClick={() => navigate('/socios')} className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Socios
      </button>

      {/* Header del socio */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-bold text-primary-700">{user.firstName[0]}{user.lastName[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <StatusBadge status={user.status} />
            {activeMembership && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                {activeMembership.membershipPlan.name}
              </span>
            )}
            {activeSuspension && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Suspendido
              </span>
            )}
          </div>
        </div>
        {/* Stats rápidos */}
        <div className="hidden sm:flex gap-6 text-center">
          <div>
            <p className="text-xl font-bold text-gray-900">{bookings.filter(b => b.status === 'CONFIRMED').length}</p>
            <p className="text-xs text-gray-400">Reservas</p>
          </div>
          <div>
            <p className="text-xl font-bold text-orange-600">{noShowCount}</p>
            <p className="text-xs text-gray-400">Ausencias</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{memberships.length}</p>
            <p className="text-xs text-gray-400">Membresías</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 pt-4 border-b border-gray-200">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setSearchParams({ tab: id }, { replace: true })} />
        </div>
        <div className="p-6">

          {/* ── PERFIL ── */}
          <TabPanel id="perfil" activeTab={activeTab}>
            <DetailSection title="Datos personales" description="Información del perfil del socio.">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Nombre</label>
                  <input type="text" className="input bg-gray-50" value={user.firstName} readOnly />
                </div>
                <div>
                  <label className="label">Apellido</label>
                  <input type="text" className="input bg-gray-50" value={user.lastName} readOnly />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="text" className="input bg-gray-50" value={user.email} readOnly />
                </div>
                <div>
                  <label className="label">Estado</label>
                  <div className="mt-1"><StatusBadge status={user.status} /></div>
                </div>
                <div>
                  <label className="label">Sexo</label>
                  <input type="text" className="input bg-gray-50" value={user.sex === 'MALE' ? 'Masculino' : user.sex === 'FEMALE' ? 'Femenino' : '—'} readOnly />
                </div>
                <div>
                  <label className="label">Fecha de nacimiento</label>
                  <input type="text" className="input bg-gray-50" value={formatDate(user.birthDate)} readOnly />
                </div>
                <div>
                  <label className="label">Handicap</label>
                  <input type="text" className="input bg-gray-50" value={user.handicap != null ? String(user.handicap) : '—'} readOnly />
                </div>
              </div>
            </DetailSection>
            <DetailSection title="Datos del sistema" description="Información de registro." noBorder>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Miembro desde</label>
                  <input type="text" className="input bg-gray-50" value={formatDateTime(user.createdAt)} readOnly />
                </div>
                <div>
                  <label className="label">Última actualización</label>
                  <input type="text" className="input bg-gray-50" value={formatDateTime(user.updatedAt)} readOnly />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Roles</p>
                <div className="flex gap-2 flex-wrap">
                  {user.roles.map((r) => (
                    <span key={r.id} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">{r.name}</span>
                  ))}
                </div>
              </div>
            </DetailSection>
          </TabPanel>

          {/* ── MEMBRESÍA ── */}
          <TabPanel id="membresia" activeTab={activeTab}>
            {memberships.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <CreditCard className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Sin membresías registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {memberships.map((m) => {
                  const st = MEMBERSHIP_STATUS_LABELS[m.status] ?? { label: m.status, cls: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={m.id} className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{m.membershipPlan.name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                          {m.mpSubscriptionId && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">MercadoPago</span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2 text-xs text-gray-500">
                          <div>
                            <p className="font-medium text-gray-400">Inicio</p>
                            <p>{formatDate(m.startDate)}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-400">Vencimiento</p>
                            <p>{m.endDate ? formatDate(m.endDate) : 'Indefinida'}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-400">Precio mensual</p>
                            <p className="font-semibold text-gray-700">${parseFloat(String(m.membershipPlan.price)).toLocaleString('es-AR')}</p>
                          </div>
                          {m.membershipPlan.monthlyReservationLimit != null && (
                            <div>
                              <p className="font-medium text-gray-400">Reservas este mes</p>
                              <p>{m.reservationsUsedMonth} / {m.membershipPlan.monthlyReservationLimit}</p>
                            </div>
                          )}
                        </div>
                        {m.notes && <p className="text-xs text-gray-400 mt-1 italic">{m.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabPanel>

          {/* ── RESERVAS ── */}
          <TabPanel id="reservas" activeTab={activeTab}>
            {bookings.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Sin reservas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Espacio</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">
                          {b.slot.venue ? `${b.slot.venue.sportType.name}: ${b.slot.venue.name}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(b.slot.date)}</td>
                        <td className="px-4 py-3 text-gray-500">{b.slot.startTime} – {b.slot.endTime}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={b.status} />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          ${parseFloat(String(b.price)).toLocaleString('es-AR')}
                          {b.isMemberPrice && <span className="ml-1 text-xs text-blue-500">(socio)</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedBooking(b)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabPanel>

          {/* ── PAGOS ── */}
          <TabPanel id="pagos" activeTab={activeTab}>
            {bookings.filter((b) => b.payment).length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">Sin pagos registrados</p>
              </div>
            ) : (
              <>
                {/* Resumen */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total pagado', value: bookings.filter(b => b.payment?.status === 'APPROVED' && b.status !== 'CANCELLED').reduce((s, b) => s + parseFloat(String(b.price)), 0), fmt: true, cls: 'text-green-600' },
                    { label: 'Reservas cobradas', value: bookings.filter(b => b.payment?.status === 'APPROVED' && b.status !== 'CANCELLED').length, fmt: false, cls: 'text-gray-900' },
                    { label: 'Pendientes', value: bookings.filter(b => b.payment && ['PENDING_PROOF', 'PENDING_VALIDATION', 'PENDING_CASH'].includes(b.payment.status)).length, fmt: false, cls: 'text-yellow-600' },
                    { label: 'Reembolsados', value: bookings.filter(b => b.payment?.status === 'REFUNDED').length, fmt: false, cls: 'text-orange-600' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className={`text-xl font-bold ${stat.cls}`}>
                        {stat.fmt ? `$${(stat.value as number).toLocaleString('es-AR')}` : stat.value}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha reserva</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Espacio</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado pago</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {bookings.filter((b) => b.payment).map((b) => {
                        const ps = PAYMENT_STATUS_LABELS[b.payment!.status] ?? { label: b.payment!.status, icon: null };
                        return (
                          <tr key={b.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500">{formatDate(b.slot.date)}</td>
                            <td className="px-4 py-3 text-gray-700">
                              {b.slot.venue ? `${b.slot.venue.sportType.name}: ${b.slot.venue.name}` : '—'}
                            </td>
                            <td className="px-4 py-3 text-gray-500">{METHOD_LABELS[b.payment!.method] ?? b.payment!.method}</td>
                            <td className="px-4 py-3">
                              <span className="flex items-center gap-1.5 text-xs">
                                {ps.icon}
                                {ps.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-gray-900">
                              ${parseFloat(String(b.price)).toLocaleString('es-AR')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </TabPanel>

          {/* ── SUSPENSIONES ── */}
          <TabPanel id="suspensiones" activeTab={activeTab}>
            <div className="space-y-4">
              {/* Resumen ausencias */}
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <p className="text-sm text-orange-800">
                  <span className="font-semibold">{noShowCount}</span> ausencia{noShowCount !== 1 ? 's' : ''} registrada{noShowCount !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Botón suspender */}
              {!activeSuspension && !showSuspendForm && (
                <button
                  onClick={() => setShowSuspendForm(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban className="w-4 h-4" />
                  Suspender socio
                </button>
              )}

              {/* Formulario suspensión */}
              {showSuspendForm && (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-3">
                  <p className="text-sm font-medium text-red-800">Nueva suspensión</p>
                  <div>
                    <label className="label">Motivo <span className="text-red-500">*</span></label>
                    <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={2} className="input resize-none" placeholder="Motivo…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Desde</label>
                      <input type="date" value={suspendStart} onChange={(e) => setSuspendStart(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">Hasta (opcional)</label>
                      <input type="date" value={suspendEnd} onChange={(e) => setSuspendEnd(e.target.value)} className="input" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowSuspendForm(false)} className="flex-1 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
                    <button
                      onClick={handleCreateSuspension}
                      disabled={!suspendReason || createSuspension.isPending}
                      className="flex-1 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {createSuspension.isPending ? 'Guardando…' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}

              {/* Tabla suspensiones */}
              {suspensions.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Sin suspensiones registradas</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Desde</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Hasta</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {suspensions.map((s) => {
                        const st = suspensionStatus(s);
                        const isActive = !s.liftedAt && (!s.endDate || new Date(s.endDate) > new Date());
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-700 max-w-xs truncate" title={s.reason}>{s.reason}</td>
                            <td className="px-3 py-2 text-gray-500">{new Date(s.startDate).toLocaleDateString('es-AR')}</td>
                            <td className="px-3 py-2 text-gray-500">{s.endDate ? new Date(s.endDate).toLocaleDateString('es-AR') : '—'}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isAutomatic ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {s.isAutomatic ? 'Auto' : 'Manual'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {isActive && (
                                <button
                                  onClick={() => handleLiftSuspension(s.id)}
                                  disabled={liftSuspension.isPending}
                                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                                >
                                  Levantar
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabPanel>

        </div>
      </div>

      {/* Modal detalle reserva */}
      {selectedBooking && (
        <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} isAdmin />
      )}
    </div>
  );
}
