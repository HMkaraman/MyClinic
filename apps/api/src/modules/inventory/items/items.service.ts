import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, MovementType, Role } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { ActivityService } from '../../activity/activity.service';
import { CreateItemDto, UpdateItemDto, AdjustStockDto, QueryItemsDto } from './dto';
import { INVENTORY_EVENTS, LowStockAlertEvent } from '../events/inventory.events';
import { validateSortBy } from '../../../common/utils/validate-sort-by.util';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'sku', 'quantityInStock'] as const;

@Injectable()
export class ItemsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string, query: QueryItemsDto) {
    const {
      search,
      categoryId,
      supplierId,
      unit,
      active,
      lowStock,
      outOfStock,
      expiringWithinDays,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.InventoryItemWhereInput = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (supplierId) where.supplierId = supplierId;
    if (unit) where.unit = unit;
    if (active !== undefined) where.active = active;

    if (lowStock) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
        {
          quantityInStock: { lte: this.prisma.inventoryItem.fields.reorderPoint },
        },
      ];
      // Use raw condition for comparing two columns
      where.quantityInStock = { lte: 0 }; // Will be overridden below
    }

    if (outOfStock) {
      where.quantityInStock = { equals: 0 };
    }

    if (expiringWithinDays) {
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() + expiringWithinDays);
      where.expiryDate = { lte: expiryThreshold };
    }

    const validatedSortBy = validateSortBy(sortBy, ALLOWED_SORT_FIELDS, 'name');

    // For low stock, we need a raw query approach
    let items: any[];
    let total: number;

    if (lowStock && !outOfStock) {
      // Use raw query for comparing two columns
      const baseWhere = { ...where };
      delete baseWhere.quantityInStock;

      // Map sortBy to database column names
      const sortColumnMap: Record<string, string> = {
        name: 'name',
        sku: 'sku',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        quantityInStock: 'quantity_in_stock',
      };
      const sortColumn = sortColumnMap[validatedSortBy] || 'name';

      [items, total] = await Promise.all([
        this.prisma.$queryRaw<any[]>`
          SELECT i.*, c.name as category_name, s.name as supplier_name
          FROM inventory_items i
          LEFT JOIN inventory_categories c ON i.category_id = c.id
          LEFT JOIN suppliers s ON i.supplier_id = s.id
          WHERE i.tenant_id = ${tenantId}
            AND i.quantity_in_stock <= i.reorder_point
            ${active !== undefined ? Prisma.sql`AND i.active = ${active}` : Prisma.empty}
          ORDER BY i.${Prisma.raw(sortColumn)} ${Prisma.raw(sortOrder!.toUpperCase())}
          LIMIT ${limit} OFFSET ${skip}
        `,
        this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM inventory_items
          WHERE tenant_id = ${tenantId}
            AND quantity_in_stock <= reorder_point
            ${active !== undefined ? Prisma.sql`AND active = ${active}` : Prisma.empty}
        `.then((r) => Number(r[0]?.count ?? 0)),
      ]);
    } else {
      [items, total] = await Promise.all([
        this.prisma.inventoryItem.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [validatedSortBy]: sortOrder },
          include: {
            category: { select: { id: true, name: true } },
            supplier: { select: { id: true, name: true } },
          },
        }),
        this.prisma.inventoryItem.count({ where }),
      ]);
    }

    return {
      data: items,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(tenantId: string, id: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true, contactPerson: true, phone: true } },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }

  async getLowStockReport(tenantId: string) {
    const items = await this.prisma.$queryRaw<any[]>`
      SELECT i.id, i.sku, i.name, i.quantity_in_stock as "quantityInStock",
             i.reorder_point as "reorderPoint", i.reorder_quantity as "reorderQuantity",
             c.name as "categoryName", s.name as "supplierName"
      FROM inventory_items i
      LEFT JOIN inventory_categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.tenant_id = ${tenantId}
        AND i.active = true
        AND i.quantity_in_stock <= i.reorder_point
      ORDER BY (i.quantity_in_stock::float / NULLIF(i.reorder_point, 0)) ASC
    `;

    return {
      data: items,
      summary: {
        totalLowStock: items.length,
        outOfStock: items.filter((i) => i.quantityInStock === 0).length,
      },
    };
  }

  async getExpiringItems(tenantId: string, days: number = 30) {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + days);

    const items = await this.prisma.inventoryItem.findMany({
      where: {
        tenantId,
        active: true,
        expiryDate: { lte: expiryThreshold },
        quantityInStock: { gt: 0 },
      },
      orderBy: { expiryDate: 'asc' },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    const now = new Date();
    return {
      data: items.map((item) => ({
        ...item,
        daysUntilExpiry: item.expiryDate
          ? Math.ceil((item.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        isExpired: item.expiryDate ? item.expiryDate < now : false,
      })),
      summary: {
        total: items.length,
        expired: items.filter((i) => i.expiryDate && i.expiryDate < now).length,
        expiringThisWeek: items.filter((i) => {
          if (!i.expiryDate) return false;
          const daysLeft = Math.ceil(
            (i.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );
          return daysLeft >= 0 && daysLeft <= 7;
        }).length,
      },
    };
  }

  async create(tenantId: string, dto: CreateItemDto, actorId: string) {
    // Check SKU uniqueness
    const existingSku = await this.prisma.inventoryItem.findFirst({
      where: { tenantId, sku: dto.sku },
    });

    if (existingSku) {
      throw new ConflictException('SKU already exists');
    }

    const item = await this.prisma.inventoryItem.create({
      data: {
        tenantId,
        sku: dto.sku,
        barcode: dto.barcode,
        name: dto.name,
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        nameCkb: dto.nameCkb,
        nameKmr: dto.nameKmr,
        description: dto.description,
        categoryId: dto.categoryId,
        supplierId: dto.supplierId,
        unit: dto.unit ?? 'PIECES',
        quantityInStock: dto.quantityInStock ?? 0,
        reorderPoint: dto.reorderPoint ?? 10,
        reorderQuantity: dto.reorderQuantity ?? 50,
        costPrice: dto.costPrice ? new Prisma.Decimal(dto.costPrice) : null,
        sellingPrice: dto.sellingPrice ? new Prisma.Decimal(dto.sellingPrice) : null,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        location: dto.location,
        active: dto.active ?? true,
      },
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    // Create initial stock movement if quantity > 0
    if ((dto.quantityInStock ?? 0) > 0) {
      await this.prisma.inventoryMovement.create({
        data: {
          tenantId,
          itemId: item.id,
          type: MovementType.INITIAL,
          quantity: dto.quantityInStock!,
          quantityBefore: 0,
          quantityAfter: dto.quantityInStock!,
          unitCost: dto.costPrice ? new Prisma.Decimal(dto.costPrice) : null,
          notes: 'Initial stock',
          performedBy: actorId,
        },
      });
    }

    await this.activityService.create({
      tenantId,
      entityType: 'InventoryItem',
      entityId: item.id,
      action: 'created',
      actorId,
      metadata: { name: item.name, sku: item.sku },
    });

    return item;
  }

  async update(tenantId: string, id: string, dto: UpdateItemDto, actorId: string) {
    const existingItem = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!existingItem) {
      throw new NotFoundException('Item not found');
    }

    const updateData: any = { ...dto };

    if (dto.costPrice !== undefined) {
      updateData.costPrice = new Prisma.Decimal(dto.costPrice);
    }
    if (dto.sellingPrice !== undefined) {
      updateData.sellingPrice = new Prisma.Decimal(dto.sellingPrice);
    }
    if (dto.expiryDate !== undefined) {
      updateData.expiryDate = dto.expiryDate ? new Date(dto.expiryDate) : null;
    }

    const item = await this.prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'InventoryItem',
      entityId: item.id,
      action: 'updated',
      actorId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return item;
  }

  async adjustStock(tenantId: string, id: string, dto: AdjustStockDto, actorId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Calculate new quantity
    const increaseTypes: string[] = [
      MovementType.ADJUSTMENT_IN,
      MovementType.RETURN,
      MovementType.INITIAL,
    ];
    const isIncrease = increaseTypes.includes(dto.type);

    const quantityBefore = item.quantityInStock;
    const quantityAfter = isIncrease
      ? quantityBefore + dto.quantity
      : quantityBefore - dto.quantity;

    if (quantityAfter < 0) {
      throw new BadRequestException(
        `Cannot reduce stock below 0. Current: ${quantityBefore}, Requested: -${dto.quantity}`,
      );
    }

    // Update stock and create movement in transaction
    const [updatedItem, movement] = await this.prisma.$transaction([
      this.prisma.inventoryItem.update({
        where: { id },
        data: { quantityInStock: quantityAfter },
        include: {
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
        },
      }),
      this.prisma.inventoryMovement.create({
        data: {
          tenantId,
          itemId: id,
          type: dto.type as MovementType,
          quantity: dto.quantity,
          quantityBefore,
          quantityAfter,
          unitCost: dto.unitCost ? new Prisma.Decimal(dto.unitCost) : null,
          reference: dto.reference,
          notes: dto.notes,
          performedBy: actorId,
        },
      }),
    ]);

    // Check if low stock alert should be triggered
    if (quantityAfter <= item.reorderPoint && quantityBefore > item.reorderPoint) {
      await this.triggerLowStockAlert(tenantId, updatedItem);
    }

    await this.activityService.create({
      tenantId,
      entityType: 'InventoryItem',
      entityId: item.id,
      action: 'stock_adjusted',
      actorId,
      metadata: {
        type: dto.type,
        quantityBefore,
        quantityAfter,
        change: isIncrease ? dto.quantity : -dto.quantity,
      },
    });

    return {
      item: updatedItem,
      movement,
    };
  }

  async delete(tenantId: string, id: string, actorId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    // Soft delete by setting active to false
    await this.prisma.inventoryItem.update({
      where: { id },
      data: { active: false },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'InventoryItem',
      entityId: id,
      action: 'deleted',
      actorId,
      metadata: { name: item.name, sku: item.sku },
    });

    return { message: 'Item deleted successfully' };
  }

  private async triggerLowStockAlert(tenantId: string, item: any) {
    // Get users who should receive low stock alerts (ADMIN, MANAGER)
    const recipients = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: [Role.ADMIN, Role.MANAGER] },
        status: 'ACTIVE',
      },
      select: { id: true },
    });

    if (recipients.length > 0) {
      const event: LowStockAlertEvent = {
        tenantId,
        recipientUserIds: recipients.map((r) => r.id),
        entityType: 'InventoryItem',
        entityId: item.id,
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        currentQuantity: item.quantityInStock,
        reorderPoint: item.reorderPoint,
      };

      this.eventEmitter.emit(INVENTORY_EVENTS.LOW_STOCK_ALERT, event);
    }
  }
}
