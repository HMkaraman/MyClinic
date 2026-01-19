import { IntegrationProvider, IntegrationType } from '@prisma/client';

// Base provider interface
export interface IProvider {
  readonly provider: IntegrationProvider;
  readonly type: IntegrationType;

  testConnection(credentials: Record<string, any>): Promise<boolean>;
}

// SMS Provider Interface
export interface ISmsProvider extends IProvider {
  sendSms(params: SendSmsParams, credentials: Record<string, any>): Promise<SendSmsResult>;
}

export interface SendSmsParams {
  to: string;
  message: string;
  from?: string;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

// WhatsApp Provider Interface
export interface IWhatsAppProvider extends IProvider {
  sendMessage(params: SendWhatsAppParams, credentials: Record<string, any>): Promise<SendWhatsAppResult>;
  sendTemplate(params: SendWhatsAppTemplateParams, credentials: Record<string, any>): Promise<SendWhatsAppResult>;
}

export interface SendWhatsAppParams {
  to: string;
  message: string;
  mediaUrl?: string;
}

export interface SendWhatsAppTemplateParams {
  to: string;
  templateName: string;
  templateParams: Record<string, string>;
  language?: string;
}

export interface SendWhatsAppResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Payment Provider Interface
export interface IPaymentProvider extends IProvider {
  createPaymentIntent(params: CreatePaymentParams, credentials: Record<string, any>): Promise<PaymentIntentResult>;
  confirmPayment(paymentIntentId: string, credentials: Record<string, any>): Promise<PaymentResult>;
  refundPayment(paymentId: string, amount?: number, credentials?: Record<string, any>): Promise<RefundResult>;
  getPaymentStatus(paymentId: string, credentials: Record<string, any>): Promise<PaymentStatus>;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  redirectUrl?: string;
  error?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  status: PaymentStatus;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}

export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';

// Provider Registry
export const PROVIDER_TOKENS = {
  SMS_PROVIDER: 'SMS_PROVIDER',
  WHATSAPP_PROVIDER: 'WHATSAPP_PROVIDER',
  PAYMENT_PROVIDER: 'PAYMENT_PROVIDER',
} as const;
