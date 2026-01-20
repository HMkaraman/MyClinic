import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { ActivityService } from '../../activity/activity.service';
import { CreateCategoryDto, UpdateCategoryDto, QueryCategoriesDto } from './dto';
import { validateSortBy } from '../../../common/utils/validate-sort-by.util';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name'] as const;

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(tenantId: string, query: QueryCategoriesDto) {
    const { search, parentId, active, page, limit, sortBy, sortOrder } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.InventoryCategoryWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (parentId !== undefined) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    if (active !== undefined) {
      where.active = active;
    }

    const validatedSortBy = validateSortBy(sortBy, ALLOWED_SORT_FIELDS, 'name');

    const [categories, total] = await Promise.all([
      this.prisma.inventoryCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [validatedSortBy]: sortOrder },
        include: {
          parent: { select: { id: true, name: true } },
          _count: { select: { children: true, items: true } },
        },
      }),
      this.prisma.inventoryCategory.count({ where }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(tenantId: string, id: string) {
    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id, tenantId },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, active: true } },
        _count: { select: { items: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async getHierarchy(tenantId: string) {
    // Get root categories with nested children
    const rootCategories = await this.prisma.inventoryCategory.findMany({
      where: { tenantId, parentId: null, active: true },
      orderBy: { name: 'asc' },
      include: {
        children: {
          where: { active: true },
          orderBy: { name: 'asc' },
          include: {
            children: {
              where: { active: true },
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    });

    return rootCategories;
  }

  async create(tenantId: string, dto: CreateCategoryDto, actorId: string) {
    // Validate parent exists if provided
    if (dto.parentId) {
      const parent = await this.prisma.inventoryCategory.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = await this.prisma.inventoryCategory.create({
      data: {
        tenantId,
        name: dto.name,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        nameCkb: dto.nameCkb,
        nameKmr: dto.nameKmr,
        parentId: dto.parentId,
        active: dto.active ?? true,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'InventoryCategory',
      entityId: category.id,
      action: 'created',
      actorId,
      metadata: { name: category.name },
    });

    return category;
  }

  async update(tenantId: string, id: string, dto: UpdateCategoryDto, actorId: string) {
    const existingCategory = await this.prisma.inventoryCategory.findFirst({
      where: { id, tenantId },
    });

    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    // Prevent circular reference
    if (dto.parentId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    // Validate parent exists if provided
    if (dto.parentId) {
      const parent = await this.prisma.inventoryCategory.findFirst({
        where: { id: dto.parentId, tenantId },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = await this.prisma.inventoryCategory.update({
      where: { id },
      data: dto,
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'InventoryCategory',
      entityId: category.id,
      action: 'updated',
      actorId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return category;
  }

  async delete(tenantId: string, id: string, actorId: string) {
    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { children: true, items: true } },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Check for children or items
    if (category._count.children > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    if (category._count.items > 0) {
      throw new BadRequestException('Cannot delete category with items');
    }

    await this.prisma.inventoryCategory.delete({
      where: { id },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'InventoryCategory',
      entityId: id,
      action: 'deleted',
      actorId,
      metadata: { name: category.name },
    });

    return { message: 'Category deleted successfully' };
  }
}
