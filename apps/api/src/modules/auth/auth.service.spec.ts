import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { MockPrismaService, MockRedisService } from '../../../test/mocks';
import { createUser, createUserWith2FA } from '../../../test/factories';

jest.mock('bcryptjs');
jest.mock('otplib', () => ({
  authenticator: {
    verify: jest.fn(),
    generateSecret: jest.fn().mockReturnValue('JBSWY3DPEHPK3PXP'),
    keyuri: jest.fn().mockReturnValue('otpauth://totp/MyClinic:test@example.com?secret=JBSWY3DPEHPK3PXP'),
  },
}));
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockqrcode'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: MockPrismaService;
  let redis: MockRedisService;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    prisma = new MockPrismaService();
    redis = new MockRedisService();

    const mockJwtService = {
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verify: jest.fn(),
      decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          JWT_SECRET: 'test-jwt-secret',
          JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
        };
        return config[key] ?? defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: redis },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = createUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { tenant: { select: { id: true, name: true } } },
      });
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nonexistent@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const mockUser = createUser();
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const mockUser = createUser({ status: 'INACTIVE' as any });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return requires2FA when 2FA is enabled without code', async () => {
      const mockUser = createUserWith2FA();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ requires2FA: true });
    });

    it('should throw UnauthorizedException for invalid 2FA code', async () => {
      const mockUser = createUserWith2FA();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const { authenticator } = require('otplib');
      authenticator.verify.mockReturnValue(false);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'password123',
          twoFactorCode: '123456',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should successfully login with valid 2FA code', async () => {
      const mockUser = createUserWith2FA();
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const { authenticator } = require('otplib');
      authenticator.verify.mockReturnValue(true);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
        twoFactorCode: '123456',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });
  });

  describe('logout', () => {
    it('should blacklist the token on logout', async () => {
      const token = 'valid-jwt-token';
      jwtService.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      await service.logout(token);

      const isBlacklisted = await redis.isTokenBlacklisted(token);
      expect(isBlacklisted).toBe(true);
    });

    it('should not blacklist token if already expired', async () => {
      const token = 'expired-jwt-token';
      jwtService.decode.mockReturnValue({
        exp: Math.floor(Date.now() / 1000) - 100, // Expired
      });

      await service.logout(token);

      const isBlacklisted = await redis.isTokenBlacklisted(token);
      expect(isBlacklisted).toBe(false);
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens with valid refresh token', async () => {
      const mockUser = createUser();
      jwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        tenantId: mockUser.tenantId,
        branchIds: mockUser.branchIds,
        role: mockUser.role,
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.refreshTokens({
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
    });

    it('should throw UnauthorizedException for blacklisted refresh token', async () => {
      const refreshToken = 'blacklisted-refresh-token';
      await redis.blacklistToken(refreshToken, 3600);

      jwtService.verify.mockReturnValue({
        sub: 'test-user-id',
        email: 'test@example.com',
        tenantId: 'test-tenant-id',
        branchIds: ['test-branch-id'],
        role: 'DOCTOR',
      });

      await expect(
        service.refreshTokens({ refreshToken }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const mockUser = createUser({ status: 'INACTIVE' as any });
      jwtService.verify.mockReturnValue({
        sub: mockUser.id,
        email: mockUser.email,
        tenantId: mockUser.tenantId,
        branchIds: mockUser.branchIds,
        role: mockUser.role,
      });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.refreshTokens({ refreshToken: 'valid-refresh-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getMe', () => {
    it('should return current user data', async () => {
      const mockUser = createUser();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getMe(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('non-existent-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('setup2FA', () => {
    it('should generate QR code and secret for 2FA setup', async () => {
      const mockUser = createUser({ twoFactorEnabled: false });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.setup2FA(mockUser.id);

      // Verify the result structure
      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('secret');
    });

    it('should throw BadRequestException if 2FA already enabled', async () => {
      const mockUser = createUserWith2FA();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.setup2FA(mockUser.id)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verify2FA', () => {
    it('should enable 2FA with valid verification code', async () => {
      const mockUser = createUser({ twoFactorEnabled: false });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, twoFactorEnabled: true });

      // Store secret in Redis
      await redis.store2FASecret(mockUser.id, 'JBSWY3DPEHPK3PXP', 300);

      const { authenticator } = require('otplib');
      authenticator.verify.mockReturnValue(true);

      await expect(
        service.verify2FA(mockUser.id, { code: '123456' }),
      ).resolves.not.toThrow();

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          twoFactorEnabled: true,
          twoFactorSecret: 'JBSWY3DPEHPK3PXP',
        },
      });
    });

    it('should throw BadRequestException for expired setup', async () => {
      const mockUser = createUser({ twoFactorEnabled: false });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      // No secret in Redis (expired)

      await expect(
        service.verify2FA(mockUser.id, { code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('disable2FA', () => {
    it('should disable 2FA with valid verification code', async () => {
      const mockUser = createUserWith2FA();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });

      const { authenticator } = require('otplib');
      authenticator.verify.mockReturnValue(true);

      await expect(
        service.disable2FA(mockUser.id, { code: '123456' }),
      ).resolves.not.toThrow();

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });
    });

    it('should throw BadRequestException if 2FA not enabled', async () => {
      const mockUser = createUser({ twoFactorEnabled: false });
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.disable2FA(mockUser.id, { code: '123456' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
