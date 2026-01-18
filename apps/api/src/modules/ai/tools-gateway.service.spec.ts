import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';

import { ToolsGatewayService } from './tools-gateway.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MockPrismaService } from '../../../test/mocks';
import {
  createAdminPayload,
  createDoctorPayload,
  createReceptionPayload,
  createNursePayload,
  createAccountantPayload,
  createSupportPayload,
  createJwtPayload,
  createPatient,
  createAppointment,
} from '../../../test/factories';
import { ToolName } from './dto';

describe('ToolsGatewayService', () => {
  let service: ToolsGatewayService;
  let prisma: MockPrismaService;
  let auditService: jest.Mocked<AuditService>;

  beforeEach(async () => {
    prisma = new MockPrismaService();
    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToolsGatewayService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<ToolsGatewayService>(ToolsGatewayService);
  });

  afterEach(() => {
    prisma.resetAllMocks();
    jest.clearAllMocks();
  });

  describe('executeTool - RBAC enforcement', () => {
    describe('FIND_PATIENT_BY_PHONE', () => {
      it('should allow RECEPTION to find patient by phone', async () => {
        const user = createReceptionPayload();
        const patient = createPatient({ tenantId: user.tenantId });
        prisma.patient.findFirst.mockResolvedValue(patient);

        const result = await service.executeTool(
          user,
          ToolName.FIND_PATIENT_BY_PHONE,
          { phone: '+1234567890' },
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('name');
      });

      it('should allow DOCTOR to find patient by phone', async () => {
        const user = createDoctorPayload();
        const patient = createPatient({ tenantId: user.tenantId });
        prisma.patient.findFirst.mockResolvedValue(patient);

        const result = await service.executeTool(
          user,
          ToolName.FIND_PATIENT_BY_PHONE,
          { phone: '+1234567890' },
        );

        expect(result.success).toBe(true);
      });

      it('should include email for RECEPTION (contact access role)', async () => {
        const user = createReceptionPayload();
        const patient = createPatient({
          tenantId: user.tenantId,
          email: 'patient@example.com',
        });
        prisma.patient.findFirst.mockResolvedValue(patient);

        const result = await service.executeTool(
          user,
          ToolName.FIND_PATIENT_BY_PHONE,
          { phone: '+1234567890' },
        );

        expect((result.data as any).email).toBe('patient@example.com');
      });

      it('should NOT include email for NURSE (no contact access)', async () => {
        const user = createNursePayload();
        const patient = createPatient({
          tenantId: user.tenantId,
          email: 'patient@example.com',
        });
        prisma.patient.findFirst.mockResolvedValue(patient);

        const result = await service.executeTool(
          user,
          ToolName.FIND_PATIENT_BY_PHONE,
          { phone: '+1234567890' },
        );

        expect((result.data as any).email).toBeUndefined();
      });

      it('should return null for non-existent patient', async () => {
        const user = createReceptionPayload();
        prisma.patient.findFirst.mockResolvedValue(null);

        const result = await service.executeTool(
          user,
          ToolName.FIND_PATIENT_BY_PHONE,
          { phone: '+1234567890' },
        );

        expect(result.success).toBe(true);
        expect(result.data).toBeNull();
      });

      it('should deny access to patient in different branch', async () => {
        const user = createNursePayload({ branchIds: ['branch-1'] });
        const patient = createPatient({
          tenantId: user.tenantId,
          branchId: 'other-branch',
        });
        prisma.patient.findFirst.mockResolvedValue(patient);

        const result = await service.executeTool(
          user,
          ToolName.FIND_PATIENT_BY_PHONE,
          { phone: '+1234567890' },
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('branch you do not have access to');
      });
    });

    describe('SUMMARIZE_LAST_VISIT', () => {
      it('should allow DOCTOR to access visit summary', async () => {
        const user = createDoctorPayload();
        const visit = {
          id: 'visit-1',
          createdAt: new Date(),
          chiefComplaint: 'Headache',
          diagnosis: 'Migraine',
          treatmentNotes: 'Prescribed medication',
          doctor: { name: 'Dr. Test' },
          appointment: { scheduledAt: new Date(), service: { name: 'Consultation' } },
        };
        prisma.visit.findFirst.mockResolvedValue(visit);

        const result = await service.executeTool(
          user,
          ToolName.SUMMARIZE_LAST_VISIT,
          { patientId: 'patient-1' },
        );

        expect(result.success).toBe(true);
        expect((result.data as any).hasVisitHistory).toBe(true);
        expect((result.data as any).lastVisit).toHaveProperty('diagnosis');
      });

      it('should allow NURSE to access visit summary', async () => {
        const user = createNursePayload();
        const visit = {
          id: 'visit-1',
          createdAt: new Date(),
          chiefComplaint: 'Headache',
          diagnosis: 'Migraine',
          treatmentNotes: 'Prescribed medication',
          doctor: { name: 'Dr. Test' },
          appointment: { scheduledAt: new Date(), service: { name: 'Consultation' } },
        };
        prisma.visit.findFirst.mockResolvedValue(visit);

        const result = await service.executeTool(
          user,
          ToolName.SUMMARIZE_LAST_VISIT,
          { patientId: 'patient-1' },
        );

        expect(result.success).toBe(true);
      });

      it('should DENY RECEPTION access to visit summary', async () => {
        const user = createReceptionPayload();

        const result = await service.executeTool(
          user,
          ToolName.SUMMARIZE_LAST_VISIT,
          { patientId: 'patient-1' },
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('permission');
        expect(result.requiresHumanHandoff).toBe(true);
      });

      it('should DENY ACCOUNTANT access to visit summary', async () => {
        const user = createAccountantPayload();

        const result = await service.executeTool(
          user,
          ToolName.SUMMARIZE_LAST_VISIT,
          { patientId: 'patient-1' },
        );

        expect(result.success).toBe(false);
        expect(result.requiresHumanHandoff).toBe(true);
      });
    });

    describe('CREATE_OR_UPDATE_APPOINTMENT', () => {
      it('should allow RECEPTION to create appointment', async () => {
        const user = createReceptionPayload({ branchIds: ['test-branch'] });
        const patient = createPatient({ tenantId: user.tenantId });
        const doctor = { id: 'doctor-1', tenantId: user.tenantId, role: Role.DOCTOR, status: 'ACTIVE' };
        const appointmentService = { id: 'service-1', tenantId: user.tenantId, active: true, durationMinutes: 30 };
        const appointment = createAppointment();

        prisma.patient.findFirst.mockResolvedValue(patient);
        prisma.user.findFirst.mockResolvedValue(doctor);
        prisma.service.findFirst.mockResolvedValue(appointmentService);
        prisma.appointment.create.mockResolvedValue(appointment);

        const result = await service.executeTool(
          user,
          ToolName.CREATE_OR_UPDATE_APPOINTMENT,
          {
            patientId: patient.id,
            doctorId: doctor.id,
            serviceId: appointmentService.id,
            branchId: 'test-branch',
            scheduledAt: new Date().toISOString(),
          },
        );

        expect(result.success).toBe(true);
        expect((result.data as any).action).toBe('created');
      });

      it('should DENY DOCTOR permission to create appointment', async () => {
        const user = createDoctorPayload();

        const result = await service.executeTool(
          user,
          ToolName.CREATE_OR_UPDATE_APPOINTMENT,
          {
            patientId: 'patient-1',
            doctorId: 'doctor-1',
            serviceId: 'service-1',
            branchId: 'branch-1',
            scheduledAt: new Date().toISOString(),
          },
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('permission');
        expect(result.requiresHumanHandoff).toBe(true);
      });

      it('should DENY NURSE permission to create appointment', async () => {
        const user = createNursePayload();

        const result = await service.executeTool(
          user,
          ToolName.CREATE_OR_UPDATE_APPOINTMENT,
          {
            patientId: 'patient-1',
            doctorId: 'doctor-1',
            serviceId: 'service-1',
            branchId: 'branch-1',
            scheduledAt: new Date().toISOString(),
          },
        );

        expect(result.success).toBe(false);
      });

      it('should deny creation for unauthorized branch', async () => {
        const user = createReceptionPayload({ branchIds: ['my-branch'] });

        prisma.patient.findFirst.mockResolvedValue(createPatient());
        prisma.user.findFirst.mockResolvedValue({ id: 'doc', role: Role.DOCTOR });
        prisma.service.findFirst.mockResolvedValue({ id: 'svc', active: true });

        const result = await service.executeTool(
          user,
          ToolName.CREATE_OR_UPDATE_APPOINTMENT,
          {
            patientId: 'patient-1',
            doctorId: 'doctor-1',
            serviceId: 'service-1',
            branchId: 'other-branch',
            scheduledAt: new Date().toISOString(),
          },
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Access denied');
      });
    });

    describe('GET_INVOICE_STATUS', () => {
      it('should allow ACCOUNTANT to get invoice status', async () => {
        const user = createAccountantPayload();
        const patient = createPatient({ tenantId: user.tenantId });
        const invoices = [
          {
            invoiceNumber: 'INV-001',
            total: { toNumber: () => 100 },
            paidAmount: { toNumber: () => 50 },
            status: 'PARTIAL',
            createdAt: new Date(),
          },
        ];

        prisma.patient.findFirst.mockResolvedValue(patient);
        prisma.invoice.findMany.mockResolvedValue(invoices);

        const result = await service.executeTool(
          user,
          ToolName.GET_INVOICE_STATUS,
          { patientId: patient.id },
        );

        expect(result.success).toBe(true);
        expect((result.data as any).summary).toHaveProperty('totalOutstanding');
      });

      it('should allow RECEPTION to get invoice status', async () => {
        const user = createReceptionPayload();
        const patient = createPatient({ tenantId: user.tenantId });
        prisma.patient.findFirst.mockResolvedValue(patient);
        prisma.invoice.findMany.mockResolvedValue([]);

        const result = await service.executeTool(
          user,
          ToolName.GET_INVOICE_STATUS,
          { patientId: patient.id },
        );

        expect(result.success).toBe(true);
      });

      it('should DENY NURSE access to invoice status', async () => {
        const user = createNursePayload();

        const result = await service.executeTool(
          user,
          ToolName.GET_INVOICE_STATUS,
          { patientId: 'patient-1' },
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('permission');
      });
    });

    describe('CREATE_FOLLOWUP_TASK', () => {
      it('should allow DOCTOR to create follow-up task', async () => {
        const user = createDoctorPayload();
        const assignee = { id: 'nurse-1', name: 'Nurse Test', tenantId: user.tenantId };
        const task = {
          id: 'task-1',
          title: 'Follow up call',
          dueDate: new Date(),
          priority: 'MEDIUM',
          assignee: { id: assignee.id, name: assignee.name },
        };

        prisma.user.findFirst.mockResolvedValue(assignee);
        prisma.task.create.mockResolvedValue(task);

        const result = await service.executeTool(
          user,
          ToolName.CREATE_FOLLOWUP_TASK,
          {
            entityType: 'Patient',
            entityId: 'patient-1',
            title: 'Follow up call',
            assignedTo: assignee.id,
            dueDate: new Date().toISOString(),
          },
        );

        expect(result.success).toBe(true);
        expect((result.data as any).task).toHaveProperty('id');
      });

      it('should validate entity type', async () => {
        const user = createReceptionPayload();

        const result = await service.executeTool(
          user,
          ToolName.CREATE_FOLLOWUP_TASK,
          {
            entityType: 'InvalidType',
            entityId: 'entity-1',
            title: 'Test task',
            assignedTo: 'user-1',
            dueDate: new Date().toISOString(),
          },
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid entity type');
      });
    });
  });

  describe('checkRequiresHandoff', () => {
    it('should require handoff for medical questions from RECEPTION', async () => {
      const user = createReceptionPayload();

      const result = service.checkRequiresHandoff(user, 'medical_question');

      expect(result.required).toBe(true);
      expect(result.reason).toContain('medical staff');
    });

    it('should require handoff for medical questions from SUPPORT', async () => {
      const user = createSupportPayload();

      const result = service.checkRequiresHandoff(user, 'medical_question');

      expect(result.required).toBe(true);
    });

    it('should NOT require handoff for medical questions from DOCTOR', async () => {
      const user = createDoctorPayload();

      const result = service.checkRequiresHandoff(user, 'medical_question');

      expect(result.required).toBe(false);
    });

    it('should NOT require handoff for non-medical questions', async () => {
      const user = createReceptionPayload();

      const result = service.checkRequiresHandoff(user, 'appointment_inquiry');

      expect(result.required).toBe(false);
    });
  });

  describe('Audit logging', () => {
    it('should log successful tool calls', async () => {
      const user = createReceptionPayload();
      prisma.patient.findFirst.mockResolvedValue(null);

      await service.executeTool(
        user,
        ToolName.FIND_PATIENT_BY_PHONE,
        { phone: '+1234567890' },
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.sub,
          tenantId: user.tenantId,
          action: 'AI_TOOL_CALL',
          entityType: 'AiToolCall',
        }),
      );
    });

    it('should log failed tool calls', async () => {
      const user = createReceptionPayload(); // Reception doesn't have access to SUMMARIZE_LAST_VISIT

      await service.executeTool(
        user,
        ToolName.SUMMARIZE_LAST_VISIT,
        { patientId: 'patient-1' },
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          after: expect.objectContaining({
            success: false,
          }),
        }),
      );
    });

    it('should sanitize sensitive params before logging', async () => {
      const user = createReceptionPayload();
      prisma.patient.findFirst.mockResolvedValue(null);

      await service.executeTool(
        user,
        ToolName.FIND_PATIENT_BY_PHONE,
        { phone: '+1234567890', password: 'secret123' },
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          after: expect.objectContaining({
            params: expect.objectContaining({
              password: '[REDACTED]',
            }),
          }),
        }),
      );
    });
  });
});
