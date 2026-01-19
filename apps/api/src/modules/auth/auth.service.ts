import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { toDataURL } from 'qrcode';

import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LoginDto, RefreshTokenDto, Verify2FADto } from './dto';
import { JwtPayload } from './decorators/current-user.decorator';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends TokenPair {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    branchIds: string[];
    twoFactorEnabled: boolean;
  };
}

// Roles that require 2FA to be enabled
const SENSITIVE_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];

@Injectable()
export class AuthService {
  private readonly accessTokenExpiry: number;
  private readonly refreshTokenExpiry: number;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.accessTokenExpiry = 60 * 15; // 15 minutes
    this.refreshTokenExpiry = 60 * 60 * 24 * 7; // 7 days
  }

  async login(dto: LoginDto): Promise<AuthResponse | { requires2FA: true }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Enforce 2FA for sensitive roles (ADMIN, MANAGER)
    if (SENSITIVE_ROLES.includes(user.role) && !user.twoFactorEnabled) {
      // Generate a limited-scope setup token valid for 10 minutes
      const setupToken = await this.jwtService.signAsync(
        { sub: user.id, tenantId: user.tenantId, purpose: '2fa-setup' },
        {
          secret: this.configService.get<string>(
            'JWT_SECRET',
            'myclinic-jwt-secret',
          ),
          expiresIn: '10m',
        },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          code: '2FA_SETUP_REQUIRED',
          message: 'Two-factor authentication must be enabled for your role.',
          setupToken,
        },
        HttpStatus.FORBIDDEN,
      );
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return { requires2FA: true };
      }

      const isValid = authenticator.verify({
        token: dto.twoFactorCode,
        secret: user.twoFactorSecret!,
      });

      if (!isValid) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      branchIds: user.branchIds,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        branchIds: user.branchIds,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  async logout(token: string): Promise<void> {
    // Decode token to get expiration
    const decoded = this.jwtService.decode(token) as { exp: number } | null;

    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.redisService.blacklistToken(token, ttl);
      }
    }
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<TokenPair> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'myclinic-jwt-refresh-secret',
        ),
      });

      // Check if refresh token is blacklisted
      const isBlacklisted = await this.redisService.isTokenBlacklisted(
        dto.refreshToken,
      );
      if (isBlacklisted) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      // Verify user still exists and is active
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }

      // Blacklist the old refresh token
      const decoded = this.jwtService.decode(dto.refreshToken) as {
        exp: number;
      } | null;
      if (decoded?.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisService.blacklistToken(dto.refreshToken, ttl);
        }
      }

      // Generate new tokens
      return this.generateTokens({
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        branchIds: user.branchIds,
        role: user.role,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        tenantId: true,
        branchIds: true,
        twoFactorEnabled: true,
        language: true,
        lastLoginAt: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async setup2FA(userId: string): Promise<{ qrCode: string; secret: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Store temporarily in Redis (5 minutes)
    await this.redisService.store2FASecret(userId, secret, 300);

    // Generate QR code
    const otpAuthUrl = authenticator.keyuri(user.email, 'MyClinic', secret);
    const qrCode = await toDataURL(otpAuthUrl);

    return { qrCode, secret };
  }

  async verify2FA(userId: string, dto: Verify2FADto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Get secret from Redis
    const secret = await this.redisService.get2FASecret(userId);

    if (!secret) {
      throw new BadRequestException(
        '2FA setup expired. Please start setup again.',
      );
    }

    // Verify the code
    const isValid = authenticator.verify({ token: dto.code, secret });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Enable 2FA and store secret
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret,
      },
    });

    // Clean up Redis
    await this.redisService.delete2FASecret(userId);
  }

  async disable2FA(userId: string, dto: Verify2FADto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid verification code');
    }

    // Disable 2FA
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });
  }

  async generateTokensForUser(userId: string): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      branchIds: user.branchIds,
      role: user.role,
    });

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        branchIds: user.branchIds,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    };
  }

  private async generateTokens(payload: JwtPayload): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_SECRET',
          'myclinic-jwt-secret',
        ),
        expiresIn: this.accessTokenExpiry,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>(
          'JWT_REFRESH_SECRET',
          'myclinic-jwt-refresh-secret',
        ),
        expiresIn: this.refreshTokenExpiry,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenExpiry,
    };
  }
}
