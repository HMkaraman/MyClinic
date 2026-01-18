import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { createJwtPayload, createAdminPayload, createDoctorPayload } from '../../../../test/factories';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  const createMockExecutionContext = (user: any = null): ExecutionContext => {
    const mockContext = {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
        getResponse: () => ({}),
        getNext: () => jest.fn(),
      }),
      getArgs: () => [],
      getArgByIndex: () => ({}),
      switchToRpc: () => ({
        getData: () => ({}),
        getContext: () => ({}),
      }),
      switchToWs: () => ({
        getData: () => ({}),
        getClient: () => ({}),
        getPattern: () => '',
      }),
      getType: () => 'http',
    };
    return mockContext as unknown as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should allow access when no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const context = createMockExecutionContext(createDoctorPayload());
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when roles array is empty', () => {
      reflector.getAllAndOverride.mockReturnValue([]);

      const context = createMockExecutionContext(createDoctorPayload());
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow access when user has required role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.MANAGER]);

      const context = createMockExecutionContext(createAdminPayload());
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user does not have required role', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.MANAGER]);

      const context = createMockExecutionContext(createDoctorPayload());

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access denied. Required roles: ADMIN, MANAGER',
      );
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      const context = createMockExecutionContext(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });

    it('should check roles from both handler and class', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.DOCTOR]);

      const handler = jest.fn();
      const classTarget = jest.fn();
      const context = {
        ...createMockExecutionContext(createDoctorPayload()),
        getHandler: () => handler,
        getClass: () => classTarget,
      } as unknown as ExecutionContext;

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
        handler,
        classTarget,
      ]);
    });

    it('should allow RECEPTION role when RECEPTION is required', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.RECEPTION]);

      const context = createMockExecutionContext(
        createJwtPayload({ role: Role.RECEPTION }),
      );
      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should allow multiple valid roles', () => {
      reflector.getAllAndOverride.mockReturnValue([
        Role.ADMIN,
        Role.MANAGER,
        Role.DOCTOR,
        Role.NURSE,
      ]);

      // Test DOCTOR
      const doctorContext = createMockExecutionContext(createDoctorPayload());
      expect(guard.canActivate(doctorContext)).toBe(true);

      // Test NURSE
      const nurseContext = createMockExecutionContext(
        createJwtPayload({ role: Role.NURSE }),
      );
      expect(guard.canActivate(nurseContext)).toBe(true);
    });

    it('should deny SUPPORT role for admin-only routes', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.MANAGER]);

      const context = createMockExecutionContext(
        createJwtPayload({ role: Role.SUPPORT }),
      );

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should deny ACCOUNTANT role for medical routes', () => {
      reflector.getAllAndOverride.mockReturnValue([Role.DOCTOR, Role.NURSE]);

      const context = createMockExecutionContext(
        createJwtPayload({ role: Role.ACCOUNTANT }),
      );

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
