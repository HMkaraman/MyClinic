import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, InvoiceStatus, Role } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  QueryInvoicesDto,
  AddPaymentDto,
  InvoiceItemDto,
} from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];
const CLOSED_INVOICE_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.PAID,
  InvoiceStatus.CANCELLED,
  InvoiceStatus.REFUNDED,
];
const PAYMENT_BLOCKED_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.CANCELLED,
  InvoiceStatus.REFUNDED,
];

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(user: JwtPayload, query: QueryInvoicesDto) {
    const {
      branchId,
      patientId,
      status,
      dateFrom,
      dateTo,
      search,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.InvoiceWhereInput = {};

    // Branch scoping
    if (branchId) {
      where.branchId = branchId;
    } else if (
      !ADMIN_ROLES.includes(user.role) &&
      user.branchIds.length > 0
    ) {
      where.branchId = { in: user.branchIds };
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.invoiceNumber = { contains: search, mode: 'insensitive' };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy!]: sortOrder },
        include: {
          patient: {
            select: { id: true, name: true, phone: true, fileNumber: true },
          },
          branch: {
            select: { id: true, name: true },
          },
          payments: {
            select: { id: true, amount: true, method: true, createdAt: true },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(user: JwtPayload, id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        appointment: {
          select: { id: true, scheduledAt: true },
        },
        visit: {
          select: { id: true, diagnosis: true },
        },
        payments: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Branch access check
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(invoice.branchId)
    ) {
      throw new ForbiddenException('Access denied to this invoice');
    }

    return invoice;
  }

  async getPatientInvoices(user: JwtPayload, patientId: string) {
    // Verify patient exists
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Branch access check for non-admin users
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(patient.branchId)
    ) {
      throw new ForbiddenException('Access denied to this patient');
    }

    const invoices = await this.prisma.invoice.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        branch: {
          select: { id: true, name: true },
        },
        payments: {
          select: { id: true, amount: true, method: true, createdAt: true },
        },
      },
    });

    return invoices;
  }

  async create(user: JwtPayload, dto: CreateInvoiceDto) {
    // Verify patient exists
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: dto.patientId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Branch access check
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(dto.branchId)
    ) {
      throw new ForbiddenException('Access denied to this branch');
    }

    // Calculate totals
    const { subtotal, items } = this.calculateSubtotal(dto.items);
    const discount = new Prisma.Decimal(dto.discount || 0);
    const tax = new Prisma.Decimal(dto.tax || 0);
    const total = subtotal.sub(discount).add(tax);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    const invoice = await this.prisma.invoice.create({
      data: {
        branchId: dto.branchId,
        patientId: dto.patientId,
        appointmentId: dto.appointmentId,
        visitId: dto.visitId,
        invoiceNumber,
        items: items as unknown as Prisma.InputJsonValue,
        subtotal,
        discount,
        discountReason: dto.discountReason,
        tax,
        total,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: dto.notes,
        status: InvoiceStatus.PENDING,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await this.activityService.logInvoiceActivity(invoice.id, 'created', user.sub, {
      invoiceNumber,
      total: total.toString(),
      patientName: patient.name,
    });

    // Also log to patient timeline
    await this.activityService.logPatientActivity(patient.id, 'invoice_created', user.sub, {
      invoiceId: invoice.id,
      invoiceNumber,
      total: total.toString(),
    });

    return invoice;
  }

  async update(user: JwtPayload, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findById(user, id);

    // Cannot update paid/cancelled invoices
    if (CLOSED_INVOICE_STATUSES.includes(invoice.status)) {
      throw new BadRequestException(
        `Cannot update invoice with status ${invoice.status}`,
      );
    }

    const updateData: Prisma.InvoiceUpdateInput = {};

    // Recalculate totals if items changed
    if (dto.items) {
      const { subtotal, items } = this.calculateSubtotal(dto.items);
      updateData.items = items as unknown as Prisma.InputJsonValue;
      updateData.subtotal = subtotal;

      const discount = new Prisma.Decimal(dto.discount ?? invoice.discount?.toNumber() ?? 0);
      const tax = new Prisma.Decimal(dto.tax ?? invoice.tax?.toNumber() ?? 0);
      updateData.total = subtotal.sub(discount).add(tax);
    } else if (dto.discount !== undefined || dto.tax !== undefined) {
      const subtotal = invoice.subtotal;
      const discount = new Prisma.Decimal(dto.discount ?? invoice.discount?.toNumber() ?? 0);
      const tax = new Prisma.Decimal(dto.tax ?? invoice.tax?.toNumber() ?? 0);
      updateData.total = subtotal.sub(discount).add(tax);
    }

    if (dto.discount !== undefined) {
      updateData.discount = new Prisma.Decimal(dto.discount);
    }

    if (dto.discountReason !== undefined) {
      updateData.discountReason = dto.discountReason;
    }

    if (dto.tax !== undefined) {
      updateData.tax = new Prisma.Decimal(dto.tax);
    }

    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    if (dto.status) {
      updateData.status = dto.status;
    }

    const updated = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        payments: {
          select: { id: true, amount: true, method: true, createdAt: true },
        },
      },
    });

    // Log activity
    await this.activityService.logInvoiceActivity(id, 'updated', user.sub, {
      updatedFields: Object.keys(dto),
    });

    return updated;
  }

  async addPayment(user: JwtPayload, invoiceId: string, dto: AddPaymentDto) {
    const invoice = await this.findById(user, invoiceId);

    // Cannot add payment to cancelled/refunded invoices
    if (PAYMENT_BLOCKED_STATUSES.includes(invoice.status)) {
      throw new BadRequestException(
        `Cannot add payment to invoice with status ${invoice.status}`,
      );
    }

    const paymentAmount = new Prisma.Decimal(dto.amount);
    const newPaidAmount = invoice.paidAmount.add(paymentAmount);

    // Check if payment exceeds remaining balance
    const remainingBalance = invoice.total.sub(invoice.paidAmount);
    if (paymentAmount.gt(remainingBalance)) {
      throw new BadRequestException(
        `Payment amount (${dto.amount}) exceeds remaining balance (${remainingBalance.toNumber()})`,
      );
    }

    // Determine new status
    let newStatus: InvoiceStatus;
    if (newPaidAmount.gte(invoice.total)) {
      newStatus = InvoiceStatus.PAID;
    } else if (newPaidAmount.gt(0)) {
      newStatus = InvoiceStatus.PARTIAL;
    } else {
      newStatus = invoice.status;
    }

    // Create payment and update invoice in transaction
    const [payment] = await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          method: dto.method,
          reference: dto.reference,
          notes: dto.notes,
          createdBy: user.sub,
        },
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      }),
    ]);

    // Log activity
    await this.activityService.logInvoiceActivity(invoiceId, 'payment_added', user.sub, {
      amount: dto.amount,
      method: dto.method,
      newStatus,
      paidAmount: newPaidAmount.toNumber(),
    });

    return {
      payment,
      invoice: {
        id: invoiceId,
        paidAmount: newPaidAmount.toNumber(),
        status: newStatus,
        remainingBalance: invoice.total.sub(newPaidAmount).toNumber(),
      },
    };
  }

  private calculateSubtotal(items: InvoiceItemDto[]): {
    subtotal: Prisma.Decimal;
    items: Array<InvoiceItemDto & { total: number }>;
  } {
    let subtotal = new Prisma.Decimal(0);
    const processedItems = items.map((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal = subtotal.add(itemTotal);
      return { ...item, total: itemTotal };
    });

    return { subtotal, items: processedItems };
  }

  private async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Get count of invoices this month
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59, 999);

    const count = await this.prisma.invoice.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    // Format: INV-YYYYMM-XXXXX (INV-202601-00001)
    const sequence = (count + 1).toString().padStart(5, '0');
    return `INV-${year}${month}-${sequence}`;
  }
}
