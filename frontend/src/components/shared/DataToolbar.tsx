import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Columns3,
  SlidersHorizontal,
  Download,
  X,
  Plus,
  RotateCcw,
} from 'lucide-react';
import type { ColumnDef } from '@/hooks/useColumnVisibility';

export interface FilterRule {
  field: string;
  operator: string;
  value: string;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

interface DataToolbarProps {
  columns: ColumnDef[];
  onSearchChange: (search: string) => void;
  onSortChange: (sort: SortState | null) => void;
  onFiltersChange: (filters: FilterRule[]) => void;
  visibleColumns: string[];
  onToggleColumn: (key: string) => void;
  onResetColumns: () => void;
  onExport?: () => void;
}

const OPERATORS: Record<string, { label: string; value: string }[]> = {
  text: [
    { label: 'equals', value: 'eq' },
    { label: 'not equals', value: 'neq' },
    { label: 'contains', value: 'contains' },
  ],
  number: [
    { label: '=', value: 'eq' },
    { label: '!=', value: 'neq' },
    { label: '>', value: 'gt' },
    { label: '<', value: 'lt' },
    { label: '>=', value: 'gte' },
    { label: '<=', value: 'lte' },
  ],
  date: [
    { label: 'equals', value: 'eq' },
    { label: 'after', value: 'gt' },
    { label: 'before', value: 'lt' },
  ],
  select: [
    { label: 'is', value: 'eq' },
    { label: 'is not', value: 'neq' },
  ],
};

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (!ref.current || ref.current.contains(e.target as Node)) return;
      handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

function getOperatorLabel(type: string, operator: string): string {
  const ops = OPERATORS[type] || OPERATORS.text;
  return ops.find((o) => o.value === operator)?.label || operator;
}

export default function DataToolbar({
  columns,
  onSearchChange,
  onSortChange,
  onFiltersChange,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
  onExport,
}: DataToolbarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState<FilterRule[]>([]);

  // Dropdown open state
  const [openDropdown, setOpenDropdown] = useState<'sort' | 'columns' | 'filters' | null>(null);

  // New filter being built
  const [newFilter, setNewFilter] = useState<Partial<FilterRule>>({});

  const sortRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);

