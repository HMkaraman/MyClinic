import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { AuditService } from '../audit.service';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { JwtPayload } from '../../auth/decorators/current-user.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditMetadata = this.reflector.get<AuditMetadata>(
      AUDIT_KEY,
      context.getHandler(),
    );

    // If no audit decorator, skip auditing
    if (!auditMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    // Skip if no authenticated user
    if (!user) {
      return next.handle();
    }

    const correlationId = uuidv4();
    const startTime = Date.now();

    // Extract entity ID from request
    let entityId = 'unknown';
    if (auditMetadata.entityIdParam) {
      entityId =
        request.params?.[auditMetadata.entityIdParam] ||
        request.body?.[auditMetadata.entityIdParam] ||
        request.query?.[auditMetadata.entityIdParam] ||
        'unknown';
    }

    // Get before state if needed (would need additional service call)
    const beforeState = auditMetadata.captureBeforeState
      ? request.body
      : undefined;

    return next.handle().pipe(
      tap({
        next: (response) => {
          // Log successful operation
          this.auditService
            .log({
              tenantId: user.tenantId,
              branchId: request.branchId,
              userId: user.sub,
              userRole: user.role,
              entityType: auditMetadata.entityType,
              entityId,
              action: auditMetadata.action,
              before: beforeState,
              after: response,
              correlationId,
              ipAddress: this.getIpAddress(request),
              userAgent: request.headers['user-agent'],
            })
            .catch((err) => {
              console.error('Failed to log audit event:', err);
            });
        },
        error: (error) => {
          // Log failed operation
          this.auditService
            .log({
              tenantId: user.tenantId,
              branchId: request.branchId,
              userId: user.sub,
              userRole: user.role,
              entityType: auditMetadata.entityType,
              entityId,
              action: `${auditMetadata.action}_FAILED`,
              before: beforeState,
              after: { error: error.message },
              correlationId,
              ipAddress: this.getIpAddress(request),
              userAgent: request.headers['user-agent'],
            })
            .catch((err) => {
              console.error('Failed to log audit event:', err);
            });
        },
      }),
    );
  }

  private getIpAddress(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown'
    );
  }
}
