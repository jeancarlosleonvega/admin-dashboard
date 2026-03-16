import { useNavigate } from 'react-router-dom';
import { usePageHeader } from '@/hooks/usePageHeader';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
import { useCreateUserMembership } from '@/hooks/queries/useUserMemberships';
import { useMembershipPlans } from '@/hooks/queries/useMembershipPlans';
import { useUsers } from '@/hooks/queries/useUsers';
import { useRolesList } from '@/hooks/queries/useRoles';
import { Spinner } from '@components/ui/Spinner';
import { DetailSection } from '@components/ui/DetailSection';
import toast from 'react-hot-toast';

const schema = z.object({
  userId: z.string().uuid('Seleccioná un socio'),
  membershipPlanId: z.string().uuid('Seleccioná un plan de membresía'),
  startDate: z.string().min(1, 'La fecha de inicio es obligatoria'),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function UserMembershipCreatePage() {
  const navigate = useNavigate();
  usePageHeader({ subtitle: 'Asignar membresía a socio' });

  const createMembership = useCreateUserMembership();
  const { data: rolesData } = useRolesList();
  const clienteRoleId = rolesData?.find((r) => r.name === 'Cliente')?.id;
  const { data: usersData, isLoading: usersLoading } = useUsers(
    clienteRoleId ? { limit: 100, roleId: clienteRoleId } : { limit: 100 },
  );
  const { data: plansData, isLoading: plansLoading } = useMembershipPlans({ active: 'true', limit: 100 });

  const users = usersData?.data ?? [];
  const plans = plansData?.data ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createMembership.mutateAsync({
        userId: data.userId,
        membershipPlanId: data.membershipPlanId,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
        notes: data.notes || undefined,
      });
      toast.success('Membresía asignada exitosamente. La membresía anterior fue cancelada automáticamente.');
      navigate('/membresias-socios');
    } catch (error) {
      const message = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Error al asignar la membresía';
      toast.error(message);
    }
  };

  return (
    <div>
      <button
        onClick={() => navigate('/membresias-socios')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Volver a Membresías
      </button>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="px-6">
            <DetailSection title="Socio y plan" description="Seleccioná el socio y el plan de membresía">
              <div className="space-y-4">
                <div>
                  <label htmlFor="userId" className="label">Socio</label>
                  {usersLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <select
                      id="userId"
                      className={`input ${errors.userId ? 'input-error' : ''}`}
                      {...register('userId')}
                    >
                      <option value="">Seleccioná un socio...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} ({u.email})
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.userId && <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>}
                </div>
                <div>
                  <label htmlFor="membershipPlanId" className="label">Plan de membresía</label>
                  {plansLoading ? (
                    <Spinner size="sm" />
                  ) : (
                    <select
                      id="membershipPlanId"
                      className={`input ${errors.membershipPlanId ? 'input-error' : ''}`}
                      {...register('membershipPlanId')}
                    >
                      <option value="">Seleccioná un plan...</option>
                      {plans.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                  {errors.membershipPlanId && <p className="mt-1 text-sm text-red-600">{errors.membershipPlanId.message}</p>}
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Vigencia" description="Período de validez de la membresía">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="label">Fecha de inicio</label>
                  <input
                    id="startDate"
                    type="date"
                    className={`input ${errors.startDate ? 'input-error' : ''}`}
                    {...register('startDate')}
                  />
                  {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
                </div>
                <div>
                  <label htmlFor="endDate" className="label">Fecha de fin <span className="text-gray-400 font-normal">(opcional)</span></label>
                  <input
                    id="endDate"
                    type="date"
                    className="input"
                    {...register('endDate')}
                  />
                  <p className="mt-1 text-xs text-gray-500">Dejá vacío para sin fecha de vencimiento</p>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Notas" description="Información adicional sobre la membresía" noBorder>
              <div>
                <label htmlFor="notes" className="label">Notas <span className="text-gray-400 font-normal">(opcional)</span></label>
                <textarea
                  id="notes"
                  rows={3}
                  className="input"
                  placeholder="Observaciones sobre esta membresía..."
                  {...register('notes')}
                />
              </div>
            </DetailSection>
          </div>

          <div className="px-6 pb-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/membresias-socios')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button type="submit" disabled={createMembership.isPending} className="btn-primary">
              {createMembership.isPending ? <Spinner size="sm" className="text-white" /> : 'Asignar membresía'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
