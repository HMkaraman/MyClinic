import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { ActivityService } from '../../activity/activity.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  ApplyTemplateDto,
  BulkDeleteDto,
  QuerySchedulesDto,
} from './dto';
import { SCHEDULING_EVENTS, ScheduleChangedEvent } from '../events/scheduling.events';

@Injectable()
export class SchedulesService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string, query: QuerySchedulesDto) {
    const { userId, branchId, startDate, endDate } = query;

    const where: Prisma.WorkScheduleWhereInput = { tenantId };

    if (userId) where.userId = userId;
    if (branchId) where.branchId = branchId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const schedules = await this.prisma.workSchedule.findMany({
      where,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        user: { select: { id: true, name: true, role: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    return schedules;
  }

  async findById(tenantId: string, id: string) {
    const schedule = await this.prisma.workSchedule.findFirst({
      where: { id, tenantId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return schedule;
  }

  async getByUserAndDate(tenantId: string, userId: string, date: string) {
    const schedules = await this.prisma.workSchedule.findMany({
      where: {
        tenantId,
        userId,
        date: new Date(date),
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    return schedules;
  }

  async create(tenantId: string, dto: CreateScheduleDto, actorId: string) {
    // Validate user exists
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Validate branch exists
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenantId },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    // Check for existing schedule
    const existing = await this.prisma.workSchedule.findFirst({
      where: {
        tenantId,
        userId: dto.userId,
        branchId: dto.branchId,
        date: new Date(dto.date),
      },
    });

    if (existing) {
      throw new ConflictException('Schedule already exists for this user, branch, and date');
    }

    // Validate times
    this.validateTimes(dto);

    const schedule = await this.prisma.workSchedule.create({
      data: {
        tenantId,
        userId: dto.userId,
        branchId: dto.branchId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        breakStart: dto.breakStart,
        breakEnd: dto.breakEnd,
        notes: dto.notes,
      },
      include: {
        user: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    // Emit schedule changed event
    await this.emitScheduleChanged(tenantId, schedule, 'created', actorId, user.name);

    await this.activityService.create({
      tenantId,
      entityType: 'WorkSchedule',
      entityId: schedule.id,
      action: 'created',
      actorId,
      metadata: { userId: dto.userId, date: dto.date },
    });

    return schedule;
  }

  async update(tenantId: string, id: string, dto: UpdateScheduleDto, actorId: string) {
    const schedule = await this.prisma.workSchedule.findFirst({
      where: { id, tenantId },
      include: { user: { select: { name: true } } },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Validate times if provided
    if (dto.startTime || dto.endTime) {
      this.validateTimes({
        startTime: dto.startTime ?? schedule.startTime,
        endTime: dto.endTime ?? schedule.endTime,
        breakStart: dto.breakStart ?? schedule.breakStart ?? undefined,
        breakEnd: dto.breakEnd ?? schedule.breakEnd ?? undefined,
      });
    }

    const updatedSchedule = await this.prisma.workSchedule.update({
      where: { id },
      data: dto,
      include: {
        user: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    // Emit schedule changed event
    await this.emitScheduleChanged(tenantId, updatedSchedule, 'updated', actorId, schedule.user.name);

    await this.activityService.create({
      tenantId,
      entityType: 'WorkSchedule',
      entityId: schedule.id,
      action: 'updated',
      actorId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return updatedSchedule;
  }

  async delete(tenantId: string, id: string, actorId: string) {
    const schedule = await this.prisma.workSchedule.findFirst({
      where: { id, tenantId },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.prisma.workSchedule.delete({
      where: { id },
    });

    // Emit schedule changed event
    await this.emitScheduleChanged(tenantId, schedule, 'deleted', actorId, schedule.user.name);

    await this.activityService.create({
      tenantId,
      entityType: 'WorkSchedule',
      entityId: id,
      action: 'deleted',
      actorId,
      metadata: { userId: schedule.userId, date: schedule.date },
    });

    return { message: 'Schedule deleted successfully' };
  }

  async applyTemplate(tenantId: string, dto: ApplyTemplateDto, actorId: string) {
    // Validate template exists
    const template = await this.prisma.scheduleTemplate.findFirst({
      where: { id: dto.templateId, tenantId },
      include: { slots: true },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Validate user exists
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Validate branch exists
    const branch = await this.prisma.branch.findFirst({
      where: { id: dto.branchId, tenantId },
    });

    if (!branch) {
      throw new BadRequestException('Branch not found');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Generate schedules for each day
    const schedulesToCreate: Prisma.WorkScheduleCreateManyInput[] = [];
    const existingDates: string[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const slot = template.slots.find((s) => s.dayOfWeek === dayOfWeek);

      if (slot) {
        const dateStr = currentDate.toISOString().split('T')[0];

        // Check for existing schedule
        const existing = await this.prisma.workSchedule.findFirst({
          where: {
            tenantId,
            userId: dto.userId,
            branchId: dto.branchId,
            date: new Date(dateStr),
          },
        });

        if (existing) {
          if (dto.overwrite) {
            await this.prisma.workSchedule.delete({ where: { id: existing.id } });
          } else {
            existingDates.push(dateStr);
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }
        }

        schedulesToCreate.push({
          tenantId,
          userId: dto.userId,
          branchId: dto.branchId,
          date: new Date(dateStr),
          startTime: slot.startTime,
          endTime: slot.endTime,
          breakStart: slot.breakStart,
          breakEnd: slot.breakEnd,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create all schedules
    if (schedulesToCreate.length > 0) {
      await this.prisma.workSchedule.createMany({
        data: schedulesToCreate,
      });
    }

    await this.activityService.create({
      tenantId,
      entityType: 'WorkSchedule',
      entityId: dto.userId,
      action: 'template_applied',
      actorId,
      metadata: {
        templateId: dto.templateId,
        templateName: template.name,
        schedulesCreated: schedulesToCreate.length,
        skippedDates: existingDates.length,
      },
    });

    return {
      message: 'Template applied successfully',
      created: schedulesToCreate.length,
      skipped: existingDates,
    };
  }

  async bulkDelete(tenantId: string, dto: BulkDeleteDto, actorId: string) {
    const where: Prisma.WorkScheduleWhereInput = {
      tenantId,
      userId: dto.userId,
      date: {
        gte: new Date(dto.startDate),
        lte: new Date(dto.endDate),
      },
    };

    if (dto.branchId) {
      where.branchId = dto.branchId;
    }

    const result = await this.prisma.workSchedule.deleteMany({ where });

    await this.activityService.create({
      tenantId,
      entityType: 'WorkSchedule',
      entityId: dto.userId,
      action: 'bulk_deleted',
      actorId,
      metadata: {
        startDate: dto.startDate,
        endDate: dto.endDate,
        count: result.count,
      },
    });

    return {
      message: 'Schedules deleted successfully',
      deleted: result.count,
    };
  }

  private validateTimes(dto: {
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
  }) {
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    if (dto.breakStart && dto.breakEnd) {
      if (dto.breakStart >= dto.breakEnd) {
        throw new BadRequestException('Break start must be before break end');
      }
      if (dto.breakStart < dto.startTime || dto.breakEnd > dto.endTime) {
        throw new BadRequestException('Break times must be within working hours');
      }
    } else if (dto.breakStart || dto.breakEnd) {
      throw new BadRequestException('Both break start and end times must be provided');
    }
  }

  private async emitScheduleChanged(
    tenantId: string,
    schedule: any,
    changeType: 'created' | 'updated' | 'deleted',
    actorId: string,
    userName: string,
  ) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true },
    });

    // Notify the affected user if they're not the actor
    if (schedule.userId !== actorId) {
      const event: ScheduleChangedEvent = {
        tenantId,
        recipientUserIds: [schedule.userId],
        entityType: 'WorkSchedule',
        entityId: schedule.id,
        scheduleId: schedule.id,
        userId: schedule.userId,
        userName,
        date: schedule.date,
        changeType,
        changedById: actorId,
        changedByName: actor?.name ?? 'Unknown',
      };

      this.eventEmitter.emit(SCHEDULING_EVENTS.SCHEDULE_CHANGED, event);
    }
  }
}
