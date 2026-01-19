import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider, IntegrationType } from '@prisma/client';
import {
  IWhatsAppProvider,
  SendWhatsAppParams,
  SendWhatsAppTemplateParams,
  SendWhatsAppResult,
} from '../provider.interface';

interface TwilioWhatsAppCredentials {
  accountSid: string;
  authToken: string;
  fromNumber: string; // e.g., "whatsapp:+14155238886"
}

interface TwilioResponse {
  sid?: string;
  message?: string;
}

@Injectable()
export class TwilioWhatsAppProvider implements IWhatsAppProvider {
  private readonly logger = new Logger(TwilioWhatsAppProvider.name);
  readonly provider = IntegrationProvider.TWILIO_WHATSAPP;
  readonly type = IntegrationType.WHATSAPP;

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    const creds = credentials as TwilioWhatsAppCredentials;
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}.json`,
        {
          method: 'GET',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${creds.accountSid}:${creds.authToken}`,
            ).toString('base64')}`,
          },
        },
      );

      return response.ok;
    } catch (error) {
      this.logger.error('Twilio WhatsApp connection test failed', error);
      return false;
    }
  }

  async sendMessage(
    params: SendWhatsAppParams,
    credentials: Record<string, any>,
  ): Promise<SendWhatsAppResult> {
    const creds = credentials as TwilioWhatsAppCredentials;
    try {
      const formData = new URLSearchParams();
      formData.append('To', this.formatWhatsAppNumber(params.to));
      formData.append('From', creds.fromNumber);
      formData.append('Body', params.message);

      if (params.mediaUrl) {
        formData.append('MediaUrl', params.mediaUrl);
      }

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${creds.accountSid}:${creds.authToken}`,
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        },
      );

      const data = (await response.json()) as TwilioResponse;

      if (response.ok) {
        return {
          success: true,
          messageId: data.sid,
        };
      } else {
        return {
          success: false,
          error: data.message ?? 'Failed to send WhatsApp message',
        };
      }
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message via Twilio', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendTemplate(
    params: SendWhatsAppTemplateParams,
    credentials: Record<string, any>,
  ): Promise<SendWhatsAppResult> {
    const creds = credentials as TwilioWhatsAppCredentials;
    try {
      // Twilio WhatsApp uses Content Templates through the Content API
      // For simplicity, we'll use a regular message with template formatting
      const formData = new URLSearchParams();
      formData.append('To', this.formatWhatsAppNumber(params.to));
      formData.append('From', creds.fromNumber);

      // Build message from template parameters
      let message = params.templateName;
      for (const [key, value] of Object.entries(params.templateParams)) {
        message = message.replace(`{{${key}}}`, value);
      }
      formData.append('Body', message);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${creds.accountSid}:${creds.authToken}`,
            ).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        },
      );

      const data = (await response.json()) as TwilioResponse;

      if (response.ok) {
        return {
          success: true,
          messageId: data.sid,
        };
      } else {
        return {
          success: false,
          error: data.message ?? 'Failed to send WhatsApp template',
        };
      }
    } catch (error) {
      this.logger.error('Failed to send WhatsApp template via Twilio', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private formatWhatsAppNumber(phone: string): string {
    // Ensure the number is in WhatsApp format
    if (phone.startsWith('whatsapp:')) {
      return phone;
    }
    // Remove any non-numeric characters except +
    const cleaned = phone.replace(/[^+\d]/g, '');
    return `whatsapp:${cleaned}`;
  }
}
