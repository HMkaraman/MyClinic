import { NotificationType } from '@prisma/client';

// Event names
export const INVENTORY_EVENTS = {
  LOW_STOCK_ALERT: 'inventory.low_stock',
  STOCK_EXPIRED: 'inventory.stock_expired',
  PURCHASE_ORDER_APPROVED: 'inventory.po.approved',
  PURCHASE_ORDER_RECEIVED: 'inventory.po.received',
  STOCK_ADJUSTED: 'inventory.stock.adjusted',
} as const;

// Base event payload interface
export interface BaseInventoryEventPayload {
  tenantId: string;
  recipientUserIds: string[];
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

// Low Stock Alert
export interface LowStockAlertEvent extends BaseInventoryEventPayload {
  itemId: string;
  itemName: string;
  sku: string;
  currentQuantity: number;
  reorderPoint: number;
}

// Stock Expired
export interface StockExpiredEvent extends BaseInventoryEventPayload {
  itemId: string;
  itemName: string;
  sku: string;
  expiryDate: Date;
  quantity: number;
}

// Purchase Order Approved
export interface PurchaseOrderApprovedEvent extends BaseInventoryEventPayload {
  purchaseOrderId: string;
  orderNumber: string;
  supplierName: string;
  total: number;
  approvedById: string;
  approvedByName: string;
}

// Purchase Order Received
export interface PurchaseOrderReceivedEvent extends BaseInventoryEventPayload {
  purchaseOrderId: string;
  orderNumber: string;
  supplierName: string;
  itemsReceived: number;
  receivedById: string;
  receivedByName: string;
}

// Stock Adjusted
export interface StockAdjustedEvent extends BaseInventoryEventPayload {
  itemId: string;
  itemName: string;
  sku: string;
  adjustmentType: string;
  quantityBefore: number;
  quantityAfter: number;
  adjustedById: string;
  adjustedByName: string;
  reason?: string;
}

// Map notification type to preference field
export const INVENTORY_NOTIFICATION_PREFERENCE_MAP: Record<string, string> = {
  LOW_STOCK_ALERT: 'lowStockAlert',
  STOCK_EXPIRED: 'stockExpired',
  PURCHASE_ORDER_APPROVED: 'purchaseOrderApproved',
  PURCHASE_ORDER_RECEIVED: 'purchaseOrderReceived',
};
