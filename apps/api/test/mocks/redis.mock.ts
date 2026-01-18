export class MockRedisService {
  private store = new Map<string, { value: string; expiry?: number }>();

  async blacklistToken(token: string, expiresInSeconds: number): Promise<void> {
    this.store.set(`blacklist:${token}`, {
      value: '1',
      expiry: Date.now() + expiresInSeconds * 1000,
    });
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const entry = this.store.get(`blacklist:${token}`);
    if (!entry) return false;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(`blacklist:${token}`);
      return false;
    }
    return entry.value === '1';
  }

  async store2FASecret(
    userId: string,
    secret: string,
    expiresInSeconds: number = 300,
  ): Promise<void> {
    this.store.set(`2fa:setup:${userId}`, {
      value: secret,
      expiry: Date.now() + expiresInSeconds * 1000,
    });
  }

  async get2FASecret(userId: string): Promise<string | null> {
    const entry = this.store.get(`2fa:setup:${userId}`);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(`2fa:setup:${userId}`);
      return null;
    }
    return entry.value;
  }

  async delete2FASecret(userId: string): Promise<void> {
    this.store.delete(`2fa:setup:${userId}`);
  }

  async setSession(
    sessionId: string,
    data: Record<string, unknown>,
    expiresInSeconds: number,
  ): Promise<void> {
    this.store.set(`session:${sessionId}`, {
      value: JSON.stringify(data),
      expiry: Date.now() + expiresInSeconds * 1000,
    });
  }

  async getSession(sessionId: string): Promise<Record<string, unknown> | null> {
    const entry = this.store.get(`session:${sessionId}`);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(`session:${sessionId}`);
      return null;
    }
    return JSON.parse(entry.value);
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.store.delete(`session:${sessionId}`);
  }

  async set(key: string, value: string, expiresInSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiry: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined,
    });
  }

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiry && entry.expiry < Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  getClient() {
    return {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      on: jest.fn(),
      quit: jest.fn(),
    };
  }

  clear(): void {
    this.store.clear();
  }
}

export function createMockRedisService(): MockRedisService {
  return new MockRedisService();
}
