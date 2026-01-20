import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateServiceDto, UpdateServiceDto, QueryServicesDto } from './dto';
import { validateSortBy } from '../../common/utils/validate-sort-by.util';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'price'] as const;

@Injectable()
export class ServicesService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(tenantId: string, query: QueryServicesDto) {
    const { search, category, active, page, limit, sortBy, sortOrder } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.ServiceWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (active !== undefined) {
      where.active = active;
    }

    const validatedSortBy = validateSortBy(sortBy, ALLOWED_SORT_FIELDS, 'name');

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [validatedSortBy]: sortOrder },
      }),
      this.prisma.service.count({ where }),
    ]);

    return {
      data: services,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(tenantId: string, id: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async create(tenantId: string, dto: CreateServiceDto, actorId: string) {
    const service = await this.prisma.service.create({
      data: {
        tenantId,
        name: dto.name,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        nameCkb: dto.nameCkb,
        nameKmr: dto.nameKmr,
        durationMinutes: dto.durationMinutes,
        price: new Prisma.Decimal(dto.price),
        category: dto.category,
        active: dto.active ?? true,
      },
    });

    // Log activity
    await this.activityService.create({
      tenantId,
      entityType: 'Service',
      entityId: service.id,
      action: 'created',
      actorId,
      metadata: { name: service.name, price: service.price.toString() },
    });

    return service;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateServiceDto,
    actorId: string,
  ) {
    const existingService = await this.prisma.service.findFirst({
      where: { id, tenantId },
    });

    if (!existingService) {
      throw new NotFoundException('Service not found');
    }

    const updateData: any = { ...dto };

    if (dto.price !== undefined) {
      updateData.price = new Prisma.Decimal(dto.price);
    }

    const service = await this.prisma.service.update({
      where: { id },
      data: updateData,
    });

    // Log activity
    await this.activityService.create({
      tenantId,
      entityType: 'Service',
      entityId: service.id,
      action: 'updated',
      actorId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return service;
  }

  async delete(tenantId: string, id: string, actorId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Soft delete by setting active to false
    await this.prisma.service.update({
      where: { id },
      data: { active: false },
    });

    // Log activity
    await this.activityService.create({
      tenantId,
      entityType: 'Service',
      entityId: id,
      action: 'deleted',
      actorId,
      metadata: { name: service.name },
    });

    return { message: 'Service deleted successfully' };
  }

  async getCategories(tenantId: string) {
    const services = await this.prisma.service.findMany({
      where: { tenantId, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return services.map((s) => s.category).filter(Boolean);
  }
}
