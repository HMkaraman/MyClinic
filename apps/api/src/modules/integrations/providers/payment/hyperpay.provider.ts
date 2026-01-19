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

interface HyperPayCredentials {
  entityId: string;
  accessToken: string;
  testMode?: boolean;
}

interface HyperPayResponse {
  id?: string;
  result?: {
    code: string;
    description: string;
  };
  amount?: string;
}

@Injectable()
export class HyperPayProvider implements IPaymentProvider {
  private readonly logger = new Logger(HyperPayProvider.name);
  readonly provider = IntegrationProvider.HYPERPAY;
  readonly type = IntegrationType.PAYMENT;

  private getBaseUrl(testMode: boolean = false): string {
    return testMode
      ? 'https://eu-test.oppwa.com'
      : 'https://eu-prod.oppwa.com';
  }

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    const creds = credentials as HyperPayCredentials;
    try {
      const baseUrl = this.getBaseUrl(creds.testMode);
      const response = await fetch(
        `${baseUrl}/v1/checkouts?entityId=${creds.entityId}&amount=1.00&currency=SAR&paymentType=DB`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${creds.accessToken}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.ok;
    } catch (error) {
      this.logger.error('HyperPay connection test failed', error);
      return false;
    }
  }

  async createPaymentIntent(
    params: CreatePaymentParams,
    credentials: Record<string, any>,
  ): Promise<PaymentIntentResult> {
    const creds = credentials as HyperPayCredentials;
    try {
      const baseUrl = this.getBaseUrl(creds.testMode);
      const body = new URLSearchParams();
      body.append('entityId', creds.entityId);
      body.append('amount', params.amount.toFixed(2));
      body.append('currency', params.currency.toUpperCase());
      body.append('paymentType', 'DB'); // Debit

      if (params.description) {
        body.append('merchantTransactionId', params.description.slice(0, 255));
      }

      if (params.customerId) {
        body.append('customer.id', params.customerId);
      }

      const response = await fetch(`${baseUrl}/v1/checkouts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = (await response.json()) as HyperPayResponse;

      if (response.ok && data.id) {
        return {
          success: true,
          paymentIntentId: data.id,
          redirectUrl: `${baseUrl}/v1/paymentWidgets.js?checkoutId=${data.id}`,
        };
      } else {
        return {
          success: false,
          error: data.result?.description ?? 'Failed to create checkout',
        };
      }
    } catch (error) {
      this.logger.error('Failed to create HyperPay checkout', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async confirmPayment(
    checkoutId: string,
    credentials: Record<string, any>,
  ): Promise<PaymentResult> {
    const creds = credentials as HyperPayCredentials;
    try {
      const baseUrl = this.getBaseUrl(creds.testMode);
      const response = await fetch(
        `${baseUrl}/v1/checkouts/${checkoutId}/payment?entityId=${creds.entityId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${creds.accessToken}`,
          },
        },
      );

      const data = (await response.json()) as HyperPayResponse;

      if (response.ok) {
        const isSuccess = this.isSuccessCode(data.result?.code ?? '');
        return {
          success: isSuccess,
          paymentId: data.id,
          status: isSuccess ? 'succeeded' : 'failed',
        };
      } else {
        return {
          success: false,
          status: 'failed',
          error: data.result?.description ?? 'Failed to confirm payment',
        };
      }
    } catch (error) {
      this.logger.error('Failed to confirm HyperPay payment', error);
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
    const creds = credentials as HyperPayCredentials;
    try {
      const baseUrl = this.getBaseUrl(creds.testMode);
      const body = new URLSearchParams();
      body.append('entityId', creds.entityId);
      body.append('paymentType', 'RF'); // Refund

      if (amount) {
        body.append('amount', amount.toFixed(2));
        body.append('currency', 'SAR'); // Default currency, should be passed
      }

      const response = await fetch(`${baseUrl}/v1/payments/${paymentId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${creds.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = (await response.json()) as HyperPayResponse;

      if (response.ok && this.isSuccessCode(data.result?.code ?? '')) {
        return {
          success: true,
          refundId: data.id,
          amount: parseFloat(data.amount ?? '0'),
        };
      } else {
        return {
          success: false,
          error: data.result?.description ?? 'Failed to create refund',
        };
      }
    } catch (error) {
      this.logger.error('Failed to create HyperPay refund', error);
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
    const creds = credentials as HyperPayCredentials;
    try {
      const baseUrl = this.getBaseUrl(creds.testMode);
      const response = await fetch(
        `${baseUrl}/v1/payments/${paymentId}?entityId=${creds.entityId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${creds.accessToken}`,
          },
        },
      );

      const data = (await response.json()) as HyperPayResponse;

      if (response.ok) {
        return this.isSuccessCode(data.result?.code ?? '') ? 'succeeded' : 'failed';
      }

      return 'failed';
    } catch (error) {
      this.logger.error('Failed to get HyperPay payment status', error);
      return 'failed';
    }
  }

  private isSuccessCode(code: string): boolean {
    // HyperPay success codes
    return /^(000\.000\.|000\.100\.1|000\.[36])/.test(code);
  }
}
