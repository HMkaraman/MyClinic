import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationProvider, IntegrationType } from '@prisma/client';
import { IntegrationsConfigService } from '../config/integrations-config.service';
import * as crypto from 'crypto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly integrationsConfigService: IntegrationsConfigService,
  ) {}

  async handleStripeWebhook(
    tenantId: string,
    rawBody: string,
    signature: string,
  ) {
    try {
      const integration = await this.getIntegration(
        tenantId,
        IntegrationProvider.STRIPE,
      );

      if (!integration) {
        this.logger.warn(`No Stripe integration found for tenant ${tenantId}`);
        return { received: true };
      }

      const credentials = await this.integrationsConfigService.getDecryptedCredentials(
        integration.credentials as string,
      );

      // Verify webhook signature if webhook secret is configured
      if (credentials.webhookSecret) {
        const isValid = this.verifyStripeSignature(
          rawBody,
          signature,
          credentials.webhookSecret,
        );

        if (!isValid) {
          throw new BadRequestException('Invalid webhook signature');
        }
      }

      const event = JSON.parse(rawBody);

      // Log the webhook event
      await this.logWebhook(tenantId, integration.id, 'STRIPE_WEBHOOK', event);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          this.eventEmitter.emit('payment.succeeded', {
            tenantId,
            provider: 'stripe',
            paymentId: event.data.object.id,
            amount: event.data.object.amount / 100,
            currency: event.data.object.currency,
            metadata: event.data.object.metadata,
          });
          break;

        case 'payment_intent.payment_failed':
          this.eventEmitter.emit('payment.failed', {
            tenantId,
            provider: 'stripe',
            paymentId: event.data.object.id,
            error: event.data.object.last_payment_error?.message,
            metadata: event.data.object.metadata,
          });
          break;

        case 'charge.refunded':
          this.eventEmitter.emit('payment.refunded', {
            tenantId,
            provider: 'stripe',
            paymentId: event.data.object.payment_intent,
            refundId: event.data.object.refunds.data[0]?.id,
            amount: event.data.object.amount_refunded / 100,
          });
          break;

        default:
          this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing Stripe webhook', error);
      throw error;
    }
  }

  async handleTapWebhook(
    tenantId: string,
    body: any,
    signature: string,
  ) {
    try {
      const integration = await this.getIntegration(
        tenantId,
        IntegrationProvider.TAP_PAYMENTS,
      );

      if (!integration) {
        this.logger.warn(`No Tap integration found for tenant ${tenantId}`);
        return { received: true };
      }

      // Log the webhook event
      await this.logWebhook(tenantId, integration.id, 'TAP_WEBHOOK', body);

      // Handle Tap webhook events
      const event = body;

      if (event.object === 'charge') {
        switch (event.status) {
          case 'CAPTURED':
            this.eventEmitter.emit('payment.succeeded', {
              tenantId,
              provider: 'tap',
              paymentId: event.id,
              amount: event.amount,
              currency: event.currency,
              metadata: event.metadata,
            });
            break;

          case 'FAILED':
          case 'CANCELLED':
            this.eventEmitter.emit('payment.failed', {
              tenantId,
              provider: 'tap',
              paymentId: event.id,
              error: event.response?.message,
              metadata: event.metadata,
            });
            break;

          case 'REFUNDED':
            this.eventEmitter.emit('payment.refunded', {
              tenantId,
              provider: 'tap',
              paymentId: event.id,
              amount: event.refund?.amount ?? event.amount,
            });
            break;
        }
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing Tap webhook', error);
      throw error;
    }
  }

  async handleHyperPayWebhook(tenantId: string, body: any) {
    try {
      const integration = await this.getIntegration(
        tenantId,
        IntegrationProvider.HYPERPAY,
      );

      if (!integration) {
        this.logger.warn(`No HyperPay integration found for tenant ${tenantId}`);
        return { received: true };
      }

      // Log the webhook event
      await this.logWebhook(tenantId, integration.id, 'HYPERPAY_WEBHOOK', body);

      // Handle HyperPay webhook
      const result = body.result?.code;

      if (result) {
        const isSuccess = /^(000\.000\.|000\.100\.1|000\.[36])/.test(result);

        if (isSuccess) {
          this.eventEmitter.emit('payment.succeeded', {
            tenantId,
            provider: 'hyperpay',
            paymentId: body.id,
            amount: parseFloat(body.amount ?? '0'),
            currency: body.currency,
            metadata: body.customParameters,
          });
        } else if (/^(000\.400\.0|100\.400\.)/.test(result)) {
          // Pending status
          this.logger.debug('HyperPay payment pending');
        } else {
          this.eventEmitter.emit('payment.failed', {
            tenantId,
            provider: 'hyperpay',
            paymentId: body.id,
            error: body.result?.description,
          });
        }
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing HyperPay webhook', error);
      throw error;
    }
  }

  async handleTwilioWebhook(
    tenantId: string,
    body: any,
    signature: string,
  ) {
    try {
      // Find either SMS or WhatsApp integration
      let integration = await this.getIntegration(
        tenantId,
        IntegrationProvider.TWILIO_SMS,
      );

      if (!integration) {
        integration = await this.getIntegration(
          tenantId,
          IntegrationProvider.TWILIO_WHATSAPP,
        );
      }

      if (!integration) {
        this.logger.warn(`No Twilio integration found for tenant ${tenantId}`);
        return { received: true };
      }

      // Log the webhook event
      await this.logWebhook(tenantId, integration.id, 'TWILIO_WEBHOOK', body);

      // Handle Twilio status callbacks
      const messageStatus = body.MessageStatus;
      const messageSid = body.MessageSid;

      if (messageStatus && messageSid) {
        this.eventEmitter.emit('message.status', {
          tenantId,
          provider: 'twilio',
          messageId: messageSid,
          status: messageStatus,
          to: body.To,
          from: body.From,
          errorCode: body.ErrorCode,
          errorMessage: body.ErrorMessage,
        });
      }

      // Handle incoming messages
      if (body.Body && body.From) {
        this.eventEmitter.emit('message.received', {
          tenantId,
          provider: 'twilio',
          messageId: messageSid,
          from: body.From,
          to: body.To,
          body: body.Body,
          mediaUrl: body.MediaUrl0,
          numMedia: parseInt(body.NumMedia ?? '0', 10),
        });
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error processing Twilio webhook', error);
      throw error;
    }
  }

  private async getIntegration(tenantId: string, provider: IntegrationProvider) {
    return this.prisma.integrationConfig.findFirst({
      where: {
        tenantId,
        provider,
        isActive: true,
      },
    });
  }

  private verifyStripeSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    try {
      const elements = signature.split(',');
      const timestampElement = elements.find((e) => e.startsWith('t='));
      const signatureElement = elements.find((e) => e.startsWith('v1='));

      if (!timestampElement || !signatureElement) {
        return false;
      }

      const timestamp = timestampElement.split('=')[1];
      const expectedSignature = signatureElement.split('=')[1];

      const signedPayload = `${timestamp}.${payload}`;
      const computedSignature = crypto
        .createHmac('sha256', secret)
        .update(signedPayload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(computedSignature),
      );
    } catch {
      return false;
    }
  }

  private async logWebhook(
    tenantId: string,
    configId: string,
    action: string,
    payload: any,
  ) {
    await this.prisma.integrationLog.create({
      data: {
        tenantId,
        configId,
        action,
        status: 'SUCCESS',
        request: payload,
      },
    });
  }
}
