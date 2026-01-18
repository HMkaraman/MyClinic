import { Role, UserStatus } from '@prisma/client';

export interface UserFactoryOptions {
  id?: string;
  email?: string;
  name?: string;
  passwordHash?: string;
  phone?: string;
  role?: Role;
  tenantId?: string;
  branchIds?: string[];
  status?: UserStatus;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  language?: string;
  lastLoginAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export function createUser(options: UserFactoryOptions = {}) {
  const now = new Date();
  return {
    id: options.id ?? 'test-user-id',
    email: options.email ?? 'test@example.com',
    name: options.name ?? 'Test User',
    passwordHash: options.passwordHash ?? '$2a$10$abcdefghijklmnopqrstuvwxyz123456', // bcrypt hash
    phone: options.phone ?? '+1234567890',
    role: options.role ?? Role.DOCTOR,
    tenantId: options.tenantId ?? 'test-tenant-id',
    branchIds: options.branchIds ?? ['test-branch-id'],
    status: options.status ?? UserStatus.ACTIVE,
    twoFactorEnabled: options.twoFactorEnabled ?? false,
    twoFactorSecret: options.twoFactorSecret ?? null,
    language: options.language ?? 'en',
    lastLoginAt: options.lastLoginAt ?? null,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    tenant: {
      id: options.tenantId ?? 'test-tenant-id',
      name: 'Test Clinic',
    },
  };
}

export function createActiveUser(options: UserFactoryOptions = {}) {
  return createUser({ ...options, status: UserStatus.ACTIVE });
}

export function createInactiveUser(options: UserFactoryOptions = {}) {
  return createUser({ ...options, status: UserStatus.INACTIVE });
}

export function createUserWith2FA(options: UserFactoryOptions = {}) {
  return createUser({
    ...options,
    twoFactorEnabled: true,
    twoFactorSecret: 'JBSWY3DPEHPK3PXP', // Test TOTP secret
  });
}

export function createAdminUser(options: UserFactoryOptions = {}) {
  return createUser({ ...options, role: Role.ADMIN });
}

export function createDoctorUser(options: UserFactoryOptions = {}) {
  return createUser({ ...options, role: Role.DOCTOR });
}

export function createReceptionUser(options: UserFactoryOptions = {}) {
  return createUser({ ...options, role: Role.RECEPTION });
}
