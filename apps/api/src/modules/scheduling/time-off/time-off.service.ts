import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, TimeOffStatus, Role } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { ActivityService } from '../../activity/activity.service';
import { CreateTimeOffDto, ReviewTimeOffDto, ReviewAction, QueryTimeOffDto } from './dto';
import {
  SCHEDULING_EVENTS,
  TimeOffRequestedEvent,
  TimeOffApprovedEvent,
  TimeOffRejectedEvent,
} from '../events/scheduling.events';
import { validateSortBy } from '../../../common/utils/validate-sort-by.util';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'startDate', 'endDate', 'status', 'type'] as const;

@Injectable()
export class TimeOffService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string, query: QueryTimeOffDto, currentUserId: string, userRole: Role) {
    const { userId, type, status, startDate, endDate, page, limit, sortBy, sortOrder } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.TimeOffRequestWhereInput = { tenantId };

    // Non-admins/managers can only see their own requests
    const adminRoles: Role[] = [Role.ADMIN, Role.MANAGER];
    if (!adminRoles.includes(userRole)) {
      where.userId = currentUserId;
    } else if (userId) {
      where.userId = userId;
    }

    if (type) where.type = type;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.OR = [
        {
          startDate: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        },
        {
          endDate: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          },
        },
      ];
    }

    const validatedSortBy = validateSortBy(sortBy, ALLOWED_SORT_FIELDS, 'startDate');

    const [requests, total] = await Promise.all([
      this.prisma.timeOffRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [validatedSortBy]: sortOrder },
        include: {
          user: { select: { id: true, name: true, role: true } },
          reviewer: { select: { id: true, name: true } },
        },
      }),
      this.prisma.timeOffRequest.count({ where }),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(tenantId: string, id: string, currentUserId: string, userRole: Role) {
    const request = await this.prisma.timeOffRequest.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Time off request not found');
    }

    // Non-admins/managers can only view their own requests
    const adminRoles: Role[] = [Role.ADMIN, Role.MANAGER];
    if (!adminRoles.includes(userRole) && request.userId !== currentUserId) {
      throw new ForbiddenException('You can only view your own requests');
    }

    return request;
  }

  async getPendingCount(tenantId: string) {
    const count = await this.prisma.timeOffRequest.count({
      where: { tenantId, status: TimeOffStatus.PENDING },
    });
    return { pending: count };
  }

  async create(tenantId: string, dto: CreateTimeOffDto, actorId: string) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before or equal to end date');
    }

    if (startDate < new Date()) {
      throw new BadRequestException('Cannot request time off for past dates');
    }

    // Check for overlapping requests
    const overlapping = await this.prisma.timeOffRequest.findFirst({
      where: {
        tenantId,
        userId: actorId,
        status: { in: [TimeOffStatus.PENDING, TimeOffStatus.APPROVED] },
        OR: [
          { startDate: { lte: endDate }, endDate: { gte: startDate } },
        ],
      },
    });

    if (overlapping) {
      throw new BadRequestException('You already have a time off request for overlapping dates');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true },
    });

    const request = await this.prisma.timeOffRequest.create({
      data: {
        tenantId,
        userId: actorId,
        type: dto.type,
        startDate,
        endDate,
        reason: dto.reason,
        status: TimeOffStatus.PENDING,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    // Notify managers
    const managers = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: [Role.ADMIN, Role.MANAGER] },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (managers.length > 0) {
      const event: TimeOffRequestedEvent = {
        tenantId,
        recipientUserIds: managers.map((m) => m.id),
        entityType: 'TimeOffRequest',
        entityId: request.id,
        requestId: request.id,
        userId: actorId,
        userName: user?.name ?? 'Unknown',
        type: dto.type,
        startDate,
        endDate,
        reason: dto.reason,
      };
      this.eventEmitter.emit(SCHEDULING_EVENTS.TIME_OFF_REQUESTED, event);
    }

    await this.activityService.create({
      tenantId,
      entityType: 'TimeOffRequest',
      entityId: request.id,
      action: 'created',
      actorId,
      metadata: { type: dto.type, startDate: dto.startDate, endDate: dto.endDate },
    });

    return request;
  }

  async review(tenantId: string, id: string, dto: ReviewTimeOffDto, reviewerId: string) {
    const request = await this.prisma.timeOffRequest.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    if (!request) {
      throw new NotFoundException('Time off request not found');
    }

    if (request.status !== TimeOffStatus.PENDING) {
      throw new BadRequestException('Can only review pending requests');
    }

    if (request.userId === reviewerId) {
      throw new ForbiddenException('Cannot review your own request');
    }

    const reviewer = await this.prisma.user.findUnique({
      where: { id: reviewerId },
      select: { name: true },
    });

    const newStatus =
      dto.action === ReviewAction.APPROVE ? TimeOffStatus.APPROVED : TimeOffStatus.REJECTED;

    const updatedRequest = await this.prisma.timeOffRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: dto.notes,
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        reviewer: { select: { id: true, name: true } },
      },
    });

    // Notify the requester
    if (dto.action === ReviewAction.APPROVE) {
      const event: TimeOffApprovedEvent = {
        tenantId,
        recipientUserIds: [request.userId],
        entityType: 'TimeOffRequest',
        entityId: request.id,
        requestId: request.id,
        userId: request.userId,
        userName: request.user.name,
        type: request.type,
        startDate: request.startDate,
        endDate: request.endDate,
        approvedById: reviewerId,
        approvedByName: reviewer?.name ?? 'Unknown',
      };
      this.eventEmitter.emit(SCHEDULING_EVENTS.TIME_OFF_APPROVED, event);
    } else {
      const event: TimeOffRejectedEvent = {
        tenantId,
        recipientUserIds: [request.userId],
        entityType: 'TimeOffRequest',
        entityId: request.id,
        requestId: request.id,
        userId: request.userId,
        userName: request.user.name,
        type: request.type,
        startDate: request.startDate,
        endDate: request.endDate,
        rejectedById: reviewerId,
        rejectedByName: reviewer?.name ?? 'Unknown',
        reason: dto.notes,
      };
      this.eventEmitter.emit(SCHEDULING_EVENTS.TIME_OFF_REJECTED, event);
    }

    await this.activityService.create({
      tenantId,
      entityType: 'TimeOffRequest',
      entityId: request.id,
      action: dto.action === ReviewAction.APPROVE ? 'approved' : 'rejected',
      actorId: reviewerId,
      metadata: { notes: dto.notes },
    });

    return updatedRequest;
  }

  async cancel(tenantId: string, id: string, actorId: string, userRole: Role) {
    const request = await this.prisma.timeOffRequest.findFirst({
      where: { id, tenantId },
    });

    if (!request) {
      throw new NotFoundException('Time off request not found');
    }

    // Only owner or admin/manager can cancel
    const adminRoles: Role[] = [Role.ADMIN, Role.MANAGER];
    if (request.userId !== actorId && !adminRoles.includes(userRole)) {
      throw new ForbiddenException('You can only cancel your own requests');
    }

    if (request.status === TimeOffStatus.CANCELLED) {
      throw new BadRequestException('Request is already cancelled');
    }

    const updatedRequest = await this.prisma.timeOffRequest.update({
      where: { id },
      data: { status: TimeOffStatus.CANCELLED },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'TimeOffRequest',
      entityId: request.id,
      action: 'cancelled',
      actorId,
      metadata: {},
    });

    return updatedRequest;
  }
}
