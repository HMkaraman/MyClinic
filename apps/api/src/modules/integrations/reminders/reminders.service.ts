import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationType, AppointmentStatus } from '@prisma/client';
import { IntegrationsConfigService } from '../config/integrations-config.service';
import { TwilioSmsProvider } from '../providers/sms/twilio.provider';
import { TwilioWhatsAppProvider } from '../providers/whatsapp/twilio-whatsapp.provider';

interface ReminderTemplate {
  sms: string;
  whatsapp: string;
}

interface AppointmentWithRelations {
  id: string;
  scheduledAt: Date;
  notes: string | null;
  patient: {
    id: string;
    name: string;
    phone: string;
  };
  branch: {
    id: string;
    name: string;
    tenant: {
      id: string;
      name: string;
    };
  };
}

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  // Default reminder templates
  private readonly templates: Record<string, ReminderTemplate> = {
    appointment_reminder_24h: {
      sms: 'Reminder: You have an appointment at {{clinicName}} tomorrow at {{time}}. Please arrive 10 minutes early.',
      whatsapp: 'Hi {{patientName}},\n\nThis is a reminder that you have an appointment at *{{clinicName}}* tomorrow at *{{time}}*.\n\nPlease arrive 10 minutes early.\n\nReply YES to confirm or call us to reschedule.',
    },
    appointment_reminder_1h: {
      sms: 'Reminder: Your appointment at {{clinicName}} is in 1 hour at {{time}}.',
      whatsapp: 'Hi {{patientName}},\n\nYour appointment at *{{clinicName}}* is in 1 hour at *{{time}}*.\n\nSee you soon!',
    },
    appointment_confirmed: {
      sms: 'Your appointment at {{clinicName}} on {{date}} at {{time}} has been confirmed.',
      whatsapp: 'Hi {{patientName}},\n\nYour appointment has been confirmed:\n\n*Date:* {{date}}\n*Time:* {{time}}\n*Location:* {{clinicName}}\n\nThank you!',
    },
    appointment_cancelled: {
      sms: 'Your appointment at {{clinicName}} on {{date}} at {{time}} has been cancelled. Please contact us to reschedule.',
      whatsapp: 'Hi {{patientName}},\n\nYour appointment at *{{clinicName}}* on *{{date}}* at *{{time}}* has been cancelled.\n\nPlease contact us to reschedule.',
    },
  };

  // Track sent reminders in memory (in production, this would be stored in database)
  private sentReminders: Set<string> = new Set();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly integrationsConfigService: IntegrationsConfigService,
    private readonly twilioSmsProvider: TwilioSmsProvider,
    private readonly twilioWhatsAppProvider: TwilioWhatsAppProvider,
  ) {}

  // Run every hour to send 24-hour reminders
  @Cron(CronExpression.EVERY_HOUR)
  async sendDayBeforeReminders() {
    this.logger.log('Starting 24-hour appointment reminder job');

    const tenants = await this.prisma.tenant.findMany({
      select: { id: true },
    });

    for (const tenant of tenants) {
      await this.processTenantReminders(tenant.id, 24);
    }
  }

  // Run every 30 minutes to send 1-hour reminders
  @Cron('0,30 * * * *')
  async sendHourBeforeReminders() {
    this.logger.log('Starting 1-hour appointment reminder job');

    const tenants = await this.prisma.tenant.findMany({
      select: { id: true },
    });

    for (const tenant of tenants) {
      await this.processTenantReminders(tenant.id, 1);
    }
  }

  private async processTenantReminders(tenantId: string, hoursBefore: number) {
    try {
      // Get active SMS/WhatsApp integrations
      const smsIntegration = await this.getActiveIntegration(
        tenantId,
        IntegrationType.SMS,
      );
      const whatsappIntegration = await this.getActiveIntegration(
        tenantId,
        IntegrationType.WHATSAPP,
      );

      if (!smsIntegration && !whatsappIntegration) {
        return; // No messaging integrations configured
      }

      // Get upcoming appointments that haven't been reminded
      const now = new Date();
      const reminderTime = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);
      const reminderWindowStart = new Date(reminderTime.getTime() - 30 * 60 * 1000); // 30 min window
      const reminderWindowEnd = new Date(reminderTime.getTime() + 30 * 60 * 1000);

      const appointments = await this.prisma.appointment.findMany({
        where: {
          tenantId,
          scheduledAt: {
            gte: reminderWindowStart,
            lte: reminderWindowEnd,
          },
          status: {
            in: [AppointmentStatus.NEW, AppointmentStatus.CONFIRMED],
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          branch: {
            include: {
              tenant: true,
            },
          },
        },
      });

      // Filter out already-reminded appointments
      const appointmentsToRemind = appointments.filter(
        (apt) => !this.hasBeenReminded(apt.id, hoursBefore),
      );

      this.logger.log(
        `Found ${appointmentsToRemind.length} appointments for ${hoursBefore}h reminder (tenant: ${tenantId})`,
      );

      for (const appointment of appointmentsToRemind) {
        await this.sendAppointmentReminder(
          tenantId,
          appointment as AppointmentWithRelations,
          hoursBefore,
          smsIntegration,
          whatsappIntegration,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error processing reminders for tenant ${tenantId}`,
        error,
      );
    }
  }

  private hasBeenReminded(appointmentId: string, hoursBefore: number): boolean {
    const key = `${appointmentId}-${hoursBefore}h`;
    return this.sentReminders.has(key);
  }

  private markAsReminded(appointmentId: string, hoursBefore: number): void {
    const key = `${appointmentId}-${hoursBefore}h`;
    this.sentReminders.add(key);
  }

  private async sendAppointmentReminder(
    tenantId: string,
    appointment: AppointmentWithRelations,
    hoursBefore: number,
    smsIntegration: any,
    whatsappIntegration: any,
  ) {
    const patient = appointment.patient;
    const phone = patient.phone;

    if (!phone) {
      this.logger.debug(
        `No phone number for patient ${patient.id}, skipping reminder`,
      );
      return;
    }

    const templateKey =
      hoursBefore === 24 ? 'appointment_reminder_24h' : 'appointment_reminder_1h';
    const template = this.templates[templateKey];

    const params = {
      patientName: patient.name,
      clinicName: appointment.branch.tenant.name,
      date: this.formatDate(appointment.scheduledAt),
      time: this.formatTime(appointment.scheduledAt),
    };

    // Try WhatsApp first, then SMS
    let sent = false;

    if (whatsappIntegration) {
      sent = await this.sendWhatsAppReminder(
        tenantId,
        whatsappIntegration,
        phone,
        template.whatsapp,
        params,
        appointment.id,
      );
    }

    if (!sent && smsIntegration) {
      sent = await this.sendSmsReminder(
        tenantId,
        smsIntegration,
        phone,
        template.sms,
        params,
        appointment.id,
      );
    }

    if (sent) {
      this.markAsReminded(appointment.id, hoursBefore);
    }
  }

  private async sendSmsReminder(
    tenantId: string,
    integration: any,
    phone: string,
    template: string,
    params: Record<string, string>,
    appointmentId: string,
  ): Promise<boolean> {
    try {
      const credentials = await this.integrationsConfigService.getDecryptedCredentials(
        integration.credentials as string,
      );

      const message = this.renderTemplate(template, params);

      const result = await this.twilioSmsProvider.sendSms(
        { to: phone, message },
        credentials,
      );

      // Log the reminder
      await this.logReminder(
        tenantId,
        integration.id,
        'SMS_REMINDER',
        result.success ? 'SUCCESS' : 'FAILED',
        appointmentId,
        result.messageId,
        result.error,
      );

      if (result.success) {
        this.eventEmitter.emit('reminder.sent', {
          tenantId,
          channel: 'sms',
          appointmentId,
          messageId: result.messageId,
        });
      }

      return result.success;
    } catch (error) {
      this.logger.error('Failed to send SMS reminder', error);
      return false;
    }
  }

  private async sendWhatsAppReminder(
    tenantId: string,
    integration: any,
    phone: string,
    template: string,
    params: Record<string, string>,
    appointmentId: string,
  ): Promise<boolean> {
    try {
      const credentials = await this.integrationsConfigService.getDecryptedCredentials(
        integration.credentials as string,
      );

      const message = this.renderTemplate(template, params);

      const result = await this.twilioWhatsAppProvider.sendMessage(
        { to: phone, message },
        credentials,
      );

      // Log the reminder
      await this.logReminder(
        tenantId,
        integration.id,
        'WHATSAPP_REMINDER',
        result.success ? 'SUCCESS' : 'FAILED',
        appointmentId,
        result.messageId,
        result.error,
      );

      if (result.success) {
        this.eventEmitter.emit('reminder.sent', {
          tenantId,
          channel: 'whatsapp',
          appointmentId,
          messageId: result.messageId,
        });
      }

      return result.success;
    } catch (error) {
      this.logger.error('Failed to send WhatsApp reminder', error);
      return false;
    }
  }

  async sendManualReminder(
    tenantId: string,
    appointmentId: string,
    channel: 'sms' | 'whatsapp',
    userId: string,
  ) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        branch: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const integrationType =
      channel === 'sms' ? IntegrationType.SMS : IntegrationType.WHATSAPP;
    const integration = await this.getActiveIntegration(tenantId, integrationType);

    if (!integration) {
      throw new Error(`No active ${channel.toUpperCase()} integration found`);
    }

    const patient = appointment.patient;
    const phone = patient.phone;

    if (!phone) {
      throw new Error('Patient has no phone number');
    }

    const template = this.templates.appointment_confirmed;
    const params = {
      patientName: patient.name,
      clinicName: appointment.branch.tenant.name,
      date: this.formatDate(appointment.scheduledAt),
      time: this.formatTime(appointment.scheduledAt),
    };

    if (channel === 'sms') {
      return this.sendSmsReminder(
        tenantId,
        integration,
        phone,
        template.sms,
        params,
        appointmentId,
      );
    } else {
      return this.sendWhatsAppReminder(
        tenantId,
        integration,
        phone,
        template.whatsapp,
        params,
        appointmentId,
      );
    }
  }

  private async getActiveIntegration(tenantId: string, type: IntegrationType) {
    return this.prisma.integrationConfig.findFirst({
      where: {
        tenantId,
        type,
        isActive: true,
        isDefault: true,
      },
    });
  }

  private renderTemplate(
    template: string,
    params: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return result;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  private async logReminder(
    tenantId: string,
    configId: string,
    action: string,
    status: 'SUCCESS' | 'FAILED',
    appointmentId: string,
    messageId?: string,
    errorMessage?: string,
  ) {
    await this.prisma.integrationLog.create({
      data: {
        tenantId,
        configId,
        action,
        status,
        errorMessage,
        entityType: 'appointment',
        entityId: appointmentId,
        request: messageId ? { messageId } : undefined,
      },
    });
  }
}
