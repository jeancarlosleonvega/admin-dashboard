import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const getInitialSidebarState = (): boolean => {
  try {
    const stored = localStorage.getItem('sidebar-open');
    if (stored !== null) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return true;
};

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: getInitialSidebarState(),
  mobileSidebarOpen: false,

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarOpen;
      localStorage.setItem('sidebar-open', JSON.stringify(next));
      return { sidebarOpen: next };
    }),

  openMobileSidebar: () => set({ mobileSidebarOpen: true }),

  closeMobileSidebar: () => set({ mobileSidebarOpen: false }),
}));
