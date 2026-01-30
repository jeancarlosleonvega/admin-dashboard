When creating or modifying a CRUD list page, integrate the `DataToolbar` component following this pattern. This covers: search input (debounced), dynamic sort dropdown, column visibility toggle (persistent in localStorage), and a query builder filter dropdown with dynamic fields.

## 1. Imports

```typescript
import { useState, useCallback } from 'react';
import DataToolbar from '@components/shared/DataToolbar';
import type { FilterRule, SortState } from '@components/shared/DataToolbar';
import { useColumnVisibility } from '@/hooks/useColumnVisibility';
import type { ColumnDef } from '@/hooks/useColumnVisibility';
```

## 2. Define SORT_FIELD_MAP and columns outside the component

The `SORT_FIELD_MAP` maps frontend column keys to backend database field names for sorting.

```typescript
// Map frontend column keys to backend sortable field names
const SORT_FIELD_MAP: Record<string, string> = {
  columnKey: 'databaseFieldName',
  // e.g.: user: 'firstName', status: 'status', created: 'createdAt'
};

const columns: ColumnDef[] = [
  { key: 'fieldName', label: 'Display Label', sortable: true, filterable: true, type: 'text' },
  { key: 'status', label: 'Status', sortable: true, filterable: true, type: 'select', options: [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
  ]},
  { key: 'created', label: 'Created At', sortable: true, filterable: true, type: 'date' },
  { key: 'actions', label: 'Actions', sortable: false, filterable: false },
];
```

Column types: `text`, `number`, `date`, `select` (requires `options` array).
- `sortable: true` — appears in the Sort dropdown
- `filterable: true` — appears in the Filters query builder
- `type` determines the filter operators offered (text: eq/neq/contains, number/date: eq/gt/lt/gte/lte, select: is/is not)

## 3. Inside the component

```typescript
const { visibleColumns, toggleColumn, resetColumns } = useColumnVisibility('<entity>-columns', columns);
```

## 4. Add DataToolbar with full backend integration

```tsx
<DataToolbar
  columns={columns}
  onSearchChange={useCallback((search: string) => setFilters((f) => ({ ...f, search: search || undefined, page: 1 })), [])}
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
      const next: EntityFilters = { search: f.search, page: 1, limit: f.limit, sortBy: f.sortBy, sortDirection: f.sortDirection };
      for (const rule of rules) {
        // Map each filter rule field to the corresponding backend query param
        if (rule.field === 'columnKey') {
          next.backendParam = rule.value;
        }
      }
      return next;
    });
  }, [])}
  visibleColumns={visibleColumns}
  onToggleColumn={toggleColumn}
  onResetColumns={resetColumns}
/>
```

## 5. Wrap table columns with visibility checks

Both `<th>` and `<td>` must be wrapped:

```tsx
{visibleColumns.includes('fieldName') && (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
    Field Name
  </th>
)}

{visibleColumns.includes('fieldName') && (
  <td className="px-6 py-4 text-sm text-gray-500">
    {item.fieldName}
  </td>
)}
```

## 6. Backend integration (required for sort and filters to work)

For each entity module, add `sortBy`, `sortDirection`, and field-specific filter params:

### Schema (backend/src/modules/<entity>/<entity>.schema.ts)

Add to the filters schema:

```typescript
export const entityFiltersSchema = z.object({
  search: z.string().optional(),
  // Field-specific filters (used by query builder)
  fieldName: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  // Sort params
  sortBy: z.enum(['fieldName', 'status', 'createdAt']).optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  // Pagination
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
```

### Types (backend/src/modules/<entity>/<entity>.types.ts)

Add the same fields to the filters interface:

```typescript
export interface EntityFilters {
  search?: string;
  fieldName?: string;
  status?: string;
  sortBy?: 'fieldName' | 'status' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}
```

### Repository (backend/src/modules/<entity>/<entity>.repository.ts)

Add dynamic `orderBy` and field-specific `where` conditions:

```typescript
async findAll(filters: EntityFilters, page: number, limit: number) {
  const where: any = {};

  // Global search (broad, OR across multiple fields)
  if (filters.search) {
    where.OR = [
      { fieldName: { contains: filters.search, mode: 'insensitive' } },
      // ...other searchable fields
    ];
  }

  // Field-specific filters (AND conditions, used by query builder)
  if (filters.fieldName) {
    where.fieldName = { contains: filters.fieldName, mode: 'insensitive' };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  // Dynamic sort (falls back to default if no sort specified)
  const orderBy: any = filters.sortBy
    ? { [filters.sortBy]: filters.sortDirection || 'asc' }
    : { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.entity.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy }),
    prisma.entity.count({ where }),
  ]);

  return { items, total };
}
```

### Frontend API client (frontend/src/api/<entity>.api.ts)

Add the new params to the URLSearchParams builder:

```typescript
if (filters?.fieldName) params.append('fieldName', filters.fieldName);
if (filters?.sortBy) params.append('sortBy', filters.sortBy);
if (filters?.sortDirection) params.append('sortDirection', filters.sortDirection);
```

### Frontend types (frontend/src/types/<entity>.types.ts)

Add to the filters interface:

```typescript
export interface EntityFilters {
  search?: string;
  fieldName?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

## Reference implementations

- `frontend/src/features/users/pages/UsersListPage.tsx`
- `frontend/src/features/roles/pages/RolesListPage.tsx`
- `frontend/src/features/permissions/pages/PermissionsListPage.tsx`
