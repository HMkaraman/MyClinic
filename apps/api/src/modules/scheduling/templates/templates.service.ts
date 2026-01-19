import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { ActivityService } from '../../activity/activity.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(tenantId: string, active?: boolean) {
    const where: Prisma.ScheduleTemplateWhereInput = { tenantId };

    if (active !== undefined) {
      where.active = active;
    }

    const templates = await this.prisma.scheduleTemplate.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        slots: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    });

    return templates;
  }

  async findById(tenantId: string, id: string) {
    const template = await this.prisma.scheduleTemplate.findFirst({
      where: { id, tenantId },
      include: {
        slots: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    });

    if (!template) {
      throw new NotFoundException('Schedule template not found');
    }

    return template;
  }

  async getDefault(tenantId: string) {
    const template = await this.prisma.scheduleTemplate.findFirst({
      where: { tenantId, isDefault: true, active: true },
      include: {
        slots: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    });

    return template;
  }

  async create(tenantId: string, dto: CreateTemplateDto, actorId: string) {
    // Validate slot times
    this.validateSlots(dto.slots);

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.scheduleTemplate.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await this.prisma.scheduleTemplate.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
        active: dto.active ?? true,
        slots: {
          create: dto.slots.map((slot) => ({
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            breakStart: slot.breakStart,
            breakEnd: slot.breakEnd,
          })),
        },
      },
      include: {
        slots: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'ScheduleTemplate',
      entityId: template.id,
      action: 'created',
      actorId,
      metadata: { name: template.name },
    });

    return template;
  }

  async update(tenantId: string, id: string, dto: UpdateTemplateDto, actorId: string) {
    const existingTemplate = await this.prisma.scheduleTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!existingTemplate) {
      throw new NotFoundException('Schedule template not found');
    }

    // Validate slot times if provided
    if (dto.slots) {
      this.validateSlots(dto.slots);
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.scheduleTemplate.updateMany({
        where: { tenantId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    // Build update data
    const updateData: Prisma.ScheduleTemplateUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.isDefault !== undefined) updateData.isDefault = dto.isDefault;
    if (dto.active !== undefined) updateData.active = dto.active;

    // If slots are provided, replace all slots
    if (dto.slots) {
      // Delete existing slots
      await this.prisma.scheduleTemplateSlot.deleteMany({
        where: { templateId: id },
      });

      // Create new slots
      updateData.slots = {
        create: dto.slots.map((slot) => ({
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          breakStart: slot.breakStart,
          breakEnd: slot.breakEnd,
        })),
      };
    }

    const template = await this.prisma.scheduleTemplate.update({
      where: { id },
      data: updateData,
      include: {
        slots: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'ScheduleTemplate',
      entityId: template.id,
      action: 'updated',
      actorId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return template;
  }

  async delete(tenantId: string, id: string, actorId: string) {
    const template = await this.prisma.scheduleTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Schedule template not found');
    }

    if (template.isDefault) {
      throw new BadRequestException('Cannot delete the default template');
    }

    await this.prisma.scheduleTemplate.delete({
      where: { id },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'ScheduleTemplate',
      entityId: id,
      action: 'deleted',
      actorId,
      metadata: { name: template.name },
    });

    return { message: 'Template deleted successfully' };
  }

  private validateSlots(slots: CreateTemplateDto['slots']) {
    for (const slot of slots) {
      // Check start < end
      if (slot.startTime >= slot.endTime) {
        throw new BadRequestException(
          `Invalid time range for day ${slot.dayOfWeek}: start time must be before end time`,
        );
      }

      // Check break times if provided
      if (slot.breakStart && slot.breakEnd) {
        if (slot.breakStart >= slot.breakEnd) {
          throw new BadRequestException(
            `Invalid break time for day ${slot.dayOfWeek}: break start must be before break end`,
          );
        }

        if (slot.breakStart < slot.startTime || slot.breakEnd > slot.endTime) {
          throw new BadRequestException(
            `Invalid break time for day ${slot.dayOfWeek}: break must be within working hours`,
          );
        }
      } else if (slot.breakStart || slot.breakEnd) {
        throw new BadRequestException(
          `Both break start and end times must be provided together for day ${slot.dayOfWeek}`,
        );
      }
    }
  }
}