  const closeDropdown = useCallback(() => setOpenDropdown(null), []);
  useClickOutside(sortRef, () => openDropdown === 'sort' && closeDropdown());
  useClickOutside(columnsRef, () => openDropdown === 'columns' && closeDropdown());
  useClickOutside(filtersRef, () => openDropdown === 'filters' && closeDropdown());

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(searchValue), 300);
    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  const sortableColumns = columns.filter((c) => c.sortable);
  const filterableColumns = columns.filter((c) => c.filterable);

  const handleSort = (field: string) => {
    let next: SortState | null;
    if (sort?.field === field) {
      if (sort.direction === 'asc') {
        next = { field, direction: 'desc' };
      } else {
        next = null; // remove sort
      }
    } else {
      next = { field, direction: 'asc' };
    }
    setSort(next);
    onSortChange(next);
    setOpenDropdown(null);
  };

  const addFilter = () => {
    if (!newFilter.field || !newFilter.operator || !newFilter.value) return;
    const updated = [...filters, newFilter as FilterRule];
    setFilters(updated);
    onFiltersChange(updated);
    setNewFilter({});
  };

  const removeFilter = (index: number) => {
    const updated = filters.filter((_, i) => i !== index);
    setFilters(updated);
    onFiltersChange(updated);
  };

  const clearAllFilters = () => {
    setFilters([]);
    onFiltersChange([]);
  };

  const selectedFilterCol = filterableColumns.find((c) => c.key === newFilter.field);
  const filterType = selectedFilterCol?.type || 'text';
  const operatorOptions = OPERATORS[filterType] || OPERATORS.text;

  return (
    <div className="card p-4 mb-6 space-y-3">
      {/* Toolbar row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            className="input pl-10"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>

        {/* Sort */}
        {sortableColumns.length > 0 && (
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'sort' ? null : 'sort')}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                sort
                  ? 'border-primary-300 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              {sort ? (
                <>
                  {columns.find((c) => c.key === sort.field)?.label}
                  {sort.direction === 'asc' ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                </>
              ) : (
                'Sort'
              )}
            </button>

            {openDropdown === 'sort' && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-40">
                {sortableColumns.map((col) => (
                  <button
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-50 ${
                      sort?.field === col.key ? 'text-primary-600 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {col.label}
                    {sort?.field === col.key &&
                      (sort.direction === 'asc' ? (
                        <ArrowUp className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5" />
                      ))}
                  </button>
                ))}
                {sort && (
                  <>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={() => {
                        setSort(null);
                        onSortChange(null);
                        setOpenDropdown(null);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      Clear sort
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Columns */}
        <div ref={columnsRef} className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'columns' ? null : 'columns')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Columns3 className="w-4 h-4" />
            Columns
          </button>

          {openDropdown === 'columns' && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40">
              <div className="px-4 pb-2 flex items-center justify-between border-b border-gray-100 mb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase">Toggle columns</span>
                <button
                  onClick={onResetColumns}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </div>
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-3 px-4 py-1.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(col.key)}
                    onChange={() => onToggleColumn(col.key)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{col.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Export */}
        {onExport && (
          <button
            onClick={onExport}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}

        {/* Filters */}
        {filterableColumns.length > 0 && (
          <div ref={filtersRef} className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'filters' ? null : 'filters')}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                filters.length > 0
                  ? 'border-primary-300 bg-primary-50 text-primary-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {filters.length > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary-600 text-white rounded-full">
                  {filters.length}
                </span>
              )}
            </button>

            {openDropdown === 'filters' && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">Add Filter</span>
                  {filters.length > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* New filter builder */}
                <div className="flex items-end gap-2 mb-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Field</label>
                    <select
                      className="input text-sm"
                      value={newFilter.field || ''}
                      onChange={(e) =>
                        setNewFilter({ field: e.target.value, operator: '', value: '' })
                      }
                    >
                      <option value="">Select...</option>
                      {filterableColumns.map((col) => (
                        <option key={col.key} value={col.key}>
                          {col.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="text-xs text-gray-500 mb-1 block">Operator</label>
                    <select
                      className="input text-sm"
                      value={newFilter.operator || ''}
                      onChange={(e) =>
                        setNewFilter((f) => ({ ...f, operator: e.target.value }))
                      }
                      disabled={!newFilter.field}
                    >
                      <option value="">Select...</option>
                      {operatorOptions.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">Value</label>
                    {selectedFilterCol?.type === 'select' ? (
                      <select
                        className="input text-sm"
                        value={newFilter.value || ''}
                        onChange={(e) =>
                          setNewFilter((f) => ({ ...f, value: e.target.value }))
                        }
                        disabled={!newFilter.operator}
                      >
                        <option value="">Select...</option>
                        {selectedFilterCol.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={filterType === 'date' ? 'date' : filterType === 'number' ? 'number' : 'text'}
                        className="input text-sm"
                        placeholder="Value..."
                        value={newFilter.value || ''}
                        onChange={(e) =>
                          setNewFilter((f) => ({ ...f, value: e.target.value }))
                        }
                        disabled={!newFilter.operator}
                      />
                    )}
                  </div>
                  <button
                    onClick={addFilter}
                    disabled={!newFilter.field || !newFilter.operator || !newFilter.value}
                    className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Active filters inside dropdown */}
                {filters.length > 0 && (
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Active filters</span>
                    {filters.map((f, i) => {
                      const col = columns.find((c) => c.key === f.field);
                      const displayValue =
                        col?.type === 'select'
                          ? col.options?.find((o) => o.value === f.value)?.label || f.value
                          : f.value;
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-1.5 text-sm"
                        >
                          <span className="text-gray-700">
                            <span className="font-medium">{col?.label || f.field}</span>{' '}
                            <span className="text-gray-400">
                              {getOperatorLabel(col?.type || 'text', f.operator)}
                            </span>{' '}
                            <span className="font-medium text-primary-600">{displayValue}</span>
                          </span>
                          <button
                            onClick={() => removeFilter(i)}
                            className="text-gray-400 hover:text-red-500 ml-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active filter chips row */}
      {filters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((f, i) => {
            const col = columns.find((c) => c.key === f.field);
            const displayValue =
              col?.type === 'select'
                ? col.options?.find((o) => o.value === f.value)?.label || f.value
                : f.value;
            return (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full border border-primary-200"
              >
                <span className="font-medium">{col?.label || f.field}</span>
                <span className="text-primary-400">{getOperatorLabel(col?.type || 'text', f.operator)}</span>
                <span className="font-semibold">{displayValue}</span>
                <button
                  onClick={() => removeFilter(i)}
                  className="ml-0.5 text-primary-400 hover:text-primary-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}
          <button
            onClick={clearAllFilters}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
