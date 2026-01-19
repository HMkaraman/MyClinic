import { Injectable, Logger } from '@nestjs/common';
import { IntegrationProvider, IntegrationType } from '@prisma/client';
import {
  IPaymentProvider,
  CreatePaymentParams,
  PaymentIntentResult,
  PaymentResult,
  RefundResult,
  PaymentStatus,
} from '../provider.interface';

interface TapCredentials {
  secretKey: string;
  webhookSecret?: string;
}

interface TapResponse {
  id?: string;
  status?: string;
  amount?: number;
  transaction?: {
    url?: string;
  };
  errors?: Array<{ description?: string }>;
}

@Injectable()
export class TapProvider implements IPaymentProvider {
  private readonly logger = new Logger(TapProvider.name);
  readonly provider = IntegrationProvider.TAP_PAYMENTS;
  readonly type = IntegrationType.PAYMENT;
  private readonly baseUrl = 'https://api.tap.company/v2';

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    const creds = credentials as TapCredentials;
    try {
      const response = await fetch(`${this.baseUrl}/test`, {
        method: 'GET',
        headers: this.getHeaders(creds.secretKey),
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Tap Payments connection test failed', error);
      return false;
    }
  }

  async createPaymentIntent(
    params: CreatePaymentParams,
    credentials: Record<string, any>,
  ): Promise<PaymentIntentResult> {
    const creds = credentials as TapCredentials;
    try {
      const body = {
        amount: params.amount,
        currency: params.currency.toUpperCase(),
        description: params.description,
        customer: params.customerId ? { id: params.customerId } : undefined,
        metadata: params.metadata,
        source: { id: 'src_all' }, // Accept all payment methods
        redirect: {
          url: params.returnUrl ?? `${process.env.APP_URL}/payment/callback`,
        },
      };

      const response = await fetch(`${this.baseUrl}/charges`, {
        method: 'POST',
        headers: this.getHeaders(creds.secretKey),
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as TapResponse;

      if (response.ok && data.id) {
        return {
          success: true,
          paymentIntentId: data.id,
          redirectUrl: data.transaction?.url,
        };
      } else {
        return {
          success: false,
          error: data.errors?.[0]?.description ?? 'Failed to create charge',
        };
      }
    } catch (error) {
      this.logger.error('Failed to create Tap payment', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async confirmPayment(
    chargeId: string,
    credentials: Record<string, any>,
  ): Promise<PaymentResult> {
    const creds = credentials as TapCredentials;
    try {
      const response = await fetch(`${this.baseUrl}/charges/${chargeId}`, {
        method: 'GET',
        headers: this.getHeaders(creds.secretKey),
      });

      const data = (await response.json()) as TapResponse;

      if (response.ok) {
        return {
          success: data.status === 'CAPTURED',
          paymentId: data.id,
          status: this.mapTapStatus(data.status ?? ''),
        };
      } else {
        return {
          success: false,
          status: 'failed',
          error: data.errors?.[0]?.description ?? 'Failed to confirm payment',
        };
      }
    } catch (error) {
      this.logger.error('Failed to confirm Tap payment', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async refundPayment(
    chargeId: string,
    amount?: number,
    credentials?: Record<string, any>,
  ): Promise<RefundResult> {
    const creds = credentials as TapCredentials;
    try {
      const body: { charge_id: string; reason: string; amount?: number } = {
        charge_id: chargeId,
        reason: 'requested_by_customer',
      };

      if (amount) {
        body.amount = amount;
      }

      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: this.getHeaders(creds.secretKey),
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as TapResponse;

      if (response.ok && data.id) {
        return {
          success: true,
          refundId: data.id,
          amount: data.amount,
        };
      } else {
        return {
          success: false,
          error: data.errors?.[0]?.description ?? 'Failed to create refund',
        };
      }
    } catch (error) {
      this.logger.error('Failed to create Tap refund', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getPaymentStatus(
    chargeId: string,
    credentials: Record<string, any>,
  ): Promise<PaymentStatus> {
    const creds = credentials as TapCredentials;
    try {
      const response = await fetch(`${this.baseUrl}/charges/${chargeId}`, {
        method: 'GET',
        headers: this.getHeaders(creds.secretKey),
      });

      const data = (await response.json()) as TapResponse;

      if (response.ok) {
        return this.mapTapStatus(data.status ?? '');
      }

      return 'failed';
    } catch (error) {
      this.logger.error('Failed to get Tap payment status', error);
      return 'failed';
    }
  }

  private getHeaders(secretKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  private mapTapStatus(tapStatus: string): PaymentStatus {
    switch (tapStatus) {
      case 'CAPTURED':
        return 'succeeded';
      case 'AUTHORIZED':
      case 'INITIATED':
        return 'processing';
      case 'PENDING':
        return 'pending';
      case 'CANCELLED':
      case 'VOID':
        return 'cancelled';
      case 'REFUNDED':
        return 'refunded';
      default:
        return 'failed';
    }
  }
}
