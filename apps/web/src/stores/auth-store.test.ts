import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useAuthStore, type User } from './auth-store';
import { api, authApi } from '@/lib/api';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    setAccessToken: vi.fn(),
  },
  authApi: {
    login: vi.fn(),
    verify2FA: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
  },
}));

describe('useAuthStore', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'DOCTOR',
    tenantId: 'tenant-1',
    branchIds: ['branch-1'],
    twoFactorEnabled: false,
  };

  const mockLoginResponse = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    expiresIn: 900,
    user: mockUser,
  };

  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.reset();
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.requires2FA).toBe(false);
      expect(result.current.tempToken).toBeNull();
    });
  });

  describe('login', () => {
    it('should login successfully and set user data', async () => {
      vi.mocked(authApi.login).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuthStore());

      let loginResult: boolean;
      await act(async () => {
        loginResult = await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(loginResult!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('mock-access-token');
      expect(result.current.refreshToken).toBe('mock-refresh-token');
      expect(api.setAccessToken).toHaveBeenCalledWith('mock-access-token');
    });

    it('should set isLoading during login', async () => {
      vi.mocked(authApi.login).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockLoginResponse), 100)),
      );

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.login({ email: 'test@example.com', password: 'password' });
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle 2FA requirement', async () => {
      const twoFAResponse = {
        requires2FA: true,
        tempToken: 'temp-token-123',
      };
      vi.mocked(authApi.login).mockResolvedValue(twoFAResponse as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(result.current.requires2FA).toBe(true);
      expect(result.current.tempToken).toBe('temp-token-123');
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should throw error on login failure', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.login({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        }),
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('verify2FA', () => {
    it('should verify 2FA successfully', async () => {
      vi.mocked(authApi.verify2FA).mockResolvedValue(mockLoginResponse);

      const { result } = renderHook(() => useAuthStore());

      // Set up 2FA state first
      act(() => {
        useAuthStore.setState({
          requires2FA: true,
          tempToken: 'temp-token-123',
        });
      });

      await act(async () => {
        await result.current.verify2FA('123456');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.requires2FA).toBe(false);
      expect(result.current.tempToken).toBeNull();
    });

    it('should throw error when no temp token', async () => {
      const { result } = renderHook(() => useAuthStore());

      await expect(
        act(async () => {
          await result.current.verify2FA('123456');
        }),
      ).rejects.toThrow('No temp token available');
    });

    it('should throw error on invalid 2FA code', async () => {
      vi.mocked(authApi.verify2FA).mockRejectedValue(new Error('Invalid code'));

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          requires2FA: true,
          tempToken: 'temp-token-123',
        });
      });

      await expect(
        act(async () => {
          await result.current.verify2FA('000000');
        }),
      ).rejects.toThrow('Invalid 2FA code');
    });
  });

  describe('logout', () => {
    it('should logout and reset state', async () => {
      vi.mocked(authApi.logout).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Set authenticated state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: 'token',
          refreshToken: 'refresh',
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(api.setAccessToken).toHaveBeenCalledWith(null);
    });

    it('should reset state even if logout API fails', async () => {
      vi.mocked(authApi.logout).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: 'token',
          isAuthenticated: true,
        });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('refreshAuth', () => {
    it('should refresh tokens successfully', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 900,
      };
      vi.mocked(authApi.refreshToken).mockResolvedValue(newTokens as any);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          refreshToken: 'old-refresh-token',
          isAuthenticated: true,
        });
      });

      let refreshResult: boolean;
      await act(async () => {
        refreshResult = await result.current.refreshAuth();
      });

      expect(refreshResult!).toBe(true);
      expect(result.current.accessToken).toBe('new-access-token');
      expect(result.current.refreshToken).toBe('new-refresh-token');
    });

    it('should return false when no refresh token', async () => {
      const { result } = renderHook(() => useAuthStore());

      let refreshResult: boolean;
      await act(async () => {
        refreshResult = await result.current.refreshAuth();
      });

      expect(refreshResult!).toBe(false);
    });

    it('should reset state on refresh failure', async () => {
      vi.mocked(authApi.refreshToken).mockRejectedValue(new Error('Token expired'));

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: 'token',
          refreshToken: 'refresh',
          isAuthenticated: true,
        });
      });

      let refreshResult: boolean;
      await act(async () => {
        refreshResult = await result.current.refreshAuth();
      });

      expect(refreshResult!).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update user', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
    });

    it('should clear user when set to null', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser(mockUser);
      });
      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      const { result } = renderHook(() => useAuthStore());

      // Set various state
      act(() => {
        useAuthStore.setState({
          user: mockUser,
          accessToken: 'token',
          refreshToken: 'refresh',
          isAuthenticated: true,
          requires2FA: true,
          tempToken: 'temp',
        });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(result.current.refreshToken).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.requires2FA).toBe(false);
      expect(result.current.tempToken).toBeNull();
      expect(api.setAccessToken).toHaveBeenCalledWith(null);
    });
  });
});
