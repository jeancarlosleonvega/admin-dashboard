import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePageHeaderStore } from '@stores/pageHeaderStore';

interface PageHeaderOptions {
  title?: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function usePageHeader({ title, subtitle, actions }: PageHeaderOptions) {
  const { setPageHeader, clearPageHeader } = usePageHeaderStore();

  useEffect(() => {
    setPageHeader({ title, subtitle, actions });
    return () => clearPageHeader();
  }, [title, subtitle, actions, setPageHeader, clearPageHeader]);
}
