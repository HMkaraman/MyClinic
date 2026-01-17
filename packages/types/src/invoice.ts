/**
 * Finance types - Invoices, Payments, Expenses
 */

import type { Timestamps, BranchEntity } from './common';

// ===========================================
// Invoice Status
// ===========================================
export const INVOICE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUS)[keyof typeof INVOICE_STATUS];

// ===========================================
// Payment Method
// ===========================================
export const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  ONLINE: 'ONLINE',
  OTHER: 'OTHER',
} as const;

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

// ===========================================
// Invoice Item
// ===========================================
export interface InvoiceItem {
  id: string;
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total: number;
}

// ===========================================
// Invoice
// ===========================================
export interface Invoice extends Timestamps, BranchEntity {
  id: string;
  invoiceNumber: string;
  patientId: string;
  appointmentId?: string;
  visitId?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount?: number;
  discountReason?: string;
  tax?: number;
  total: number;
  paidAmount: number;
  status: InvoiceStatus;
  dueDate?: Date;
  notes?: string;
}

export interface CreateInvoiceInput {
  patientId: string;
  branchId: string;
  appointmentId?: string;
  visitId?: string;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  discount?: number;
  discountReason?: string;
  tax?: number;
  dueDate?: Date;
  notes?: string;
}

// ===========================================
// Payment
// ===========================================
export interface Payment extends Timestamps {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdBy: string;
}

export interface CreatePaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

// ===========================================
// Expense
// ===========================================
export const EXPENSE_CATEGORY = {
  RENT: 'RENT',
  UTILITIES: 'UTILITIES',
  SUPPLIES: 'SUPPLIES',
  EQUIPMENT: 'EQUIPMENT',
  SALARIES: 'SALARIES',
  MARKETING: 'MARKETING',
  MAINTENANCE: 'MAINTENANCE',
  OTHER: 'OTHER',
} as const;

export type ExpenseCategory =
  (typeof EXPENSE_CATEGORY)[keyof typeof EXPENSE_CATEGORY];

export interface Expense extends Timestamps, BranchEntity {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date;
  receiptUrl?: string;
  createdBy: string;
}

export interface CreateExpenseInput {
  branchId: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: Date;
}

// ===========================================
// Reports
// ===========================================
export interface DailyReport {
  date: Date;
  branchId: string;
  totalInvoices: number;
  totalRevenue: number;
  totalPayments: number;
  totalExpenses: number;
  netIncome: number;
  appointmentsCount: number;
  newPatientsCount: number;
}
