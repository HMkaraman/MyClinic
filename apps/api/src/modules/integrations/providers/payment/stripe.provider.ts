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

interface StripeCredentials {
  secretKey: string;
  webhookSecret?: string;
}

interface StripeResponse {
  id?: string;
  client_secret?: string;
  status?: string;
  amount?: number;
  amount_refunded?: number;
  error?: {
    message: string;
  };
}

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);
  readonly provider = IntegrationProvider.STRIPE;
  readonly type = IntegrationType.PAYMENT;
  private readonly baseUrl = 'https://api.stripe.com/v1';

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    const creds = credentials as StripeCredentials;
    try {
      const response = await fetch(`${this.baseUrl}/account`, {
        method: 'GET',
        headers: this.getHeaders(creds.secretKey),
      });

      return response.ok;
    } catch (error) {
      this.logger.error('Stripe connection test failed', error);
      return false;
    }
  }

  async createPaymentIntent(
    params: CreatePaymentParams,
    credentials: Record<string, any>,
  ): Promise<PaymentIntentResult> {
    const creds = credentials as StripeCredentials;
    try {
      const body = new URLSearchParams();
      body.append('amount', Math.round(params.amount * 100).toString()); // Convert to cents
      body.append('currency', params.currency.toLowerCase());

      if (params.description) {
        body.append('description', params.description);
      }

      if (params.customerId) {
        body.append('customer', params.customerId);
      }

      if (params.metadata) {
        for (const [key, value] of Object.entries(params.metadata)) {
          body.append(`metadata[${key}]`, value);
        }
      }

      body.append('automatic_payment_methods[enabled]', 'true');

      const response = await fetch(`${this.baseUrl}/payment_intents`, {
        method: 'POST',
        headers: this.getHeaders(creds.secretKey),
        body: body.toString(),
      });

      const data = (await response.json()) as StripeResponse;

      if (response.ok) {
        return {
          success: true,
          paymentIntentId: data.id,
          clientSecret: data.client_secret,
        };
      } else {
        return {
          success: false,
          error: data.error?.message ?? 'Failed to create payment intent',
        };
      }
    } catch (error) {
      this.logger.error('Failed to create Stripe payment intent', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async confirmPayment(
    paymentIntentId: string,
    credentials: Record<string, any>,
  ): Promise<PaymentResult> {
    const creds = credentials as StripeCredentials;
    try {
      const response = await fetch(
        `${this.baseUrl}/payment_intents/${paymentIntentId}/confirm`,
        {
          method: 'POST',
          headers: this.getHeaders(creds.secretKey),
        },
      );

      const data = (await response.json()) as StripeResponse;

      if (response.ok) {
        return {
          success: data.status === 'succeeded',
          paymentId: data.id,
          status: this.mapStripeStatus(data.status ?? ''),
        };
      } else {
        return {
          success: false,
          status: 'failed',
          error: data.error?.message ?? 'Failed to confirm payment',
        };
      }
    } catch (error) {
      this.logger.error('Failed to confirm Stripe payment', error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async refundPayment(
    paymentId: string,
    amount?: number,
    credentials?: Record<string, any>,
  ): Promise<RefundResult> {
    const creds = credentials as StripeCredentials;
    try {
      const body = new URLSearchParams();
      body.append('payment_intent', paymentId);

      if (amount) {
        body.append('amount', Math.round(amount * 100).toString());
      }

      const response = await fetch(`${this.baseUrl}/refunds`, {
        method: 'POST',
        headers: this.getHeaders(creds.secretKey),
        body: body.toString(),
      });

      const data = (await response.json()) as StripeResponse;

      if (response.ok) {
        return {
          success: true,
          refundId: data.id,
          amount: (data.amount ?? 0) / 100,
        };
      } else {
        return {
          success: false,
          error: data.error?.message ?? 'Failed to create refund',
        };
      }
    } catch (error) {
      this.logger.error('Failed to create Stripe refund', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getPaymentStatus(
    paymentId: string,
    credentials: Record<string, any>,
  ): Promise<PaymentStatus> {
    const creds = credentials as StripeCredentials;
    try {
      const response = await fetch(`${this.baseUrl}/payment_intents/${paymentId}`, {
        method: 'GET',
        headers: this.getHeaders(creds.secretKey),
      });

      const data = (await response.json()) as StripeResponse;

      if (response.ok) {
        return this.mapStripeStatus(data.status ?? '');
      }

      return 'failed';
    } catch (error) {
      this.logger.error('Failed to get Stripe payment status', error);
      return 'failed';
    }
  }

  private getHeaders(secretKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };
  }

  private mapStripeStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'succeeded':
        return 'succeeded';
      case 'processing':
        return 'processing';
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return 'pending';
      case 'canceled':
        return 'cancelled';
      default:
        return 'failed';
    }
  }
}
