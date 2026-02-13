import type { ReactNode } from 'react';
import { create } from 'zustand';

interface PageHeaderState {
  title: string | null;
  subtitle: ReactNode | null;
  actions: ReactNode | null;
  setPageHeader: (header: { title?: string | null; subtitle?: ReactNode | null; actions?: ReactNode | null }) => void;
  clearPageHeader: () => void;
}

export const usePageHeaderStore = create<PageHeaderState>((set) => ({
  title: null,
  subtitle: null,
  actions: null,
  setPageHeader: (header) =>
    set({
      title: header.title ?? null,
      subtitle: header.subtitle ?? null,
      actions: header.actions ?? null,
    }),
  clearPageHeader: () => set({ title: null, subtitle: null, actions: null }),
}));
