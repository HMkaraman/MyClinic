import { Injectable, Logger } from '@nestjs/common';
import { Role, TaskPriority, TaskEntityType, InvoiceStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JwtPayload } from '../auth/decorators/current-user.decorator';
import {
  ToolName,
  ToolResultDto,
  FindPatientByPhoneParams,
  GetNextAvailableSlotsParams,
  CreateOrUpdateAppointmentParams,
  SummarizeLastVisitParams,
  GetInvoiceStatusParams,
  CreateFollowupTaskParams,
} from './dto';

// Define which roles can use which tools
const TOOL_PERMISSIONS: Record<ToolName, Role[]> = {
  [ToolName.FIND_PATIENT_BY_PHONE]: [
    Role.ADMIN,
    Role.MANAGER,
    Role.RECEPTION,
    Role.DOCTOR,
    Role.NURSE,
    Role.SUPPORT,
    Role.ACCOUNTANT,
  ],
  [ToolName.GET_NEXT_AVAILABLE_SLOTS]: [
    Role.ADMIN,
    Role.MANAGER,
    Role.RECEPTION,
    Role.DOCTOR,
    Role.NURSE,
    Role.SUPPORT,
  ],
  [ToolName.CREATE_OR_UPDATE_APPOINTMENT]: [
    Role.ADMIN,
    Role.MANAGER,
    Role.RECEPTION,
  ],
  [ToolName.SUMMARIZE_LAST_VISIT]: [
    // Only medical staff can see visit summaries
    Role.ADMIN,
    Role.MANAGER,
    Role.DOCTOR,
    Role.NURSE,
  ],
  [ToolName.GET_INVOICE_STATUS]: [
    Role.ADMIN,
    Role.MANAGER,
    Role.RECEPTION,
    Role.ACCOUNTANT,
  ],
  [ToolName.CREATE_FOLLOWUP_TASK]: [
    Role.ADMIN,
    Role.MANAGER,
    Role.RECEPTION,
    Role.DOCTOR,
    Role.NURSE,
    Role.SUPPORT,
    Role.ACCOUNTANT,
  ],
};

// Roles that can view contact details
const CONTACT_ACCESS_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.RECEPTION, Role.SUPPORT];

// Roles that can access medical data
const MEDICAL_ACCESS_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE];

// Admin roles with branch override access
const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];

// Roles that require handoff for sensitive medical questions
const SENSITIVE_HANDOFF_ROLES: Role[] = [Role.RECEPTION, Role.SUPPORT, Role.ACCOUNTANT];

