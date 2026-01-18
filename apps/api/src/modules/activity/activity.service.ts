import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export interface ActivityInput {
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async create(input: ActivityInput): Promise<void> {
    await this.prisma.activityEvent.create({
      data: {
        tenantId: input.tenantId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorId: input.actorId,
        metadata: input.metadata as any,
      },
    });
  }

  async getEntityTimeline(tenantId: string, entityType: string, entityId: string) {
    return this.prisma.activityEvent.findMany({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getUserActivity(tenantId: string, actorId: string, limit: number = 50) {
    return this.prisma.activityEvent.findMany({
      where: {
        tenantId,
        actorId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRecentActivity(
    tenantId: string,
    entityTypes?: string[],
    limit: number = 50,
  ) {
    const where: any = {
      tenantId,
    };

    if (entityTypes && entityTypes.length > 0) {
      where.entityType = { in: entityTypes };
    }

    return this.prisma.activityEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  // Convenience methods for common entity types
  async logPatientActivity(
    tenantId: string,
    patientId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      tenantId,
      entityType: 'Patient',
      entityId: patientId,
      action,
      actorId,
      metadata,
    });
  }

  async logAppointmentActivity(
    tenantId: string,
    appointmentId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      tenantId,
      entityType: 'Appointment',
      entityId: appointmentId,
      action,
      actorId,
      metadata,
    });
  }

  async logVisitActivity(
    tenantId: string,
    visitId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      tenantId,
      entityType: 'Visit',
      entityId: visitId,
      action,
      actorId,
      metadata,
    });
  }

  async logInvoiceActivity(
    tenantId: string,
    invoiceId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      tenantId,
      entityType: 'Invoice',
      entityId: invoiceId,
      action,
      actorId,
      metadata,
    });
  }

  async logConversationActivity(
    tenantId: string,
    conversationId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      tenantId,
      entityType: 'Conversation',
      entityId: conversationId,
      action,
      actorId,
      metadata,
    });
  }

  async logLeadActivity(
    tenantId: string,
    leadId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      tenantId,
      entityType: 'Lead',
      entityId: leadId,
      action,
      actorId,
      metadata,
    });
  }

  async logTaskActivity(
    tenantId: string,
    entityType: string,
    entityId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      tenantId,
      entityType,
      entityId,
      action,
      actorId,
      metadata,
    });
  }

  async logAttachmentActivity(
    tenantId: string,
    entityType: string,
    entityId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      tenantId,
      entityType,
      entityId,
      action,
      actorId,
      metadata,
    });
  }
}
