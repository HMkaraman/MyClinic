import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateVisitDto, UpdateVisitDto, QueryVisitsDto } from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';
import { validateSortBy } from '../../common/utils/validate-sort-by.util';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt'] as const;

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];
const MEDICAL_STAFF_ROLES: Role[] = [Role.DOCTOR, Role.NURSE];

@Injectable()
export class VisitsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(user: JwtPayload, query: QueryVisitsDto) {
    const {
      branchId,
      patientId,
      doctorId,
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.VisitWhereInput = {
      tenantId: user.tenantId, // Always scope to tenant
    };

    // Branch scoping - only bypass for admin roles
    if (branchId) {
      where.branchId = branchId;
    } else if (
      !ADMIN_ROLES.includes(user.role) &&
      user.branchIds.length > 0
    ) {
      where.branchId = { in: user.branchIds };
    }

    // For doctors, only show their own visits by default
    if (doctorId) {
      where.doctorId = doctorId;
    } else if (user.role === Role.DOCTOR) {
      where.doctorId = user.sub;
    }

    if (patientId) {
      where.patientId = patientId;
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

    const validatedSortBy = validateSortBy(sortBy, ALLOWED_SORT_FIELDS, 'createdAt');

    const [visits, total] = await Promise.all([
      this.prisma.visit.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [validatedSortBy]: sortOrder },
        include: {
          patient: {
            select: { id: true, name: true, phone: true, fileNumber: true },
          },
          doctor: {
            select: { id: true, name: true, email: true },
          },
          branch: {
            select: { id: true, name: true },
          },
          appointment: {
            select: { id: true, scheduledAt: true, service: { select: { id: true, name: true } } },
          },
        },
      }),
      this.prisma.visit.count({ where }),
    ]);

    return {
      data: visits,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(user: JwtPayload, id: string) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        id,
        tenantId: user.tenantId, // Always scope to tenant
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            fileNumber: true,
            dateOfBirth: true,
            gender: true,
            medicalSummary: true,
          },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            service: { select: { id: true, name: true } },
          },
        },
        invoices: {
          select: { id: true, invoiceNumber: true, total: true, status: true },
        },
      },
    });

    if (!visit) {
      throw new NotFoundException('Visit not found');
    }

    // Check access: branch or doctor
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(visit.branchId) &&
      user.sub !== visit.doctorId
    ) {
      throw new ForbiddenException('Access denied to this visit');
    }

    return visit;
  }

  async getPatientVisits(user: JwtPayload, patientId: string) {
    // Verify patient exists and user has access
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

    const visits = await this.prisma.visit.findMany({
      where: {
        tenantId: user.tenantId, // Always scope to tenant
        patientId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: { id: true, name: true, email: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    return visits;
  }

  async create(user: JwtPayload, dto: CreateVisitDto) {
    // Only medical staff can create visits
    if (!MEDICAL_STAFF_ROLES.includes(user.role)) {
      throw new ForbiddenException('Only medical staff can create visits');
    }

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
    if (!user.branchIds.includes(dto.branchId)) {
      throw new ForbiddenException('Access denied to this branch');
    }

    // If linking to appointment, verify it exists and is valid
    if (dto.appointmentId) {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: dto.appointmentId },
      });

      if (!appointment) {
        throw new NotFoundException('Appointment not found');
      }

      if (appointment.patientId !== dto.patientId) {
        throw new BadRequestException('Appointment does not belong to this patient');
      }

      // Check if visit already exists for this appointment
      const existingVisit = await this.prisma.visit.findUnique({
        where: { appointmentId: dto.appointmentId },
      });

      if (existingVisit) {
        throw new BadRequestException('Visit already exists for this appointment');
      }
    }

    const visit = await this.prisma.visit.create({
      data: {
        tenantId: user.tenantId,
        branchId: dto.branchId,
        patientId: dto.patientId,
        doctorId: user.sub, // Current user is the doctor
        appointmentId: dto.appointmentId,
        chiefComplaint: dto.chiefComplaint,
        diagnosis: dto.diagnosis,
        treatmentNotes: dto.treatmentNotes,
        prescriptions: dto.prescriptions as Prisma.InputJsonValue,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Log activity
    await this.activityService.logVisitActivity(user.tenantId, visit.id, 'created', user.sub, {
      patientId: patient.id,
      patientName: patient.name,
      diagnosis: dto.diagnosis,
    });

    // Also log to patient timeline
    await this.activityService.logPatientActivity(user.tenantId, patient.id, 'visit_created', user.sub, {
      visitId: visit.id,
      diagnosis: dto.diagnosis,
    });

    return visit;
  }

  async update(user: JwtPayload, id: string, dto: UpdateVisitDto) {
    const visit = await this.findById(user, id);

    // Only the visit doctor or admin can update
    if (
      !ADMIN_ROLES.includes(user.role) &&
      visit.doctorId !== user.sub
    ) {
      throw new ForbiddenException('Only the attending doctor can update this visit');
    }

    const updated = await this.prisma.visit.update({
      where: { id },
      data: {
        chiefComplaint: dto.chiefComplaint,
        diagnosis: dto.diagnosis,
        treatmentNotes: dto.treatmentNotes,
        prescriptions: dto.prescriptions as Prisma.InputJsonValue,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Log activity
    await this.activityService.logVisitActivity(user.tenantId, id, 'updated', user.sub, {
      updatedFields: Object.keys(dto),
    });

    return updated;
  }
}
