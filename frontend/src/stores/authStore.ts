import { create } from 'zustand';
import { apiClient } from '@api/client';
import type { User } from '@/types/user.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  accessToken: null,
  permissions: [],
  isAuthenticated: false,
  isLoading: true,

  setAccessToken: (token: string) => set({ accessToken: token }),

  setUser: (user: User) => set({ user }),

  initialize: async () => {
    try {
      // Try to get current user (will use refresh token cookie)
      const response = await apiClient.get('/auth/me');
      const { user, permissions, accessToken } = response.data.data;

      set({
        user,
        permissions,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      set({
        user: null,
        accessToken: null,
        permissions: [],
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { user, permissions, accessToken } = response.data.data;

    set({
      user,
      permissions,
      accessToken,
      isAuthenticated: true,
    });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }

    set({
      user: null,
      accessToken: null,
      permissions: [],
      isAuthenticated: false,
    });
  },

  can: (permission: string) => {
    return get().permissions.includes(permission);
  },

  canAny: (permissions: string[]) => {
    const userPermissions = get().permissions;
    return permissions.some((p) => userPermissions.includes(p));
  },

  canAll: (permissions: string[]) => {
    const userPermissions = get().permissions;
    return permissions.every((p) => userPermissions.includes(p));
  },
}));
