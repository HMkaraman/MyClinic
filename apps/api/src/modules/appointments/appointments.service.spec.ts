import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppointmentStatus, Role } from '@prisma/client';

import { AppointmentsService } from './appointments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { MockPrismaService } from '../../../test/mocks';
import {
  createAdminPayload,
  createDoctorPayload,
  createReceptionPayload,
  createJwtPayload,
  createPatient,
  createUser,
  createAppointment,
  createConfirmedAppointment,
  createCompletedAppointment,
  createCancelledAppointment,
} from '../../../test/factories';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let prisma: MockPrismaService;
  let activityService: jest.Mocked<ActivityService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(async () => {
    prisma = new MockPrismaService();
    activityService = {
      logAppointmentActivity: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ActivityService>;
    eventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: ActivityService, useValue: activityService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
  });

  afterEach(() => {
    prisma.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated appointments for admin', async () => {
      const appointments = [createAppointment(), createAppointment({ id: 'apt-2' })];
      prisma.appointment.findMany.mockResolvedValue(appointments);
      prisma.appointment.count.mockResolvedValue(2);

      const result = await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'scheduledAt',
        sortOrder: 'desc',
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
      expect(result.meta.page).toBe(1);
    });

    it('should filter by branch for non-admin users', async () => {
      const user = createDoctorPayload({ branchIds: ['branch-1'] });
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.count.mockResolvedValue(0);

      await service.findAll(user, { page: 1, limit: 10, sortBy: 'scheduledAt', sortOrder: 'asc' });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            branchId: { in: ['branch-1'] },
            doctorId: user.sub,
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.count.mockResolvedValue(0);

      await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'scheduledAt',
        sortOrder: 'asc',
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scheduledAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);
      prisma.appointment.count.mockResolvedValue(0);

      await service.findAll(createAdminPayload(), {
        page: 1,
        limit: 10,
        sortBy: 'scheduledAt',
        sortOrder: 'asc',
        status: AppointmentStatus.CONFIRMED,
      });

      expect(prisma.appointment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: AppointmentStatus.CONFIRMED,
          }),
        }),
      );
    });
  });

  describe('findById', () => {
    it('should return appointment by id', async () => {
      const appointment = createAppointment();
      prisma.appointment.findFirst.mockResolvedValue(appointment);

      const result = await service.findById(createAdminPayload(), appointment.id);

      expect(result.id).toBe(appointment.id);
    });

    it('should throw NotFoundException for non-existent appointment', async () => {
      prisma.appointment.findFirst.mockResolvedValue(null);

      await expect(
        service.findById(createAdminPayload(), 'non-existent'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized branch access', async () => {
      const appointment = createAppointment({ branchId: 'other-branch' });
      prisma.appointment.findFirst.mockResolvedValue(appointment);

      const user = createDoctorPayload({
        sub: 'other-doctor',
        branchIds: ['my-branch'],
      });

      await expect(service.findById(user, appointment.id)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow doctor to view their own appointments', async () => {
      const doctorId = 'test-doctor';
      const appointment = createAppointment({
        branchId: 'other-branch',
        doctorId,
      });
      prisma.appointment.findFirst.mockResolvedValue(appointment);

      const user = createDoctorPayload({ sub: doctorId, branchIds: ['my-branch'] });

      const result = await service.findById(user, appointment.id);
      expect(result.id).toBe(appointment.id);
    });
  });

  describe('create', () => {
    const createDto = {
      branchId: 'test-branch-id',
      patientId: 'test-patient-id',
      doctorId: 'test-doctor-id',
      serviceId: 'test-service-id',
      scheduledAt: new Date().toISOString(),
      durationMinutes: 30,
    };

    it('should create appointment successfully', async () => {
      const user = createAdminPayload({ branchIds: ['test-branch-id'] });
      const patient = createPatient({ tenantId: user.tenantId });
      const doctor = createUser({ id: 'test-doctor-id', role: Role.DOCTOR, tenantId: user.tenantId });
      const mockService = { id: 'test-service-id', tenantId: user.tenantId, active: true, durationMinutes: 30 };
      const appointment = createAppointment();

      prisma.patient.findFirst.mockResolvedValue(patient);
      prisma.user.findFirst.mockResolvedValue(doctor);
      prisma.service.findFirst.mockResolvedValue(mockService);
      prisma.appointment.create.mockResolvedValue(appointment);

      const result = await service.create(user, createDto);

      expect(result.id).toBe(appointment.id);
      expect(activityService.logAppointmentActivity).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent patient', async () => {
      prisma.patient.findFirst.mockResolvedValue(null);

      await expect(
        service.create(createAdminPayload(), createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for non-existent doctor', async () => {
      prisma.patient.findFirst.mockResolvedValue(createPatient());
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(
        service.create(createAdminPayload(), createDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException for unauthorized branch', async () => {
      const user = createReceptionPayload({ branchIds: ['other-branch'] });
      prisma.patient.findFirst.mockResolvedValue(createPatient());
      prisma.user.findFirst.mockResolvedValue(createUser({ role: Role.DOCTOR }));
      prisma.service.findFirst.mockResolvedValue({ id: 'test', active: true });

      await expect(service.create(user, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update appointment successfully', async () => {
      const appointment = createConfirmedAppointment();
      prisma.appointment.findFirst.mockResolvedValue(appointment);
      prisma.appointment.update.mockResolvedValue({
        ...appointment,
        notes: 'Updated notes',
      });

      const result = await service.update(createAdminPayload(), appointment.id, {
        notes: 'Updated notes',
      });

      expect(result.notes).toBe('Updated notes');
    });

    it('should throw BadRequestException for completed appointment', async () => {
      const appointment = createCompletedAppointment();
      prisma.appointment.findFirst.mockResolvedValue(appointment);

      await expect(
        service.update(createAdminPayload(), appointment.id, { notes: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for cancelled appointment', async () => {
      const appointment = createCancelledAppointment();
      prisma.appointment.findFirst.mockResolvedValue(appointment);

      await expect(
        service.update(createAdminPayload(), appointment.id, { notes: 'test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeStatus', () => {
    it('should change status from NEW to CONFIRMED', async () => {
      const appointment = createAppointment({ status: AppointmentStatus.NEW });
      prisma.appointment.findFirst.mockResolvedValue(appointment);
      prisma.appointment.update.mockResolvedValue({
        ...appointment,
        status: AppointmentStatus.CONFIRMED,
      });

      const result = await service.changeStatus(createAdminPayload(), appointment.id, {
        status: AppointmentStatus.CONFIRMED,
      });

      expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const appointment = createAppointment({ status: AppointmentStatus.NEW });
      prisma.appointment.findFirst.mockResolvedValue(appointment);

      await expect(
        service.changeStatus(createAdminPayload(), appointment.id, {
          status: AppointmentStatus.COMPLETED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set arrivalTime when changing to ARRIVED', async () => {
      const appointment = createConfirmedAppointment();
      prisma.appointment.findFirst.mockResolvedValue(appointment);
      prisma.appointment.update.mockResolvedValue({
        ...appointment,
        status: AppointmentStatus.ARRIVED,
        arrivalTime: expect.any(Date),
      });

      await service.changeStatus(createAdminPayload(), appointment.id, {
        status: AppointmentStatus.ARRIVED,
      });

      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            arrivalTime: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('reschedule', () => {
    it('should reschedule appointment and create new one', async () => {
      const appointment = createConfirmedAppointment();
      const newAppointment = createAppointment({
        id: 'new-apt',
        status: AppointmentStatus.NEW,
      });

      prisma.appointment.findFirst.mockResolvedValue(appointment);
      prisma.appointment.update.mockResolvedValue({
        ...appointment,
        status: AppointmentStatus.RESCHEDULED,
      });
      prisma.appointment.create.mockResolvedValue(newAppointment);

      const result = await service.reschedule(createAdminPayload(), appointment.id, {
        newScheduledAt: new Date().toISOString(),
        reason: 'Doctor unavailable',
      });

      expect(result.id).toBe('new-apt');
      expect(result.status).toBe(AppointmentStatus.NEW);
    });

    it('should throw BadRequestException for completed appointment', async () => {
      const appointment = createCompletedAppointment();
      prisma.appointment.findFirst.mockResolvedValue(appointment);

      await expect(
        service.reschedule(createAdminPayload(), appointment.id, {
          newScheduledAt: new Date().toISOString(),
          reason: 'Test',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancel', () => {
    it('should cancel appointment successfully', async () => {
      const appointment = createConfirmedAppointment();
      prisma.appointment.findFirst.mockResolvedValue(appointment);
      prisma.appointment.update.mockResolvedValue({
        ...appointment,
        status: AppointmentStatus.CANCELLED,
        cancelReason: 'Patient request',
      });

      const result = await service.cancel(createAdminPayload(), appointment.id, {
        reason: 'Patient request',
      });

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('should throw BadRequestException for already cancelled appointment', async () => {
      const appointment = createCancelledAppointment();
      prisma.appointment.findFirst.mockResolvedValue(appointment);

      await expect(
        service.cancel(createAdminPayload(), appointment.id, { reason: 'Test' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAvailableSlots', () => {
    it('should return available slots', async () => {
      prisma.appointment.findMany.mockResolvedValue([]);

      const result = await service.getAvailableSlots(createAdminPayload(), {
        date: '2026-01-20',
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should exclude slots with existing appointments', async () => {
      const existingAppointment = {
        scheduledAt: new Date('2026-01-20T10:00:00Z'),
        durationMinutes: 30,
      };
      prisma.appointment.findMany.mockResolvedValue([existingAppointment]);

      const result = await service.getAvailableSlots(createAdminPayload(), {
        date: '2026-01-20',
        durationMinutes: 30,
      });

      const conflictingSlot = result.find((slot: any) => {
        const slotStart = new Date(slot.start);
        return slotStart.getTime() === existingAppointment.scheduledAt.getTime();
      });

      expect(conflictingSlot).toBeUndefined();
    });
  });
});
