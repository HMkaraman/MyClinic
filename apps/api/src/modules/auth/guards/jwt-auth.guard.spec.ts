import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from './jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new JwtAuthGuard(reflector);
  });

  const createMockExecutionContext = (handler?: any, classTarget?: any): ExecutionContext => {
    const mockContext = {
      getHandler: () => handler ?? jest.fn(),
      getClass: () => classTarget ?? jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: 'Bearer mock-token' },
          user: null,
        }),
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
    it('should allow access to public routes', () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const context = createMockExecutionContext();
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        expect.arrayContaining([expect.any(Function), expect.any(Function)]),
      );
    });

    it('should delegate to parent AuthGuard for non-public routes', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const context = createMockExecutionContext();

      // The parent AuthGuard.canActivate returns Observable or Promise
      // We mock the parent's behavior
      const parentCanActivate = jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      );
      parentCanActivate.mockReturnValue(true);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should check both handler and class for public decorator', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);

      const handler = jest.fn();
      const classTarget = jest.fn();
      const context = createMockExecutionContext(handler, classTarget);

      // Mock parent AuthGuard
      jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      ).mockReturnValue(true);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        handler,
        classTarget,
      ]);
    });

    it('should return false when isPublic is explicitly false', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const context = createMockExecutionContext();

      // Mock parent to return false (no valid token)
      jest.spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)),
        'canActivate',
      ).mockReturnValue(false);

      const result = guard.canActivate(context);

      expect(result).toBe(false);
    });
  });
});
