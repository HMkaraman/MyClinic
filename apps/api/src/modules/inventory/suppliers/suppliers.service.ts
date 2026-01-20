import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { ActivityService } from '../../activity/activity.service';
import { CreateSupplierDto, UpdateSupplierDto, QuerySuppliersDto } from './dto';
import { validateSortBy } from '../../../common/utils/validate-sort-by.util';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name'] as const;

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(tenantId: string, query: QuerySuppliersDto) {
    const { search, active, page, limit, sortBy, sortOrder } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.SupplierWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (active !== undefined) {
      where.active = active;
    }

    const validatedSortBy = validateSortBy(sortBy, ALLOWED_SORT_FIELDS, 'name');

    const [suppliers, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [validatedSortBy]: sortOrder },
        include: {
          _count: { select: { items: true, purchaseOrders: true } },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(tenantId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { items: true, purchaseOrders: true } },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async getSupplierItems(tenantId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    const items = await this.prisma.inventoryItem.findMany({
      where: { tenantId, supplierId: id, active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        sku: true,
        name: true,
        quantityInStock: true,
        reorderPoint: true,
        costPrice: true,
      },
    });

    return items;
  }

  async create(tenantId: string, dto: CreateSupplierDto, actorId: string) {
    const supplier = await this.prisma.supplier.create({
      data: {
        tenantId,
        ...dto,
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'Supplier',
      entityId: supplier.id,
      action: 'created',
      actorId,
      metadata: { name: supplier.name },
    });

    return supplier;
  }

  async update(tenantId: string, id: string, dto: UpdateSupplierDto, actorId: string) {
    const existingSupplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
    });

    if (!existingSupplier) {
      throw new NotFoundException('Supplier not found');
    }

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: dto,
    });

    await this.activityService.create({
      tenantId,
      entityType: 'Supplier',
      entityId: supplier.id,
      action: 'updated',
      actorId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return supplier;
  }

  async delete(tenantId: string, id: string, actorId: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { items: true, purchaseOrders: true } },
      },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    if (supplier._count.items > 0 || supplier._count.purchaseOrders > 0) {
      throw new BadRequestException(
        'Cannot delete supplier with associated items or purchase orders',
      );
    }

    await this.prisma.supplier.delete({
      where: { id },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'Supplier',
      entityId: id,
      action: 'deleted',
      actorId,
      metadata: { name: supplier.name },
    });

    return { message: 'Supplier deleted successfully' };
  }
}
