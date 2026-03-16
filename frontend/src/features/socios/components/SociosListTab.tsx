import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUsers } from '@/hooks/queries/useUsers';
import { useRolesList } from '@/hooks/queries/useRoles';
import { useUserMemberships } from '@/hooks/queries/useUserMemberships';
import { userMembershipsApi } from '@api/userMemberships.api';
import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@components/ui/Spinner';
import StatusBadge from '@components/shared/StatusBadge';
import DataToolbar from '@components/shared/DataToolbar';
import type { FilterRule, SortState } from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
import type { UserFilters, UserWithRoles, UserStatus } from '@/types/user.types';
import { exportToCsv } from '@/lib/exportCsv';
import { formatDate, formatDateTime } from '@lib/formatDate';

const SORT_FIELD_MAP: Record<string, string> = {
  socio: 'firstName',
  status: 'status',
  handicap: 'handicap',
  miembro_desde: 'createdAt',
};

const columns: ColumnDef[] = [
  { key: 'socio', label: 'Socio', sortable: true, filterable: true, type: 'text' },
  {
    key: 'status', label: 'Estado', sortable: true, filterable: true, type: 'select',
    options: [
      { label: 'Activo', value: 'ACTIVE' },
      { label: 'Inactivo', value: 'INACTIVE' },
      { label: 'Suspendido', value: 'SUSPENDED' },
    ],
  },
  { key: 'handicap', label: 'Handicap', sortable: true, filterable: false },
  { key: 'membresia', label: 'Membresía', sortable: false, filterable: false },
  { key: 'miembro_desde', label: 'Miembro desde', sortable: true, filterable: false, type: 'date' },
  { key: 'actions', label: 'Acciones', sortable: false, filterable: false },
];

function MembresiaCell({ userId }: { userId: string }) {
  const { data } = useUserMemberships({ userId, limit: 1 });
  const active = data?.data.find((m) => m.status === 'ACTIVE');
  if (!active) return <span className="text-gray-300 text-xs">Sin membresía</span>;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
      {active.membershipPlan.name}
    </span>
  );
}

export default function SociosListTab() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 });
  const [membershipPlanId, setMembershipPlanId] = useState('');
  const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('socios-columns', columns);

  const { data: roles } = useRolesList();
  const clienteRole = roles?.find((r) => r.name === 'Cliente');

  const { data: activePlans = [] } = useQuery({
    queryKey: ['membership-plans', 'active'],
    queryFn: () => userMembershipsApi.getActivePlans(),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError } = useUsers({
    ...filters,
    roleId: clienteRole?.id,
    membershipPlanId: membershipPlanId || undefined,
  });

  const socios = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const handlePage = (page: number) => setFilters((f) => ({ ...f, page }));

  const exportData = useMemo(() => ({
    headers: columns.filter((c) => c.key !== 'actions' && c.key !== 'membresia' && visibleColumns.includes(c.key)).map((c) => c.label),
    rows: (s: UserWithRoles) =>
      columns
        .filter((c) => c.key !== 'actions' && c.key !== 'membresia' && visibleColumns.includes(c.key))
        .map((c) => {
          if (c.key === 'socio') return `${s.firstName} ${s.lastName} (${s.email})`;
          if (c.key === 'status') return s.status;
          if (c.key === 'handicap') return s.handicap != null ? String(s.handicap) : '';
          if (c.key === 'miembro_desde') return formatDateTime(s.createdAt);
          return '';
        }),
  }), [visibleColumns]);

  return (
    <div>
      <DataToolbar
        columns={columns}
        onSearchChange={useCallback(
          (search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })),
          []
        )}
        onSortChange={useCallback((sort: SortState | null) => {
          setFilters((f) => ({
            ...f,
            sortBy: sort ? SORT_FIELD_MAP[sort.field] || sort.field : undefined,
            sortDirection: sort?.direction,
            page: 1,
          }));
        }, [])}
        onFiltersChange={useCallback((rules: FilterRule[]) => {
          setFilters((f) => {
            const next: UserFilters = { search: f.search, page: 1, limit: f.limit, sortBy: f.sortBy, sortDirection: f.sortDirection };
            for (const rule of rules) {
              if (rule.field === 'socio') next.firstName = rule.value;
              else if (rule.field === 'status' && (rule.operator === 'eq' || rule.operator === 'neq')) {
                next.status = rule.value as UserStatus;
              }
            }
            return next;
          });
        }, [])}
        quickFilters={[
          {
            key: 'membresia',
            label: 'Membresía',
            value: membershipPlanId,
            onChange: (val) => { setMembershipPlanId(val); setFilters((f) => ({ ...f, page: 1 })); },
            options: activePlans.map((p) => ({ label: p.name, value: p.id })),
          },
        ]}
        visibleColumns={visibleColumns}
        onToggleColumn={toggleColumn}
        onResetColumns={resetColumns}
        onExport={() => exportToCsv('socios', exportData.headers, socios.map(exportData.rows))}
      />

      <div className="card overflow-hidden">
        {!clienteRole || isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-red-500">Error al cargar socios</div>
        ) : socios.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No se encontraron socios</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.includes('socio') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Socio</th>
                    )}
                    {visibleColumns.includes('status') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    )}
                    {visibleColumns.includes('handicap') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Handicap</th>
                    )}
                    {visibleColumns.includes('membresia') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Membresía</th>
                    )}
                    {visibleColumns.includes('miembro_desde') && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miembro desde</th>
                    )}
                    {visibleColumns.includes('actions') && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {socios.map((socio) => (
                    <tr
                      key={socio.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/socios/${socio.id}`)}
                    >
                      {visibleColumns.includes('socio') && (
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-primary-700">
                                {socio.firstName[0]}{socio.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{socio.firstName} {socio.lastName}</p>
                              <p className="text-sm text-gray-500">{socio.email}</p>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.includes('status') && (
                        <td className="px-6 py-4"><StatusBadge status={socio.status} /></td>
                      )}
                      {visibleColumns.includes('handicap') && (
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {socio.handicap != null ? socio.handicap : <span className="text-gray-300">—</span>}
                        </td>
                      )}
                      {visibleColumns.includes('membresia') && (
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <MembresiaCell userId={socio.id} />
                        </td>
                      )}
                      {visibleColumns.includes('miembro_desde') && (
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(socio.createdAt)}</td>
                      )}
                      {visibleColumns.includes('actions') && (
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/socios/${socio.id}`); }}
                            className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                            title="Ver ficha del socio"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Mostrando {(meta.page - 1) * meta.limit + 1} a {Math.min(meta.page * meta.limit, meta.total)} de {meta.total} socios
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => handlePage(meta.page - 1)} disabled={meta.page <= 1} className="p-1.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePage(p)}
                      className={`px-3 py-1 text-sm rounded ${p === meta.page ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-50'}`}
                    >
                      {p}
                    </button>
                  ))}
                  <button onClick={() => handlePage(meta.page + 1)} disabled={meta.page >= meta.totalPages} className="p-1.5 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
