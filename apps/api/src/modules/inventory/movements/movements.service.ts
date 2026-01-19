import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, MovementType } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

export interface QueryMovementsDto {
  itemId?: string;
  type?: MovementType;
  startDate?: string;
  endDate?: string;
  performedBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class MovementsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryMovementsDto) {
    const {
      itemId,
      type,
      startDate,
      endDate,
      performedBy,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryMovementWhereInput = { tenantId };

    if (itemId) where.itemId = itemId;
    if (type) where.type = type;
    if (performedBy) where.performedBy = performedBy;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          item: { select: { id: true, sku: true, name: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByItem(tenantId: string, itemId: string, page: number = 1, limit: number = 20) {
    // Verify item exists
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: itemId, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    const skip = (page - 1) * limit;

    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where: { tenantId, itemId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.inventoryMovement.count({ where: { tenantId, itemId } }),
    ]);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMovementSummary(tenantId: string, startDate?: string, endDate?: string) {
    const where: Prisma.InventoryMovementWhereInput = { tenantId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const movements = await this.prisma.inventoryMovement.groupBy({
      by: ['type'],
      where,
      _count: true,
      _sum: { quantity: true },
    });

    const summary: Record<string, { count: number; totalQuantity: number }> = {};

    for (const m of movements) {
      summary[m.type] = {
        count: m._count,
        totalQuantity: m._sum.quantity ?? 0,
      };
    }

    return summary;
  }
}
