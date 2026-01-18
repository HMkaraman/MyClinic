import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../src/prisma/prisma.service';
import { RedisService } from '../../src/redis/redis.service';
import { MockPrismaService } from '../mocks/prisma.mock';
import { MockRedisService } from '../mocks/redis.mock';

export interface TestModuleOptions {
  providers?: any[];
  imports?: any[];
  overrides?: Array<{
    provide: any;
    useValue?: any;
    useClass?: any;
    useFactory?: () => any;
  }>;
}

export class TestModuleHelper {
  private mockPrisma: MockPrismaService;
  private mockRedis: MockRedisService;
  private mockJwtService: Partial<JwtService>;
  private mockConfigService: Partial<ConfigService>;

  constructor() {
    this.mockPrisma = new MockPrismaService();
    this.mockRedis = new MockRedisService();
    this.mockJwtService = this.createMockJwtService();
    this.mockConfigService = this.createMockConfigService();
  }

  get prisma(): MockPrismaService {
    return this.mockPrisma;
  }

  get redis(): MockRedisService {
    return this.mockRedis;
  }

  get jwt(): Partial<JwtService> {
    return this.mockJwtService;
  }

  get config(): Partial<ConfigService> {
    return this.mockConfigService;
  }

  private createMockJwtService(): Partial<JwtService> {
    return {
      sign: jest.fn().mockReturnValue('mock-token'),
      signAsync: jest.fn().mockResolvedValue('mock-token'),
      verify: jest.fn().mockReturnValue({ sub: 'test-user-id' }),
      verifyAsync: jest.fn().mockResolvedValue({ sub: 'test-user-id' }),
      decode: jest.fn().mockReturnValue({
        sub: 'test-user-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    };
  }

  private createMockConfigService(): Partial<ConfigService> {
    const config: Record<string, string> = {
      JWT_SECRET: 'test-jwt-secret',
      JWT_REFRESH_SECRET: 'test-jwt-refresh-secret',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/myclinic_test',
      REDIS_URL: 'redis://localhost:6379',
      NODE_ENV: 'test',
    };

    return {
      get: jest.fn((key: string, defaultValue?: string) => config[key] ?? defaultValue),
      getOrThrow: jest.fn((key: string) => {
        if (config[key] === undefined) {
          throw new Error(`Configuration key ${key} is not defined`);
        }
        return config[key];
      }),
    };
  }

  async createTestingModule(options: TestModuleOptions = {}): Promise<TestingModule> {
    const { providers = [], imports = [], overrides = [] } = options;

    let moduleBuilder: TestingModuleBuilder = Test.createTestingModule({
      imports,
      providers: [
        ...providers,
        {
          provide: PrismaService,
          useValue: this.mockPrisma,
        },
        {
          provide: RedisService,
          useValue: this.mockRedis,
        },
        {
          provide: JwtService,
          useValue: this.mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: this.mockConfigService,
        },
      ],
    });

    // Apply additional overrides
    for (const override of overrides) {
      if (override.useValue !== undefined) {
        moduleBuilder = moduleBuilder.overrideProvider(override.provide).useValue(override.useValue);
      } else if (override.useClass !== undefined) {
        moduleBuilder = moduleBuilder.overrideProvider(override.provide).useClass(override.useClass);
      } else if (override.useFactory !== undefined) {
        moduleBuilder = moduleBuilder.overrideProvider(override.provide).useFactory({ factory: override.useFactory });
      }
    }

    return moduleBuilder.compile();
  }

  reset(): void {
    this.mockPrisma.resetAllMocks();
    this.mockRedis.clear();
    this.mockJwtService = this.createMockJwtService();
    this.mockConfigService = this.createMockConfigService();
  }
}

export function createTestModuleHelper(): TestModuleHelper {
  return new TestModuleHelper();
}
