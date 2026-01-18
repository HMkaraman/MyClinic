import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the actual API client, so we need to import before mocking fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

// Import after setting up fetch mock
const { api, authApi } = await import('./api');

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset access token
    api.setAccessToken(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setAccessToken', () => {
    it('should set the access token', () => {
      api.setAccessToken('test-token');
      expect(api.getAccessToken()).toBe('test-token');
    });

    it('should clear the access token when set to null', () => {
      api.setAccessToken('test-token');
      api.setAccessToken(null);
      expect(api.getAccessToken()).toBeNull();
    });
  });

  describe('get', () => {
    it('should make GET request with correct headers', async () => {
      const mockResponse = { id: 1, name: 'Test' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await api.get('/test');

      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should include Authorization header when token is set', async () => {
      api.setAccessToken('test-token');
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await api.get('/test');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('should throw error on non-ok response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found', statusCode: 404 }),
      });

      await expect(api.get('/not-found')).rejects.toEqual({
        message: 'Not found',
        statusCode: 404,
      });
    });

    it('should handle JSON parse errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(api.get('/error')).rejects.toEqual({
        message: 'An error occurred',
        statusCode: 500,
      });
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      const requestData = { email: 'test@example.com', password: 'password' };
      const responseData = { token: 'abc123' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(responseData),
      });

      const result = await api.post('/auth/login', requestData);

      expect(result).toEqual(responseData);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        }),
      );
    });

    it('should make POST request without body', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await api.post('/auth/logout');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        }),
      );
    });
  });

  describe('patch', () => {
    it('should make PATCH request with body', async () => {
      const requestData = { name: 'Updated Name' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 1, name: 'Updated Name' }),
      });

      await api.patch('/users/1', requestData);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestData),
        }),
      );
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await api.delete('/users/1');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/users/1'),
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });
});

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.setAccessToken(null);
  });

  describe('login', () => {
    it('should call login endpoint with credentials', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const response = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 900,
        user: { id: '1', email: 'test@example.com', name: 'Test', role: 'DOCTOR' },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(response),
      });

      const result = await authApi.login(credentials);

      expect(result).toEqual(response);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(credentials),
        }),
      );
    });
  });

  describe('verify2FA', () => {
    it('should call 2FA verify endpoint', async () => {
      const data = { tempToken: 'temp-token', code: '123456' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'token' }),
      });

      await authApi.verify2FA(data);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/2fa/verify-login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should call refresh endpoint', async () => {
      const data = { refreshToken: 'refresh-token' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ accessToken: 'new-token', refreshToken: 'new-refresh' }),
      });

      await authApi.refreshToken(data);

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        }),
      );
    });
  });

  describe('logout', () => {
    it('should call logout endpoint', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await authApi.logout();

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });
  });

  describe('getMe', () => {
    it('should call me endpoint', async () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test' };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(user),
      });

      const result = await authApi.getMe();

      expect(result).toEqual(user);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/auth/me'),
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });
  });
});
