import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InvoiceStatus, Role } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { InvoicesService } from './invoices.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { SequencesService } from '../sequences/sequences.service';
import { MockPrismaService } from '../../../test/mocks';
import {
  createAdminPayload,
  createDoctorPayload,
  createReceptionPayload,
  createJwtPayload,
  createPatient,
} from '../../../test/factories';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: MockPrismaService;
  let activityService: jest.Mocked<ActivityService>;
  let sequencesService: jest.Mocked<SequencesService>;

  const createInvoice = (overrides: Partial<any> = {}) => ({
    id: 'test-invoice-id',
    tenantId: 'test-tenant-id',
    branchId: 'test-branch-id',
    patientId: 'test-patient-id',
    invoiceNumber: 'INV-202601-00001',
    items: [{ name: 'Consultation', quantity: 1, unitPrice: 100, total: 100 }],
    subtotal: new Prisma.Decimal(100),
    discount: new Prisma.Decimal(0),
    tax: new Prisma.Decimal(0),
    total: new Prisma.Decimal(100),
    paidAmount: new Prisma.Decimal(0),
    status: InvoiceStatus.PENDING,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: {
      id: 'test-patient-id',
      name: 'Test Patient',
      phone: '+1234567890',
      fileNumber: 'P-20260118-00001',
    },
    branch: {
      id: 'test-branch-id',
      name: 'Test Branch',
    },
    payments: [],
    ...overrides,
  });

  beforeEach(async () => {
    prisma = new MockPrismaService();
    activityService = {
      logInvoiceActivity: jest.fn().mockResolvedValue(undefined),
      logPatientActivity: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ActivityService>;
    sequencesService = {
      generateInvoiceNumber: jest.fn().mockResolvedValue('INV-202601-00001'),
    } as unknown as jest.Mocked<SequencesService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: activityService },
        { provide: SequencesService, useValue: sequencesService },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  afterEach(() => {
    prisma.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated invoices for admin', async () => {
      const invoices = [createInvoice(), createInvoice({ id: 'inv-2' })];
      prisma.invoice.findMany.mockResolvedValue(invoices);
      prisma.invoice.count.mockResolvedValue(2);

      const result = await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by branch for non-admin users', async () => {
      const user = createReceptionPayload({ branchIds: ['branch-1'] });
      prisma.invoice.findMany.mockResolvedValue([]);
      prisma.invoice.count.mockResolvedValue(0);

      await service.findAll(user, { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'asc' });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: { in: ['branch-1'] },
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);
      prisma.invoice.count.mockResolvedValue(0);

      await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        status: InvoiceStatus.PENDING,
      });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: InvoiceStatus.PENDING,
          }),
        }),
      );
    });

    it('should search by invoice number', async () => {
      prisma.invoice.findMany.mockResolvedValue([]);
      prisma.invoice.count.mockResolvedValue(0);

      await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        search: 'INV-202601',
      });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            invoiceNumber: { contains: 'INV-202601', mode: 'insensitive' },
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return invoice by id', async () => {
      const invoice = createInvoice();
      prisma.invoice.findFirst.mockResolvedValue(invoice);

      const result = await service.findById(createAdminPayload(), invoice.id);

      expect(result.id).toBe(invoice.id);
    });

    it('should throw NotFoundException for non-existent invoice', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.findById(createAdminPayload(), 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized branch access', async () => {
      const invoice = createInvoice({ branchId: 'other-branch' });
      prisma.invoice.findFirst.mockResolvedValue(invoice);

      const user = createReceptionPayload({ branchIds: ['my-branch'] });

      await expect(service.findById(user, invoice.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    const createDto = {
      branchId: 'test-branch-id',
      patientId: 'test-patient-id',
      items: [{ description: 'Consultation', quantity: 1, unitPrice: 100 }],
    };

    it('should create invoice successfully', async () => {
      const user = createAdminPayload({ branchIds: ['test-branch-id'] });
      const patient = createPatient({ tenantId: user.tenantId });
      const invoice = createInvoice();

      prisma.patient.findFirst.mockResolvedValue(patient);
      prisma.invoice.count.mockResolvedValue(0);
      prisma.invoice.create.mockResolvedValue(invoice);

      const result = await service.create(user, createDto);

      expect(result.id).toBe(invoice.id);
      expect(activityService.logInvoiceActivity).toHaveBeenCalled();
      expect(activityService.logPatientActivity).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.create(createAdminPayload(), createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized branch', async () => {
      const user = createReceptionPayload({ branchIds: ['other-branch'] });
      prisma.patient.findFirst.mockResolvedValue(createPatient());

      await expect(service.create(user, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should calculate totals correctly with discount and tax', async () => {
      const user = createAdminPayload({ branchIds: ['test-branch-id'] });
      const patient = createPatient({ tenantId: user.tenantId });

      prisma.patient.findFirst.mockResolvedValue(patient);
      prisma.invoice.count.mockResolvedValue(0);
      prisma.invoice.create.mockImplementation(async ({ data }) => ({
        ...createInvoice(),
        subtotal: data.subtotal,
        discount: data.discount,
        tax: data.tax,
        total: data.total,
      }));

      const result = await service.create(user, {
        ...createDto,
        items: [
          { description: 'Service 1', quantity: 2, unitPrice: 50 },
          { description: 'Service 2', quantity: 1, unitPrice: 100 },
        ],
        discount: 20,
        tax: 10,
      });

      expect(prisma.invoice.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: new Prisma.Decimal(200), // 2*50 + 1*100
            discount: new Prisma.Decimal(20),
            tax: new Prisma.Decimal(10),
            total: new Prisma.Decimal(190), // 200 - 20 + 10
          }),
        }),
      );
    });
  });

  describe('update', () => {
    it('should update invoice successfully', async () => {
      const invoice = createInvoice();
      prisma.invoice.findFirst.mockResolvedValue(invoice);
      prisma.invoice.update.mockResolvedValue({
        ...invoice,
        notes: 'Updated notes',
      });

      const result = await service.update(createAdminPayload(), invoice.id, {
        notes: 'Updated notes',
      });

      expect(result.notes).toBe('Updated notes');
    });

    it('should throw BadRequestException for paid invoice', async () => {
      const invoice = createInvoice({ status: InvoiceStatus.PAID });
      prisma.invoice.findFirst.mockResolvedValue(invoice);

      await expect(
        service.update(createAdminPayload(), invoice.id, { notes: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for cancelled invoice', async () => {
      const invoice = createInvoice({ status: InvoiceStatus.CANCELLED });
      prisma.invoice.findFirst.mockResolvedValue(invoice);

      await expect(
        service.update(createAdminPayload(), invoice.id, { notes: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should recalculate total when discount changes', async () => {
      const invoice = createInvoice({
        subtotal: new Prisma.Decimal(100),
        discount: new Prisma.Decimal(0),
        tax: new Prisma.Decimal(0),
        total: new Prisma.Decimal(100),
      });
      prisma.invoice.findFirst.mockResolvedValue(invoice);
      prisma.invoice.update.mockImplementation(async ({ data }) => ({
        ...invoice,
        ...data,
      }));

      await service.update(createAdminPayload(), invoice.id, {
        discount: 10,
      });

      expect(prisma.invoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            discount: new Prisma.Decimal(10),
            total: new Prisma.Decimal(90),
          }),
        }),
      );
    });
  });

  describe('addPayment', () => {
    it('should add payment successfully', async () => {
      const invoice = createInvoice({
        total: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(0),
      });
      const payment = {
        id: 'payment-1',
        invoiceId: invoice.id,
        amount: new Prisma.Decimal(50),
        method: 'CASH',
        user: { id: 'user-1', name: 'Test User' },
      };

      prisma.invoice.findFirst.mockResolvedValue(invoice);
      prisma.$transaction.mockResolvedValue([payment, invoice]);

      const result = await service.addPayment(createAdminPayload(), invoice.id, {
        amount: 50,
        method: 'CASH',
      });

      expect(result.payment).toBeDefined();
      expect(result.invoice.paidAmount).toBe(50);
    });

    it('should update status to PARTIAL when partially paid', async () => {
      const invoice = createInvoice({
        total: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(0),
        status: InvoiceStatus.PENDING,
      });

      prisma.invoice.findFirst.mockResolvedValue(invoice);
      prisma.$transaction.mockResolvedValue([
        { id: 'payment-1', amount: new Prisma.Decimal(50) },
        { ...invoice, paidAmount: new Prisma.Decimal(50), status: InvoiceStatus.PARTIAL },
      ]);

      const result = await service.addPayment(createAdminPayload(), invoice.id, {
        amount: 50,
        method: 'CASH',
      });

      expect(result.invoice.status).toBe(InvoiceStatus.PARTIAL);
    });

    it('should update status to PAID when fully paid', async () => {
      const invoice = createInvoice({
        total: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(50),
        status: InvoiceStatus.PARTIAL,
      });

      prisma.invoice.findFirst.mockResolvedValue(invoice);
      prisma.$transaction.mockResolvedValue([
        { id: 'payment-1', amount: new Prisma.Decimal(50) },
        { ...invoice, paidAmount: new Prisma.Decimal(100), status: InvoiceStatus.PAID },
      ]);

      const result = await service.addPayment(createAdminPayload(), invoice.id, {
        amount: 50,
        method: 'CASH',
      });

      expect(result.invoice.status).toBe(InvoiceStatus.PAID);
    });

    it('should throw BadRequestException for cancelled invoice', async () => {
      const invoice = createInvoice({ status: InvoiceStatus.CANCELLED });
      prisma.invoice.findFirst.mockResolvedValue(invoice);

      await expect(
        service.addPayment(createAdminPayload(), invoice.id, {
          amount: 50,
          method: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when payment exceeds balance', async () => {
      const invoice = createInvoice({
        total: new Prisma.Decimal(100),
        paidAmount: new Prisma.Decimal(80),
      });
      prisma.invoice.findFirst.mockResolvedValue(invoice);

      await expect(
        service.addPayment(createAdminPayload(), invoice.id, {
          amount: 50, // Exceeds remaining 20
          method: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPatientInvoices', () => {
    it('should return invoices for a patient', async () => {
      const patient = createPatient();
      const invoices = [createInvoice(), createInvoice({ id: 'inv-2' })];

      prisma.patient.findFirst.mockResolvedValue(patient);
      prisma.invoice.findMany.mockResolvedValue(invoices);

      const result = await service.getPatientInvoices(createAdminPayload(), patient.id);

      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException for non-existent patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.getPatientInvoices(createAdminPayload(), 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized branch access', async () => {
      const patient = createPatient({ branchId: 'other-branch' });
      prisma.patient.findFirst.mockResolvedValue(patient);

      const user = createReceptionPayload({ branchIds: ['my-branch'] });

      await expect(
        service.getPatientInvoices(user, patient.id),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
