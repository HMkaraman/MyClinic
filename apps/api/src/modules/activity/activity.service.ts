import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

export interface ActivityInput {
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
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorId: input.actorId,
        metadata: input.metadata as any,
      },
    });
  }

  async getEntityTimeline(entityType: string, entityId: string) {
    return this.prisma.activityEvent.findMany({
      where: {
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

  async getUserActivity(actorId: string, limit: number = 50) {
    return this.prisma.activityEvent.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRecentActivity(
    entityTypes?: string[],
    limit: number = 50,
  ) {
    const where: any = {};

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
    patientId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      entityType: 'Patient',
      entityId: patientId,
      action,
      actorId,
      metadata,
    });
  }

  async logAppointmentActivity(
    appointmentId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      entityType: 'Appointment',
      entityId: appointmentId,
      action,
      actorId,
      metadata,
    });
  }

  async logVisitActivity(
    visitId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      entityType: 'Visit',
      entityId: visitId,
      action,
      actorId,
      metadata,
    });
  }

  async logInvoiceActivity(
    invoiceId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      entityType: 'Invoice',
      entityId: invoiceId,
      action,
      actorId,
      metadata,
    });
  }

  async logConversationActivity(
    conversationId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      entityType: 'Conversation',
      entityId: conversationId,
      action,
      actorId,
      metadata,
    });
  }

  async logLeadActivity(
    leadId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      entityType: 'Lead',
      entityId: leadId,
      action,
      actorId,
      metadata,
    });
  }

  async logTaskActivity(
    entityType: string,
    entityId: string,
    action: string,
    actorId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.create({
      entityType,
      entityId,
      action,
      actorId,
      metadata,
    });
  }
}