@Injectable()
export class ToolsGatewayService {
  private readonly logger = new Logger(ToolsGatewayService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Execute a tool call with RBAC enforcement
   */
  async executeTool(
    user: JwtPayload,
    tool: ToolName,
    params: Record<string, unknown>,
    agentType: 'customer' | 'staff' = 'staff',
  ): Promise<ToolResultDto> {
    // Check permission
    const allowedRoles = TOOL_PERMISSIONS[tool];
    if (!allowedRoles.includes(user.role)) {
      await this.logAiRequest(user, tool, params, false, 'Permission denied');
      return {
        success: false,
        error: `You do not have permission to use the ${tool} tool`,
        requiresHumanHandoff: true,
        handoffReason: 'Permission denied - requires elevated access',
      };
    }

    try {
      let result: ToolResultDto;

      switch (tool) {
        case ToolName.FIND_PATIENT_BY_PHONE:
          result = await this.findPatientByPhone(user, params as unknown as FindPatientByPhoneParams);
          break;
        case ToolName.GET_NEXT_AVAILABLE_SLOTS:
          result = await this.getNextAvailableSlots(user, params as unknown as GetNextAvailableSlotsParams);
          break;
        case ToolName.CREATE_OR_UPDATE_APPOINTMENT:
          result = await this.createOrUpdateAppointment(user, params as unknown as CreateOrUpdateAppointmentParams);
          break;
        case ToolName.SUMMARIZE_LAST_VISIT:
          result = await this.summarizeLastVisit(user, params as unknown as SummarizeLastVisitParams);
          break;
        case ToolName.GET_INVOICE_STATUS:
          result = await this.getInvoiceStatus(user, params as unknown as GetInvoiceStatusParams);
          break;
        case ToolName.CREATE_FOLLOWUP_TASK:
          result = await this.createFollowupTask(user, params as unknown as CreateFollowupTaskParams);
          break;
        default:
          result = { success: false, error: `Unknown tool: ${tool}` };
      }

      // Log the AI request
      await this.logAiRequest(user, tool, params, result.success, result.error);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Tool execution error: ${tool}`, error);
      await this.logAiRequest(user, tool, params, false, errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if a tool requires human handoff based on the context
   */
  checkRequiresHandoff(user: JwtPayload, intent: string): { required: boolean; reason?: string } {
    // Medical questions from non-medical staff require handoff
    if (SENSITIVE_HANDOFF_ROLES.includes(user.role) && intent === 'medical_question') {
      return {
        required: true,
        reason: 'Medical questions require review by medical staff',
      };
    }

    return { required: false };
  }

  // ==================== Tool Implementations ====================

  /**
   * Find a patient by phone number
   * Returns minimal data to reduce exposure
   */
  private async findPatientByPhone(
    user: JwtPayload,
    params: FindPatientByPhoneParams,
  ): Promise<ToolResultDto> {
    const { phone } = params;

    if (!phone) {
      return { success: false, error: 'Phone number is required' };
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/\s+/g, '').replace(/^0/, '+964');

    const patient = await this.prisma.patient.findFirst({
      where: {
        tenantId: user.tenantId,
        deletedAt: null,
        OR: [
          { phone: { contains: normalizedPhone } },
          { phone: { contains: phone } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        fileNumber: true,
        branchId: true,
        email: true,
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!patient) {
      return {
        success: true,
        data: null,
      };
    }

    // Branch access check for non-admin users
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(patient.branchId)
    ) {
      return {
        success: false,
        error: 'Patient is in a branch you do not have access to',
      };
    }

    // Filter out contact details based on role
    return {
      success: true,
      data: {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        fileNumber: patient.fileNumber,
        branch: patient.branch,
        ...(CONTACT_ACCESS_ROLES.includes(user.role) ? { email: patient.email } : {}),
      },
    };
  }

  /**
   * Get next available appointment slots
   */
  private async getNextAvailableSlots(
    user: JwtPayload,
    params: GetNextAvailableSlotsParams,
  ): Promise<ToolResultDto> {
    const { branchId, doctorId, date, durationMinutes = 30 } = params;

    if (!date) {
      return { success: false, error: 'Date is required' };
    }

    // Define working hours (9 AM to 5 PM)
    const startHour = 9;
    const endHour = 17;

    const dateStart = new Date(date);
    dateStart.setHours(startHour, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(endHour, 0, 0, 0);

    // Get existing appointments for the day
    const where: any = {
      scheduledAt: {
        gte: dateStart,
        lt: dateEnd,
      },
      status: {
        notIn: ['CANCELLED', 'RESCHEDULED'],
      },
    };

    if (branchId) {
      where.branchId = branchId;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      select: {
        scheduledAt: true,
        durationMinutes: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Generate available slots
    const slots: { start: string; end: string }[] = [];

    for (
      let time = new Date(dateStart);
      time < dateEnd;
      time.setMinutes(time.getMinutes() + durationMinutes)
    ) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time.getTime() + durationMinutes * 60000);

      // Check if slot overlaps with any appointment
      const isAvailable = !appointments.some((apt) => {
        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = new Date(aptStart.getTime() + apt.durationMinutes * 60000);

        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd)
        );
      });

      if (isAvailable) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
        });
      }
    }

    // Return only first 5 available slots to minimize data
    return {
      success: true,
      data: {
        date,
        availableSlots: slots.slice(0, 5),
        totalAvailable: slots.length,
      },
    };
  }

  /**
   * Create or update an appointment
   */
  private async createOrUpdateAppointment(
    user: JwtPayload,
    params: CreateOrUpdateAppointmentParams,
  ): Promise<ToolResultDto> {
    const {
      appointmentId,
      patientId,
      doctorId,
      serviceId,
      branchId,
      scheduledAt,
      durationMinutes,
      notes,
    } = params;

    // Validate required params
    if (!patientId || !doctorId || !serviceId || !branchId || !scheduledAt) {
      return {
        success: false,
        error: 'Missing required parameters: patientId, doctorId, serviceId, branchId, scheduledAt',
      };
    }

    // Branch access check
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(branchId)
    ) {
      return {
        success: false,
        error: 'Access denied to this branch',
      };
    }

    // Verify patient exists
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!patient) {
      return { success: false, error: 'Patient not found' };
    }

    // Verify doctor exists
    const doctor = await this.prisma.user.findFirst({
      where: {
        id: doctorId,
        tenantId: user.tenantId,
        role: Role.DOCTOR,
        status: 'ACTIVE',
      },
    });

    if (!doctor) {
      return { success: false, error: 'Doctor not found' };
    }

    // Verify service exists
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        tenantId: user.tenantId,
        active: true,
      },
    });

    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    if (appointmentId) {
      // Update existing appointment
      const existing = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
      });

      if (!existing) {
        return { success: false, error: 'Appointment not found' };
      }

      if (['COMPLETED', 'CANCELLED', 'RESCHEDULED'].includes(existing.status)) {
        return {
          success: false,
          error: `Cannot update appointment with status ${existing.status}`,
        };
      }

      const updated = await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          scheduledAt: new Date(scheduledAt),
          durationMinutes: durationMinutes || service.durationMinutes,
          notes,
        },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          patient: { select: { name: true, phone: true } },
          doctor: { select: { name: true } },
          service: { select: { name: true } },
        },
      });

      return {
        success: true,
        data: {
          action: 'updated',
          appointment: updated,
        },
      };
    } else {
      // Create new appointment
      const appointment = await this.prisma.appointment.create({
        data: {
          tenantId: user.tenantId,
          branchId,
          patientId,
          doctorId,
          serviceId,
          scheduledAt: new Date(scheduledAt),
          durationMinutes: durationMinutes || service.durationMinutes,
          notes,
          status: 'NEW',
        },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          patient: { select: { name: true, phone: true } },
          doctor: { select: { name: true } },
          service: { select: { name: true } },
        },
      });

      return {
        success: true,
        data: {
          action: 'created',
          appointment,
        },
      };
    }
  }

  /**
   * Summarize the last visit for a patient
   * Only returns medical data to authorized roles
   */
  private async summarizeLastVisit(
    user: JwtPayload,
    params: SummarizeLastVisitParams,
  ): Promise<ToolResultDto> {
    const { patientId } = params;

    if (!patientId) {
      return { success: false, error: 'Patient ID is required' };
    }

    // Additional check for medical staff only
    if (!MEDICAL_ACCESS_ROLES.includes(user.role)) {
      return {
        success: false,
        error: 'Only medical staff can access visit summaries',
        requiresHumanHandoff: true,
        handoffReason: 'Requires medical staff access',
      };
    }

    const visit = await this.prisma.visit.findFirst({
      where: {
        patientId,
        patient: {
          tenantId: user.tenantId,
          deletedAt: null,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        chiefComplaint: true,
        diagnosis: true,
        treatmentNotes: true,
        doctor: { select: { name: true } },
        appointment: {
          select: {
            scheduledAt: true,
            service: { select: { name: true } },
          },
        },
      },
    });

    if (!visit) {
      return {
        success: true,
        data: {
          hasVisitHistory: false,
          message: 'No visit history found for this patient',
        },
      };
    }

    return {
      success: true,
      data: {
        hasVisitHistory: true,
        lastVisit: {
          date: visit.createdAt,
          doctor: visit.doctor.name,
          service: visit.appointment?.service?.name,
          chiefComplaint: visit.chiefComplaint,
          diagnosis: visit.diagnosis,
          treatmentNotes: visit.treatmentNotes,
        },
      },
    };
  }

  /**
   * Get invoice status for a patient
   */
  private async getInvoiceStatus(
    user: JwtPayload,
    params: GetInvoiceStatusParams,
  ): Promise<ToolResultDto> {
    const { patientId, phone, invoiceNumber } = params;

    if (!patientId && !phone && !invoiceNumber) {
      return {
        success: false,
        error: 'At least one of patientId, phone, or invoiceNumber is required',
      };
    }

    let patient: { id: string; name: string; phone: string } | null = null;

    if (invoiceNumber) {
      // Find invoice by number
      const invoice = await this.prisma.invoice.findFirst({
        where: {
          invoiceNumber,
          branch: { tenantId: user.tenantId },
        },
        select: {
          id: true,
          invoiceNumber: true,
          total: true,
          paidAmount: true,
          status: true,
          createdAt: true,
          patient: {
            select: { id: true, name: true, phone: true },
          },
        },
      });

      if (!invoice) {
        return { success: true, data: { found: false } };
      }

      const remainingBalance = invoice.total.toNumber() - invoice.paidAmount.toNumber();

      return {
        success: true,
        data: {
          found: true,
          invoice: {
            invoiceNumber: invoice.invoiceNumber,
            total: invoice.total.toNumber(),
            paidAmount: invoice.paidAmount.toNumber(),
            remainingBalance,
            status: invoice.status,
            patientName: invoice.patient.name,
          },
        },
      };
    }

    // Find patient by ID or phone
    if (patientId) {
      patient = await this.prisma.patient.findFirst({
        where: {
          id: patientId,
          tenantId: user.tenantId,
          deletedAt: null,
        },
        select: { id: true, name: true, phone: true },
      });
    } else if (phone) {
      patient = await this.prisma.patient.findFirst({
        where: {
          tenantId: user.tenantId,
          deletedAt: null,
          phone: { contains: phone },
        },
        select: { id: true, name: true, phone: true },
      });
    }

    if (!patient) {
      return { success: true, data: { found: false, patientFound: false } };
    }

    // Get recent invoices
    const invoices = await this.prisma.invoice.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        invoiceNumber: true,
        total: true,
        paidAmount: true,
        status: true,
        createdAt: true,
      },
    });

    // Calculate summary
    const unpaidInvoices = invoices.filter(
      (inv) => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.CANCELLED,
    );
    const totalOutstanding = unpaidInvoices.reduce(
      (sum, inv) => sum + (inv.total.toNumber() - inv.paidAmount.toNumber()),
      0,
    );

    return {
      success: true,
      data: {
        found: true,
        patientFound: true,
        patientName: patient.name,
        summary: {
          totalOutstanding,
          unpaidInvoiceCount: unpaidInvoices.length,
          recentInvoices: invoices.map((inv) => ({
            invoiceNumber: inv.invoiceNumber,
            total: inv.total.toNumber(),
            paid: inv.paidAmount.toNumber(),
            status: inv.status,
            date: inv.createdAt,
          })),
        },
      },
    };
  }

  /**
   * Create a follow-up task
   */
  private async createFollowupTask(
    user: JwtPayload,
    params: CreateFollowupTaskParams,
  ): Promise<ToolResultDto> {
    const { entityType, entityId, title, description, assignedTo, dueDate, priority } = params;

    if (!entityType || !entityId || !title || !assignedTo || !dueDate) {
      return {
        success: false,
        error: 'Missing required parameters: entityType, entityId, title, assignedTo, dueDate',
      };
    }

    // Map entity type to enum value
    const entityTypeMap: Record<string, TaskEntityType> = {
      Patient: TaskEntityType.PATIENT,
      Lead: TaskEntityType.LEAD,
      Appointment: TaskEntityType.APPOINTMENT,
      Conversation: TaskEntityType.CONVERSATION,
    };

    const mappedEntityType = entityTypeMap[entityType];
    if (!mappedEntityType) {
      return {
        success: false,
        error: `Invalid entity type: ${entityType}. Must be one of: Patient, Lead, Appointment, Conversation`,
      };
    }

    // Verify assignee exists in tenant
    const assignee = await this.prisma.user.findFirst({
      where: {
        id: assignedTo,
        tenantId: user.tenantId,
        status: 'ACTIVE',
      },
      select: { id: true, name: true },
    });

    if (!assignee) {
      return { success: false, error: 'Assignee not found' };
    }

    const task = await this.prisma.task.create({
      data: {
        tenantId: user.tenantId,
        title,
        description,
        entityType: mappedEntityType,
        entityId,
        assignedTo,
        dueDate: new Date(dueDate),
        priority: (priority as TaskPriority) || TaskPriority.MEDIUM,
        createdBy: user.sub,
      },
      include: {
        assignee: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      success: true,
      data: {
        task: {
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          priority: task.priority,
          assignedTo: task.assignee.name,
        },
      },
    };
  }

  // ==================== Helper Methods ====================

  private async logAiRequest(
    user: JwtPayload,
    tool: string,
    params: Record<string, unknown>,
    success: boolean,
    error?: string,
  ): Promise<void> {
    await this.auditService.log({
      userId: user.sub,
      tenantId: user.tenantId,
      userRole: user.role,
      action: 'AI_TOOL_CALL',
      entityType: 'AiToolCall',
      entityId: tool,
      after: {
        tool,
        params: this.sanitizeParams(params),
        success,
        error,
      },
    });
  }

  /**
   * Remove sensitive data from params before logging
   */
  private sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
    const sanitized = { ...params };
    // Remove any sensitive fields
    const sensitiveFields = ['password', 'token', 'secret'];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }
}
