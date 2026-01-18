import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { Gender, PatientSource, Role } from '@prisma/client';

import { PatientsService } from './patients.service';
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
  createDeletedPatient,
} from '../../../test/factories';

describe('PatientsService', () => {
  let service: PatientsService;
  let prisma: MockPrismaService;
  let activityService: jest.Mocked<ActivityService>;
  let sequencesService: jest.Mocked<SequencesService>;

  beforeEach(async () => {
    prisma = new MockPrismaService();
    activityService = {
      logPatientActivity: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ActivityService>;
    sequencesService = {
      generatePatientFileNumber: jest.fn().mockResolvedValue('P-20260118-00001'),
    } as unknown as jest.Mocked<SequencesService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: activityService },
        { provide: SequencesService, useValue: sequencesService },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  afterEach(() => {
    prisma.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated patients for admin', async () => {
      const patients = [createPatient(), createPatient({ id: 'patient-2' })];
      prisma.patient.findMany.mockResolvedValue(patients);
      prisma.patient.count.mockResolvedValue(2);

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
      const user = createDoctorPayload({ branchIds: ['branch-1'] });
      prisma.patient.findMany.mockResolvedValue([]);
      prisma.patient.count.mockResolvedValue(0);

      await service.findAll(user, { page: 1, limit: 10, sortBy: 'createdAt', sortOrder: 'asc' });

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: { in: ['branch-1'] },
          }),
        }),
      );
    });

    it('should search by name, phone, or file number', async () => {
      prisma.patient.findMany.mockResolvedValue([]);
      prisma.patient.count.mockResolvedValue(0);

      await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        search: 'John',
      });

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'John', mode: 'insensitive' } },
              { phone: { contains: 'John' } },
              { fileNumber: { contains: 'John', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });

    it('should exclude deleted patients by default', async () => {
      prisma.patient.findMany.mockResolvedValue([]);
      prisma.patient.count.mockResolvedValue(0);

      await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('should include deleted patients when requested', async () => {
      prisma.patient.findMany.mockResolvedValue([]);
      prisma.patient.count.mockResolvedValue(0);

      await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        includeDeleted: true,
      });

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            deletedAt: null,
          }),
        }),
      );
    });

    it('should filter by gender', async () => {
      prisma.patient.findMany.mockResolvedValue([]);
      prisma.patient.count.mockResolvedValue(0);

      await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'asc',
        gender: Gender.FEMALE,
      });

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            gender: Gender.FEMALE,
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return patient by id', async () => {
      const patient = createPatient();
      prisma.patient.findFirst.mockResolvedValue(patient);

      const result = await service.findById(createAdminPayload(), patient.id);

      expect(result.id).toBe(patient.id);
    });

    it('should throw NotFoundException for non-existent patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.findById(createAdminPayload(), 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized branch access', async () => {
      const patient = createPatient({ branchId: 'other-branch' });
      prisma.patient.findFirst.mockResolvedValue(patient);

      const user = createDoctorPayload({ branchIds: ['my-branch'] });

      await expect(service.findById(user, patient.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow admin to access any branch', async () => {
      const patient = createPatient({ branchId: 'any-branch' });
      prisma.patient.findFirst.mockResolvedValue(patient);

      const result = await service.findById(createAdminPayload(), patient.id);

      expect(result.id).toBe(patient.id);
    });
  });

  describe('search', () => {
    it('should return matching patients', async () => {
      const patients = [
        { id: 'p1', name: 'John Doe', phone: '+123', fileNumber: 'P-001', branch: { id: 'b1', name: 'Branch' } },
      ];
      prisma.patient.findMany.mockResolvedValue(patients);

      const result = await service.search(createAdminPayload(), 'John');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('John Doe');
    });

    it('should limit results to 10', async () => {
      prisma.patient.findMany.mockResolvedValue([]);

      await service.search(createAdminPayload(), 'test');

      expect(prisma.patient.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });

  describe('create', () => {
    const createDto = {
      branchId: 'test-branch-id',
      name: 'New Patient',
      phone: '+1234567890',
      gender: Gender.MALE,
      source: PatientSource.WALK_IN,
    };

    it('should create patient successfully', async () => {
      const user = createAdminPayload({ branchIds: ['test-branch-id'] });
      const patient = createPatient();

      prisma.patient.findFirst.mockResolvedValue(null); // No duplicate
      prisma.patient.count.mockResolvedValue(0);
      prisma.patient.create.mockResolvedValue(patient);

      const result = await service.create(user, createDto);

      expect(result.id).toBe(patient.id);
      expect(activityService.logPatientActivity).toHaveBeenCalled();
    });

    it('should generate unique file number using SequencesService', async () => {
      const user = createAdminPayload({ branchIds: ['test-branch-id'] });

      prisma.patient.findFirst.mockResolvedValue(null);
      prisma.patient.create.mockImplementation(async ({ data }) => ({
        ...createPatient(),
        fileNumber: data.fileNumber,
      }));

      const result = await service.create(user, createDto);

      expect(sequencesService.generatePatientFileNumber).toHaveBeenCalledWith(user.tenantId);
      expect(result.fileNumber).toBe('P-20260118-00001');
    });

    it('should throw ConflictException for duplicate phone', async () => {
      const user = createAdminPayload();
      const existingPatient = createPatient({ phone: '+1234567890', fileNumber: 'P-001' });
      prisma.patient.findFirst.mockResolvedValue(existingPatient);

      await expect(service.create(user, createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException for unauthorized branch', async () => {
      const user = createReceptionPayload({ branchIds: ['other-branch'] });
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(service.create(user, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update patient successfully', async () => {
      const patient = createPatient();
      prisma.patient.findFirst.mockResolvedValue(patient);
      prisma.patient.update.mockResolvedValue({
        ...patient,
        name: 'Updated Name',
      });

      const user = createAdminPayload({ branchIds: [patient.branchId] });
      const result = await service.update(user, patient.id, { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
      expect(activityService.logPatientActivity).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.update(createAdminPayload(), 'non-existent', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when changing to duplicate phone', async () => {
      const existingPatient = createPatient({ phone: '+111111111' });
      const duplicatePatient = createPatient({ id: 'other', phone: '+222222222' });

      prisma.patient.findFirst
        .mockResolvedValueOnce(existingPatient) // First call - find existing
        .mockResolvedValueOnce(duplicatePatient); // Second call - check duplicate

      await expect(
        service.update(createAdminPayload(), existingPatient.id, { phone: '+222222222' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException for unauthorized branch access', async () => {
      const patient = createPatient({ branchId: 'other-branch' });
      prisma.patient.findFirst.mockResolvedValue(patient);

      const user = createReceptionPayload({ branchIds: ['my-branch'] });

      await expect(
        service.update(user, patient.id, { name: 'Test' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should soft delete patient', async () => {
      const patient = createPatient();
      const user = createAdminPayload();
      prisma.patient.findFirst.mockResolvedValue(patient);
      prisma.patient.update.mockResolvedValue({
        ...patient,
        deletedAt: new Date(),
      });

      const result = await service.delete(user, patient.id);

      expect(result.message).toBe('Patient deleted successfully');
      expect(prisma.patient.update).toHaveBeenCalledWith({
        where: { id: patient.id },
        data: { deletedAt: expect.any(Date) },
      });
      expect(activityService.logPatientActivity).toHaveBeenCalledWith(
        user.tenantId,
        patient.id,
        'deleted',
        expect.any(String),
        expect.any(Object),
      );
    });

    it('should throw NotFoundException for non-existent patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.delete(createAdminPayload(), 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for already deleted patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(null); // Already filtered by deletedAt: null

      await expect(
        service.delete(createAdminPayload(), 'deleted-patient'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
