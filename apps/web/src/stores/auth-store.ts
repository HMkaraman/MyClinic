import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, authApi } from '@/lib/api';
import type { LoginRequest } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  branchIds: string[];
  twoFactorEnabled: boolean;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requires2FA: boolean;
  tempToken: string | null;
  pendingCredentials: { email: string; password: string } | null;

  // 2FA Setup state
  requires2FASetup: boolean;
  setupToken: string | null;
  qrCode: string | null;
  secret: string | null;

  // Actions
  login: (data: LoginRequest) => Promise<boolean>;
  verify2FA: (code: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  reset: () => void;

  // 2FA Setup actions
  initiate2FASetup: () => Promise<void>;
  complete2FASetup: (code: string) => Promise<void>;
  cancelSetup: () => void;
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  requires2FA: false,
  tempToken: null,
  pendingCredentials: null,

  // 2FA Setup state
  requires2FASetup: false,
  setupToken: null,
  qrCode: null,
  secret: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (data: LoginRequest) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(data);

          if (response.requires2FA) {
            set({
              isLoading: false,
              requires2FA: true,
              pendingCredentials: { email: data.email, password: data.password },
            });
            return true;
          }

          // Validate response has all required fields before setting authenticated
          if (!response.accessToken || !response.refreshToken || !response.user) {
            set({ isLoading: false });
            throw new Error('Invalid login response: missing required fields');
          }

          api.setAccessToken(response.accessToken);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            requires2FA: false,
            tempToken: null,
            pendingCredentials: null,
          });
          return true;
        } catch (error: unknown) {
          set({ isLoading: false });

          // Check if this is a 2FA_SETUP_REQUIRED error
          const err = error as { code?: string; setupToken?: string; message?: string };
          if (err.code === '2FA_SETUP_REQUIRED' && err.setupToken) {
            set({
              requires2FASetup: true,
              setupToken: err.setupToken,
            });
            return true;
          }

          throw new Error(err.message || 'Invalid credentials');
        }
      },

      verify2FA: async (code: string) => {
        const { pendingCredentials } = get();
        if (!pendingCredentials) {
          throw new Error('No pending login');
        }

        set({ isLoading: true });
        try {
          const response = await authApi.login({
            email: pendingCredentials.email,
            password: pendingCredentials.password,
            twoFactorCode: code,
          });

          // Validate response has all required fields before setting authenticated
          if (!response.accessToken || !response.refreshToken || !response.user) {
            set({ isLoading: false });
            throw new Error('Invalid 2FA response: missing required fields');
          }

          api.setAccessToken(response.accessToken);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            requires2FA: false,
            pendingCredentials: null,
          });
          return true;
        } catch {
          set({ isLoading: false });
          throw new Error('Invalid 2FA code');
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        } finally {
          api.setAccessToken(null);
          set(initialState);
        }
      },

      refreshAuth: async () => {
        const { refreshToken } = get();
        if (!refreshToken) return false;

        try {
          const response = await authApi.refreshToken({ refreshToken });
          api.setAccessToken(response.accessToken);
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          });
          return true;
        } catch {
          set(initialState);
          return false;
        }
      },

      setUser: (user: User | null) => set({ user }),

      reset: () => {
        api.setAccessToken(null);
        set(initialState);
      },

      // 2FA Setup actions
      initiate2FASetup: async () => {
        const { setupToken } = get();
        if (!setupToken) {
          throw new Error('No setup token available');
        }

        set({ isLoading: true });
        try {
          const { qrCode, secret } = await authApi.setup2FA(setupToken);
          set({ isLoading: false, qrCode, secret });
        } catch (error: unknown) {
          set({ isLoading: false });
          const err = error as { message?: string };
          throw new Error(err.message || 'Failed to setup 2FA');
        }
      },

      complete2FASetup: async (code: string) => {
        const { setupToken } = get();
        if (!setupToken) {
          throw new Error('No setup token available');
        }

        set({ isLoading: true });
        try {
          const response = await authApi.verify2FASetup(setupToken, code);

          // Validate response has all required fields before setting authenticated
          if (!response.accessToken || !response.refreshToken || !response.user) {
            set({ isLoading: false });
            throw new Error('Invalid 2FA setup response: missing required fields');
          }

          // Complete login with returned tokens
          api.setAccessToken(response.accessToken);

          set({
            isLoading: false,
            isAuthenticated: true,
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            requires2FASetup: false,
            setupToken: null,
            qrCode: null,
            secret: null,
          });
        } catch (error: unknown) {
          set({ isLoading: false });
          const err = error as { message?: string };
          throw new Error(err.message || 'Invalid verification code');
        }
      },

      cancelSetup: () => {
        set({
          requires2FASetup: false,
          setupToken: null,
          qrCode: null,
          secret: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Validate state consistency
          const hasValidAuth = state.isAuthenticated && state.accessToken && state.user;

          if (state.isAuthenticated && !hasValidAuth) {
            // Inconsistent state - clear localStorage and reset
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth-storage');
            }
            // Reset state via the store
            useAuthStore.setState(initialState);
            return;
          }

          // Sync token to API client
          if (state.accessToken) {
            api.setAccessToken(state.accessToken);
          }
        }
      },
    }
  )
);
