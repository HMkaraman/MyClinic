import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma, AppointmentStatus, Role } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { NOTIFICATION_EVENTS } from '../notifications/events/notification.events';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  QueryAppointmentsDto,
  AvailableSlotsDto,
  ChangeStatusDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
} from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';
import { validateSortBy } from '../../common/utils/validate-sort-by.util';

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'scheduledAt', 'status'] as const;

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];
const TERMINAL_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.COMPLETED,
  AppointmentStatus.CANCELLED,
  AppointmentStatus.RESCHEDULED,
];

// Valid status transitions
const STATUS_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  [AppointmentStatus.NEW]: [
    AppointmentStatus.CONFIRMED,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.RESCHEDULED,
  ],
  [AppointmentStatus.CONFIRMED]: [
    AppointmentStatus.ARRIVED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.RESCHEDULED,
  ],
  [AppointmentStatus.ARRIVED]: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.NO_SHOW,
  ],
  [AppointmentStatus.IN_PROGRESS]: [AppointmentStatus.COMPLETED],
  [AppointmentStatus.COMPLETED]: [],
  [AppointmentStatus.NO_SHOW]: [],
  [AppointmentStatus.CANCELLED]: [],
  [AppointmentStatus.RESCHEDULED]: [],
};

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(user: JwtPayload, query: QueryAppointmentsDto) {
    const {
      branchId,
      doctorId,
      patientId,
      status,
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.AppointmentWhereInput = {
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

    // Filter by doctor (for doctor role, only show their appointments)
    if (doctorId) {
      where.doctorId = doctorId;
    } else if (user.role === Role.DOCTOR) {
      where.doctorId = user.sub;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (status) {
      where.status = status;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.scheduledAt = {};
      if (dateFrom) {
        where.scheduledAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.scheduledAt.lte = endDate;
      }
    }

    const validatedSortBy = validateSortBy(sortBy, ALLOWED_SORT_FIELDS, 'scheduledAt');

    const [appointments, total] = await Promise.all([
      this.prisma.appointment.findMany({
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
          service: {
            select: { id: true, name: true, price: true },
          },
          branch: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.appointment.count({ where }),
    ]);

    return {
      data: appointments,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(user: JwtPayload, id: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id,
        tenantId: user.tenantId, // Always scope to tenant
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        service: {
          select: { id: true, name: true, price: true, durationMinutes: true },
        },
        branch: {
          select: { id: true, name: true },
        },
        visit: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Branch access check for non-admin users
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(appointment.branchId) &&
      user.sub !== appointment.doctorId
    ) {
      throw new ForbiddenException('Access denied to this appointment');
    }

    return appointment;
  }

  async getAvailableSlots(user: JwtPayload, query: AvailableSlotsDto) {
    const { branchId, doctorId, date, durationMinutes } = query;

    // Define working hours (9 AM to 5 PM)
    const startHour = 9;
    const endHour = 17;

    const dateStart = new Date(date);
    dateStart.setHours(startHour, 0, 0, 0);

    const dateEnd = new Date(date);
    dateEnd.setHours(endHour, 0, 0, 0);

    // Get existing appointments for the day
    const where: Prisma.AppointmentWhereInput = {
      tenantId: user.tenantId, // Always scope to tenant
      scheduledAt: {
        gte: dateStart,
        lt: dateEnd,
      },
      status: {
        notIn: [AppointmentStatus.CANCELLED, AppointmentStatus.RESCHEDULED],
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

    // Generate all possible slots
    const slots: { start: Date; end: Date; available: boolean }[] = [];
    const slotDuration = durationMinutes || 30;

    for (
      let time = new Date(dateStart);
      time < dateEnd;
      time.setMinutes(time.getMinutes() + slotDuration)
    ) {
      const slotStart = new Date(time);
      const slotEnd = new Date(time.getTime() + slotDuration * 60000);

      // Check if slot overlaps with any appointment
      const isAvailable = !appointments.some((apt) => {
        const aptStart = new Date(apt.scheduledAt);
        const aptEnd = new Date(
          aptStart.getTime() + apt.durationMinutes * 60000,
        );

        return (
          (slotStart >= aptStart && slotStart < aptEnd) ||
          (slotEnd > aptStart && slotEnd <= aptEnd) ||
          (slotStart <= aptStart && slotEnd >= aptEnd)
        );
      });

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: isAvailable,
      });
    }

    return slots.filter((slot) => slot.available);
  }

  async create(user: JwtPayload, dto: CreateAppointmentDto) {
    // Verify patient exists and user has access
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

    // Verify doctor exists and is in tenant
    const doctor = await this.prisma.user.findFirst({
      where: {
        id: dto.doctorId,
        tenantId: user.tenantId,
        role: Role.DOCTOR,
        status: 'ACTIVE',
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Verify service exists
    const service = await this.prisma.service.findFirst({
      where: {
        id: dto.serviceId,
        tenantId: user.tenantId,
        active: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    // Branch access check
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(dto.branchId)
    ) {
      throw new ForbiddenException('Access denied to this branch');
    }

    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId: user.tenantId,
        branchId: dto.branchId,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        serviceId: dto.serviceId,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes || service.durationMinutes,
        notes: dto.notes,
        status: AppointmentStatus.NEW,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        service: {
          select: { id: true, name: true, price: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await this.activityService.logAppointmentActivity(
      user.tenantId,
      appointment.id,
      'created',
      user.sub,
      {
        patientId: patient.id,
        patientName: patient.name,
        doctorName: doctor.name,
        scheduledAt: dto.scheduledAt,
      },
    );

    // Emit notification event for the assigned doctor
    this.eventEmitter.emit(NOTIFICATION_EVENTS.APPOINTMENT_CREATED, {
      tenantId: user.tenantId,
      recipientUserIds: [dto.doctorId],
      appointmentId: appointment.id,
      patientName: patient.name,
      doctorId: dto.doctorId,
      doctorName: doctor.name,
      scheduledAt: new Date(dto.scheduledAt),
      serviceName: service.name,
      entityType: 'appointment',
      entityId: appointment.id,
    });

    return appointment;
  }

  async update(user: JwtPayload, id: string, dto: UpdateAppointmentDto) {
    const appointment = await this.findById(user, id);

    // Cannot update completed/cancelled appointments
    if (TERMINAL_STATUSES.includes(appointment.status)) {
      throw new BadRequestException(
        `Cannot update appointment with status ${appointment.status}`,
      );
    }

    const updateData: any = { ...dto };

    if (dto.scheduledAt) {
      updateData.scheduledAt = new Date(dto.scheduledAt);
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        service: {
          select: { id: true, name: true, price: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await this.activityService.logAppointmentActivity(
      user.tenantId,
      id,
      'updated',
      user.sub,
      { updatedFields: Object.keys(dto) },
    );

    return updated;
  }

  async changeStatus(user: JwtPayload, id: string, dto: ChangeStatusDto) {
    const appointment = await this.findById(user, id);

    // Validate status transition
    const validTransitions = STATUS_TRANSITIONS[appointment.status];
    if (!validTransitions.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${appointment.status} to ${dto.status}`,
      );
    }

    const updateData: Prisma.AppointmentUpdateInput = {
      status: dto.status,
    };

    // Set timestamps based on status
    if (dto.status === AppointmentStatus.ARRIVED) {
      updateData.arrivalTime = new Date();
    } else if (dto.status === AppointmentStatus.IN_PROGRESS) {
      updateData.checkInTime = new Date();
    } else if (dto.status === AppointmentStatus.COMPLETED) {
      updateData.checkOutTime = new Date();
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        service: {
          select: { id: true, name: true, price: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await this.activityService.logAppointmentActivity(
      user.tenantId,
      id,
      `status_changed_to_${dto.status.toLowerCase()}`,
      user.sub,
      { previousStatus: appointment.status, newStatus: dto.status },
    );

    return updated;
  }

  async reschedule(user: JwtPayload, id: string, dto: RescheduleAppointmentDto) {
    const appointment = await this.findById(user, id);

    // Validate status allows rescheduling
    const validTransitions = STATUS_TRANSITIONS[appointment.status];
    if (!validTransitions.includes(AppointmentStatus.RESCHEDULED)) {
      throw new BadRequestException(
        `Cannot reschedule appointment with status ${appointment.status}`,
      );
    }

    // Mark old appointment as rescheduled
    await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.RESCHEDULED,
        rescheduleReason: dto.reason,
      },
    });

    // Create new appointment
    const newAppointment = await this.prisma.appointment.create({
      data: {
        tenantId: user.tenantId,
        branchId: appointment.branchId,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        serviceId: appointment.serviceId,
        scheduledAt: new Date(dto.newScheduledAt),
        durationMinutes: appointment.durationMinutes,
        notes: appointment.notes,
        status: AppointmentStatus.NEW,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        service: {
          select: { id: true, name: true, price: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await this.activityService.logAppointmentActivity(
      user.tenantId,
      id,
      'rescheduled',
      user.sub,
      {
        reason: dto.reason,
        newAppointmentId: newAppointment.id,
        newScheduledAt: dto.newScheduledAt,
      },
    );

    // Emit notification event
    this.eventEmitter.emit(NOTIFICATION_EVENTS.APPOINTMENT_RESCHEDULED, {
      tenantId: user.tenantId,
      recipientUserIds: [appointment.doctorId],
      appointmentId: id,
      newAppointmentId: newAppointment.id,
      patientName: appointment.patient.name,
      doctorId: appointment.doctorId,
      oldScheduledAt: appointment.scheduledAt,
      newScheduledAt: new Date(dto.newScheduledAt),
      reason: dto.reason,
      entityType: 'appointment',
      entityId: newAppointment.id,
    });

    return newAppointment;
  }

  async cancel(user: JwtPayload, id: string, dto: CancelAppointmentDto) {
    const appointment = await this.findById(user, id);

    // Validate status allows cancellation
    const validTransitions = STATUS_TRANSITIONS[appointment.status];
    if (!validTransitions.includes(AppointmentStatus.CANCELLED)) {
      throw new BadRequestException(
        `Cannot cancel appointment with status ${appointment.status}`,
      );
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelReason: dto.reason,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        service: {
          select: { id: true, name: true, price: true },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await this.activityService.logAppointmentActivity(
      user.tenantId,
      id,
      'cancelled',
      user.sub,
      { reason: dto.reason },
    );

    // Emit notification event
    this.eventEmitter.emit(NOTIFICATION_EVENTS.APPOINTMENT_CANCELLED, {
      tenantId: user.tenantId,
      recipientUserIds: [appointment.doctorId],
      appointmentId: id,
      patientName: appointment.patient.name,
      doctorId: appointment.doctorId,
      cancelReason: dto.reason,
      entityType: 'appointment',
      entityId: id,
    });

    return updated;
  }

  async getTodayStats(user: JwtPayload) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where: Prisma.AppointmentWhereInput = {
      tenantId: user.tenantId,
      scheduledAt: { gte: today, lt: tomorrow },
    };

    // Branch scoping for non-admin users
    if (!ADMIN_ROLES.includes(user.role) && user.branchIds.length > 0) {
      where.branchId = { in: user.branchIds };
    }

    const appointments = await this.prisma.appointment.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    const statusCounts = appointments.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      confirmed: statusCounts[AppointmentStatus.CONFIRMED] || 0,
      completed: statusCounts[AppointmentStatus.COMPLETED] || 0,
      waiting: (statusCounts[AppointmentStatus.ARRIVED] || 0) +
               (statusCounts[AppointmentStatus.IN_PROGRESS] || 0),
      noShow: statusCounts[AppointmentStatus.NO_SHOW] || 0,
      cancelled: statusCounts[AppointmentStatus.CANCELLED] || 0,
    };
  }
}
