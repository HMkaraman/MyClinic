import { Role } from '@prisma/client';
import { JwtPayload } from '../../src/modules/auth/decorators/current-user.decorator';

export interface JwtPayloadFactoryOptions {
  sub?: string;
  email?: string;
  tenantId?: string;
  branchIds?: string[];
  role?: Role;
}

export function createJwtPayload(options: JwtPayloadFactoryOptions = {}): JwtPayload {
  return {
    sub: options.sub ?? 'test-user-id',
    email: options.email ?? 'test@example.com',
    tenantId: options.tenantId ?? 'test-tenant-id',
    branchIds: options.branchIds ?? ['test-branch-id'],
    role: options.role ?? Role.DOCTOR,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
}

export function createAdminPayload(options: JwtPayloadFactoryOptions = {}): JwtPayload {
  return createJwtPayload({ ...options, role: Role.ADMIN });
}

export function createManagerPayload(options: JwtPayloadFactoryOptions = {}): JwtPayload {
  return createJwtPayload({ ...options, role: Role.MANAGER });
}

export function createDoctorPayload(options: JwtPayloadFactoryOptions = {}): JwtPayload {
  return createJwtPayload({ ...options, role: Role.DOCTOR });
}

export function createNursePayload(options: JwtPayloadFactoryOptions = {}): JwtPayload {
  return createJwtPayload({ ...options, role: Role.NURSE });
}

export function createReceptionPayload(options: JwtPayloadFactoryOptions = {}): JwtPayload {
  return createJwtPayload({ ...options, role: Role.RECEPTION });
}

export function createAccountantPayload(options: JwtPayloadFactoryOptions = {}): JwtPayload {
  return createJwtPayload({ ...options, role: Role.ACCOUNTANT });
}

export function createSupportPayload(options: JwtPayloadFactoryOptions = {}): JwtPayload {
  return createJwtPayload({ ...options, role: Role.SUPPORT });
}
