import { Injectable, NotFoundException } from '@nestjs/common';
import { TimeOffStatus, Role } from '@prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export interface UserAvailability {
  userId: string;
  userName: string;
  date: string;
  isAvailable: boolean;
  workSchedule: {
    startTime: string;
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
  } | null;
  timeOff: {
    type: string;
    reason?: string;
  } | null;
  appointments: {
    startTime: string;
    endTime: string;
    patientName: string;
  }[];
  availableSlots: AvailabilitySlot[];
}

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async checkUserAvailability(
    tenantId: string,
    userId: string,
    date: string,
    branchId?: string,
  ): Promise<UserAvailability> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: { id: true, name: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const targetDate = new Date(date);

    // Get work schedule for the date
    const scheduleWhere: any = {
      tenantId,
      userId,
      date: targetDate,
    };
    if (branchId) {
      scheduleWhere.branchId = branchId;
    }

    const workSchedule = await this.prisma.workSchedule.findFirst({
      where: scheduleWhere,
    });

    // Check for time off
    const timeOff = await this.prisma.timeOffRequest.findFirst({
      where: {
        tenantId,
        userId,
        status: TimeOffStatus.APPROVED,
        startDate: { lte: targetDate },
        endDate: { gte: targetDate },
      },
    });

    // Get appointments for the day
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointmentsWhere: any = {
      tenantId,
      doctorId: userId,
      scheduledAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
      status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    };
    if (branchId) {
      appointmentsWhere.branchId = branchId;
    }

    const appointments = await this.prisma.appointment.findMany({
      where: appointmentsWhere,
      orderBy: { scheduledAt: 'asc' },
      include: {
        patient: { select: { name: true } },
      },
    });

    const isAvailable = !!workSchedule && !timeOff;

    // Calculate available slots
    const availableSlots: AvailabilitySlot[] = [];
    if (isAvailable && workSchedule) {
      availableSlots.push(...this.calculateAvailableSlots(
        workSchedule.startTime,
        workSchedule.endTime,
        workSchedule.breakStart,
        workSchedule.breakEnd,
        appointments.map((a) => ({
          startTime: a.scheduledAt.toTimeString().slice(0, 5),
          endTime: new Date(
            a.scheduledAt.getTime() + a.durationMinutes * 60000,
          ).toTimeString().slice(0, 5),
        })),
      ));
    }

    return {
      userId: user.id,
      userName: user.name,
      date,
      isAvailable,
      workSchedule: workSchedule
        ? {
            startTime: workSchedule.startTime,
            endTime: workSchedule.endTime,
            breakStart: workSchedule.breakStart ?? undefined,
            breakEnd: workSchedule.breakEnd ?? undefined,
          }
        : null,
      timeOff: timeOff
        ? {
            type: timeOff.type,
            reason: timeOff.reason ?? undefined,
          }
        : null,
      appointments: appointments.map((a) => ({
        startTime: a.scheduledAt.toTimeString().slice(0, 5),
        endTime: new Date(
          a.scheduledAt.getTime() + a.durationMinutes * 60000,
        ).toTimeString().slice(0, 5),
        patientName: a.patient.name,
      })),
      availableSlots,
    };
  }

  async getAvailableDoctors(
    tenantId: string,
    branchId: string,
    date: string,
    startTime: string,
    durationMinutes: number,
  ) {
    const targetDate = new Date(date);
    const endTime = this.addMinutesToTime(startTime, durationMinutes);

    // Get all doctors
    const doctors = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: Role.DOCTOR,
        status: 'ACTIVE',
        branchIds: { has: branchId },
      },
      select: { id: true, name: true },
    });

    const availableDoctors: { id: string; name: string }[] = [];

    for (const doctor of doctors) {
      const availability = await this.checkUserAvailability(
        tenantId,
        doctor.id,
        date,
        branchId,
      );

      if (availability.isAvailable) {
        // Check if the requested time slot is available
        const isSlotAvailable = this.isSlotAvailable(
          startTime,
          endTime,
          availability.availableSlots,
        );

        if (isSlotAvailable) {
          availableDoctors.push({ id: doctor.id, name: doctor.name });
        }
      }
    }

    return availableDoctors;
  }

  async getDoctorScheduleForWeek(tenantId: string, userId: string, branchId: string, startDate: string) {
    const start = new Date(startDate);
    const weekSchedule: UserAvailability[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const availability = await this.checkUserAvailability(tenantId, userId, dateStr, branchId);
      weekSchedule.push(availability);
    }

    return weekSchedule;
  }

  private calculateAvailableSlots(
    workStart: string,
    workEnd: string,
    breakStart: string | null,
    breakEnd: string | null,
    appointments: { startTime: string; endTime: string }[],
  ): AvailabilitySlot[] {
    const slots: AvailabilitySlot[] = [];

    // Create time blocks excluding break and appointments
    let busyPeriods = [...appointments];

    if (breakStart && breakEnd) {
      busyPeriods.push({ startTime: breakStart, endTime: breakEnd });
    }

    // Sort by start time
    busyPeriods.sort((a, b) => a.startTime.localeCompare(b.startTime));

    let currentStart = workStart;

    for (const busy of busyPeriods) {
      if (busy.startTime > currentStart) {
        slots.push({
          startTime: currentStart,
          endTime: busy.startTime,
        });
      }
      if (busy.endTime > currentStart) {
        currentStart = busy.endTime;
      }
    }

    // Add remaining time until work end
    if (currentStart < workEnd) {
      slots.push({
        startTime: currentStart,
        endTime: workEnd,
      });
    }

    return slots;
  }

  private addMinutesToTime(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private isSlotAvailable(
    startTime: string,
    endTime: string,
    availableSlots: AvailabilitySlot[],
  ): boolean {
    for (const slot of availableSlots) {
      if (startTime >= slot.startTime && endTime <= slot.endTime) {
        return true;
      }
    }
    return false;
  }
}
