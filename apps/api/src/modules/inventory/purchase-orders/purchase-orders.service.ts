import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, PurchaseOrderStatus, MovementType, Role, SequenceType } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';
import { ActivityService } from '../../activity/activity.service';
import { SequencesService } from '../../sequences/sequences.service';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceiveItemsDto,
  QueryPurchaseOrdersDto,
} from './dto';
import {
  INVENTORY_EVENTS,
  PurchaseOrderApprovedEvent,
  PurchaseOrderReceivedEvent,
} from '../events/inventory.events';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private sequencesService: SequencesService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(tenantId: string, query: QueryPurchaseOrdersDto) {
    const { search, supplierId, status, startDate, endDate, page, limit, sortBy, sortOrder } =
      query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.PurchaseOrderWhereInput = { tenantId };

    if (search) {
      where.orderNumber = { contains: search, mode: 'insensitive' };
    }

    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }

    const [orders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy!]: sortOrder },
        include: {
          supplier: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(tenantId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        creator: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } },
        items: {
          include: {
            item: { select: { id: true, sku: true, name: true, unit: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    return order;
  }

  async create(tenantId: string, dto: CreatePurchaseOrderDto, actorId: string) {
    // Validate supplier exists
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: dto.supplierId, tenantId },
    });

    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }

    // Validate all items exist
    const itemIds = dto.items.map((i) => i.itemId);
    const items = await this.prisma.inventoryItem.findMany({
      where: { id: { in: itemIds }, tenantId },
    });

    if (items.length !== itemIds.length) {
      throw new BadRequestException('One or more items not found');
    }

    // Generate order number
    const orderNumber = await this.sequencesService.generatePurchaseOrderNumber(tenantId);

    // Calculate totals
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const tax = dto.tax ?? 0;
    const shipping = dto.shipping ?? 0;
    const total = subtotal + tax + shipping;

    // Create order with items
    const order = await this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: dto.supplierId,
        orderNumber,
        orderDate: new Date(dto.orderDate),
        expectedDate: dto.expectedDate ? new Date(dto.expectedDate) : null,
        subtotal: new Prisma.Decimal(subtotal),
        tax: new Prisma.Decimal(tax),
        shipping: new Prisma.Decimal(shipping),
        total: new Prisma.Decimal(total),
        notes: dto.notes,
        createdBy: actorId,
        status: PurchaseOrderStatus.DRAFT,
        items: {
          create: dto.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitCost: new Prisma.Decimal(item.unitCost),
            total: new Prisma.Decimal(item.quantity * item.unitCost),
          })),
        },
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            item: { select: { id: true, sku: true, name: true } },
          },
        },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'PurchaseOrder',
      entityId: order.id,
      action: 'created',
      actorId,
      metadata: { orderNumber, total },
    });

    return order;
  }

  async update(tenantId: string, id: string, dto: UpdatePurchaseOrderDto, actorId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Can only update draft orders');
    }

    const updateData: any = { ...dto };

    if (dto.orderDate) updateData.orderDate = new Date(dto.orderDate);
    if (dto.expectedDate) updateData.expectedDate = new Date(dto.expectedDate);
    if (dto.tax !== undefined) updateData.tax = new Prisma.Decimal(dto.tax);
    if (dto.shipping !== undefined) updateData.shipping = new Prisma.Decimal(dto.shipping);

    // Recalculate total if tax or shipping changed
    if (dto.tax !== undefined || dto.shipping !== undefined) {
      const newTax = dto.tax !== undefined ? dto.tax : Number(order.tax ?? 0);
      const newShipping = dto.shipping !== undefined ? dto.shipping : Number(order.shipping ?? 0);
      updateData.total = new Prisma.Decimal(Number(order.subtotal) + newTax + newShipping);
    }

    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            item: { select: { id: true, sku: true, name: true } },
          },
        },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'PurchaseOrder',
      entityId: order.id,
      action: 'updated',
      actorId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return updatedOrder;
  }

  async submitForApproval(tenantId: string, id: string, actorId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    if (order.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException('Can only submit draft orders for approval');
    }

    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.PENDING_APPROVAL },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'PurchaseOrder',
      entityId: order.id,
      action: 'submitted_for_approval',
      actorId,
      metadata: { orderNumber: order.orderNumber },
    });

    return updatedOrder;
  }

  async approve(tenantId: string, id: string, actorId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { supplier: true },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    if (order.status !== PurchaseOrderStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Can only approve orders pending approval');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true },
    });

    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: PurchaseOrderStatus.APPROVED,
        approvedBy: actorId,
        approvedAt: new Date(),
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    // Emit approval event
    const recipients = await this.getNotificationRecipients(tenantId);
    if (recipients.length > 0) {
      const event: PurchaseOrderApprovedEvent = {
        tenantId,
        recipientUserIds: recipients,
        entityType: 'PurchaseOrder',
        entityId: order.id,
        purchaseOrderId: order.id,
        orderNumber: order.orderNumber,
        supplierName: order.supplier.name,
        total: Number(order.total),
        approvedById: actorId,
        approvedByName: user?.name ?? 'Unknown',
      };
      this.eventEmitter.emit(INVENTORY_EVENTS.PURCHASE_ORDER_APPROVED, event);
    }

    await this.activityService.create({
      tenantId,
      entityType: 'PurchaseOrder',
      entityId: order.id,
      action: 'approved',
      actorId,
      metadata: { orderNumber: order.orderNumber },
    });

    return updatedOrder;
  }

  async markOrdered(tenantId: string, id: string, actorId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    if (order.status !== PurchaseOrderStatus.APPROVED) {
      throw new BadRequestException('Can only mark approved orders as ordered');
    }

    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.ORDERED },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'PurchaseOrder',
      entityId: order.id,
      action: 'marked_ordered',
      actorId,
      metadata: { orderNumber: order.orderNumber },
    });

    return updatedOrder;
  }

  async receiveItems(tenantId: string, id: string, dto: ReceiveItemsDto, actorId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        items: {
          include: { item: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    const receivableStatuses: PurchaseOrderStatus[] = [
      PurchaseOrderStatus.ORDERED,
      PurchaseOrderStatus.APPROVED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ];
    if (!receivableStatuses.includes(order.status)) {
      throw new BadRequestException('Cannot receive items for this order');
    }

    // Validate and process each item
    const operations: Prisma.PrismaPromise<any>[] = [];
    let totalReceived = 0;
    let totalExpected = 0;

    for (const receiveItem of dto.items) {
      const orderItem = order.items.find((i) => i.id === receiveItem.purchaseOrderItemId);

      if (!orderItem) {
        throw new BadRequestException(
          `Order item not found: ${receiveItem.purchaseOrderItemId}`,
        );
      }

      const newReceivedQuantity = orderItem.receivedQuantity + receiveItem.quantityReceived;
      if (newReceivedQuantity > orderItem.quantity) {
        throw new BadRequestException(
          `Cannot receive more than ordered for item ${orderItem.item.name}`,
        );
      }

      // Update order item
      operations.push(
        this.prisma.purchaseOrderItem.update({
          where: { id: orderItem.id },
          data: { receivedQuantity: newReceivedQuantity },
        }),
      );

      // Update inventory stock
      const currentStock = orderItem.item.quantityInStock;
      const newStock = currentStock + receiveItem.quantityReceived;

      operations.push(
        this.prisma.inventoryItem.update({
          where: { id: orderItem.itemId },
          data: { quantityInStock: newStock },
        }),
      );

      // Create inventory movement
      operations.push(
        this.prisma.inventoryMovement.create({
          data: {
            tenantId,
            itemId: orderItem.itemId,
            type: MovementType.PURCHASE,
            quantity: receiveItem.quantityReceived,
            quantityBefore: currentStock,
            quantityAfter: newStock,
            unitCost: orderItem.unitCost,
            reference: order.orderNumber,
            referenceId: order.id,
            notes: dto.notes,
            performedBy: actorId,
          },
        }),
      );

      totalReceived += newReceivedQuantity;
      totalExpected += orderItem.quantity;
    }

    // Execute all operations
    await this.prisma.$transaction(operations);

    // Recalculate total received across all items
    const updatedOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    const allReceived = updatedOrder!.items.every((i) => i.receivedQuantity >= i.quantity);
    const someReceived = updatedOrder!.items.some((i) => i.receivedQuantity > 0);

    const newStatus = allReceived
      ? PurchaseOrderStatus.RECEIVED
      : someReceived
        ? PurchaseOrderStatus.PARTIALLY_RECEIVED
        : order.status;

    // Update order status
    const user = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: { name: true },
    });

    const finalOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        receivedBy: actorId,
        receivedAt: new Date(),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: {
          include: {
            item: { select: { id: true, sku: true, name: true } },
          },
        },
      },
    });

    // Emit received event if fully received
    if (newStatus === PurchaseOrderStatus.RECEIVED) {
      const recipients = await this.getNotificationRecipients(tenantId);
      if (recipients.length > 0) {
        const event: PurchaseOrderReceivedEvent = {
          tenantId,
          recipientUserIds: recipients,
          entityType: 'PurchaseOrder',
          entityId: order.id,
          purchaseOrderId: order.id,
          orderNumber: order.orderNumber,
          supplierName: order.supplier.name,
          itemsReceived: dto.items.length,
          receivedById: actorId,
          receivedByName: user?.name ?? 'Unknown',
        };
        this.eventEmitter.emit(INVENTORY_EVENTS.PURCHASE_ORDER_RECEIVED, event);
      }
    }

    await this.activityService.create({
      tenantId,
      entityType: 'PurchaseOrder',
      entityId: order.id,
      action: 'items_received',
      actorId,
      metadata: {
        orderNumber: order.orderNumber,
        itemsReceived: dto.items.length,
        status: newStatus,
      },
    });

    return finalOrder;
  }

  async cancel(tenantId: string, id: string, actorId: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }

    const nonCancellableStatuses: PurchaseOrderStatus[] = [
      PurchaseOrderStatus.RECEIVED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ];
    if (nonCancellableStatuses.includes(order.status)) {
      throw new BadRequestException('Cannot cancel orders that have received items');
    }

    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
      include: {
        supplier: { select: { id: true, name: true } },
      },
    });

    await this.activityService.create({
      tenantId,
      entityType: 'PurchaseOrder',
      entityId: order.id,
      action: 'cancelled',
      actorId,
      metadata: { orderNumber: order.orderNumber },
    });

    return updatedOrder;
  }

  private async getNotificationRecipients(tenantId: string): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: [Role.ADMIN, Role.MANAGER] },
        status: 'ACTIVE',
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }
}
