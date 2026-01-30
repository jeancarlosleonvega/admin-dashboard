import { useState, useCallback } from 'react';

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'select';
  options?: { label: string; value: string }[];
  defaultVisible?: boolean;
}

function getDefaults(columns: ColumnDef[]): string[] {
  return columns.filter((c) => c.defaultVisible !== false).map((c) => c.key);
}

function load(storageKey: string, columns: ColumnDef[]): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return getDefaults(columns);
}

export function useColumnVisibility(storageKey: string, columns: ColumnDef[]) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    load(storageKey, columns)
  );

  const toggleColumn = useCallback(
    (key: string) => {
      setVisibleColumns((prev) => {
        const next = prev.includes(key)
          ? prev.filter((k) => k !== key)
          : [...prev, key];
        localStorage.setItem(storageKey, JSON.stringify(next));
        return next;
      });
    },
    [storageKey]
  );

  const resetColumns = useCallback(() => {
    const defaults = getDefaults(columns);
    setVisibleColumns(defaults);
    localStorage.setItem(storageKey, JSON.stringify(defaults));
  }, [storageKey, columns]);

  return { visibleColumns, toggleColumn, resetColumns };
}
