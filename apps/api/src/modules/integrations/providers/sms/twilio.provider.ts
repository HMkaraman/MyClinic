import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider, IntegrationType } from '@prisma/client';
import { ISmsProvider, SendSmsParams, SendSmsResult } from '../provider.interface';

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

interface TwilioResponse {
  sid?: string;
  price?: string;
  message?: string;
}

@Injectable()
export class TwilioSmsProvider implements ISmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);
  readonly provider = IntegrationProvider.TWILIO_SMS;
  readonly type = IntegrationType.SMS;

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    const creds = credentials as TwilioCredentials;
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
      this.logger.error('Twilio connection test failed', error);
      return false;
    }
  }

  async sendSms(
    params: SendSmsParams,
    credentials: Record<string, any>,
  ): Promise<SendSmsResult> {
    const creds = credentials as TwilioCredentials;
    try {
      const formData = new URLSearchParams();
      formData.append('To', params.to);
      formData.append('From', params.from ?? creds.fromNumber);
      formData.append('Body', params.message);

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
          cost: parseFloat(data.price ?? '0'),
        };
      } else {
        return {
          success: false,
          error: data.message ?? 'Failed to send SMS',
        };
      }
    } catch (error) {
      this.logger.error('Failed to send SMS via Twilio', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
