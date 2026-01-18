import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, switchMap, tap, catchError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../audit.service';
import { AUDIT_KEY, AuditMetadata } from '../decorators/audit.decorator';
import { JwtPayload } from '../../auth/decorators/current-user.decorator';

// Map entity types to Prisma model names
const MODEL_MAP: Record<string, string> = {
  Appointment: 'appointment',
  Patient: 'patient',
  Invoice: 'invoice',
  User: 'user',
  Visit: 'visit',
  Task: 'task',
  Lead: 'lead',
  Service: 'service',
  Conversation: 'conversation',
  Attachment: 'attachment',
  Branch: 'branch',
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
    private prisma: PrismaService,
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

    // Extract entity ID from request
    let entityId = 'unknown';
    if (auditMetadata.entityIdParam) {
      entityId =
        request.params?.[auditMetadata.entityIdParam] ||
        request.body?.[auditMetadata.entityIdParam] ||
        request.query?.[auditMetadata.entityIdParam] ||
        'unknown';
    }

    // If captureBeforeState is true, fetch from DB; otherwise proceed directly
    if (auditMetadata.captureBeforeState && entityId && entityId !== 'unknown' && auditMetadata.entityType) {
      // Use switchMap to handle async before state fetch
      return from(
        this.fetchEntityState(auditMetadata.entityType, entityId, user.tenantId),
      ).pipe(
        switchMap((beforeState) => {
          return next.handle().pipe(
            tap({
              next: (response) => {
                this.logAuditEvent(
                  auditMetadata,
                  user,
                  request,
                  entityId,
                  correlationId,
                  beforeState,
                  response,
                  false,
                );
              },
              error: (error) => {
                this.logAuditEvent(
                  auditMetadata,
                  user,
                  request,
                  entityId,
                  correlationId,
                  beforeState,
                  { error: error.message },
                  true,
                );
              },
            }),
          );
        }),
        catchError((error) => {
          // If fetching before state fails, continue with undefined
          return next.handle().pipe(
            tap({
              next: (response) => {
                this.logAuditEvent(
                  auditMetadata,
                  user,
                  request,
                  entityId,
                  correlationId,
                  undefined,
                  response,
                  false,
                );
              },
              error: (err) => {
                this.logAuditEvent(
                  auditMetadata,
                  user,
                  request,
                  entityId,
                  correlationId,
                  undefined,
                  { error: err.message },
                  true,
                );
              },
            }),
          );
        }),
      );
    }

    // No before state needed - proceed directly
    return next.handle().pipe(
      tap({
        next: (response) => {
          this.logAuditEvent(
            auditMetadata,
            user,
            request,
            entityId,
            correlationId,
            undefined,
            response,
            false,
          );
        },
        error: (error) => {
          this.logAuditEvent(
            auditMetadata,
            user,
            request,
            entityId,
            correlationId,
            undefined,
            { error: error.message },
            true,
          );
        },
      }),
    );
  }

  private logAuditEvent(
    auditMetadata: AuditMetadata,
    user: JwtPayload,
    request: any,
    entityId: string,
    correlationId: string,
    beforeState: Record<string, unknown> | null | undefined,
    afterState: unknown,
    isFailed: boolean,
  ): void {
    this.auditService
      .log({
        tenantId: user.tenantId,
        branchId: request.branchId,
        userId: user.sub,
        userRole: user.role,
        entityType: auditMetadata.entityType,
        entityId,
        action: isFailed ? `${auditMetadata.action}_FAILED` : auditMetadata.action,
        before: beforeState ?? undefined,
        after: afterState,
        correlationId,
        ipAddress: this.getIpAddress(request),
        userAgent: request.headers['user-agent'],
      })
      .catch((err) => {
        console.error('Failed to log audit event:', err);
      });
  }

  /**
   * Fetch entity state from database before mutation
   */
  private async fetchEntityState(
    entityType: string,
    entityId: string,
    tenantId: string,
  ): Promise<Record<string, unknown> | null> {
    const model = MODEL_MAP[entityType];
    if (!model) return null;

    try {
      // User model doesn't have tenantId directly, handle separately
      if (entityType === 'User') {
        const entity = await (this.prisma as any)[model].findUnique({
          where: { id: entityId },
        });
        return entity;
      }

      // For tenant-scoped models, include tenantId in the query
      const entity = await (this.prisma as any)[model].findFirst({
        where: { id: entityId, tenantId },
      });
      return entity;
    } catch (error) {
      console.error(`Failed to fetch before state for ${entityType}:${entityId}:`, error);
      return null;
    }
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
