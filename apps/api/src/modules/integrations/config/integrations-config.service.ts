import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationProvider, IntegrationType, IntegrationLogStatus, Prisma } from '@prisma/client';
import { CreateIntegrationDto, UpdateIntegrationDto, QueryIntegrationsDto } from './dto';
import { EncryptionUtil } from '../utils/encryption.util';

// Import providers
import { TwilioSmsProvider } from '../providers/sms/twilio.provider';
import { TwilioWhatsAppProvider } from '../providers/whatsapp/twilio-whatsapp.provider';
import { StripeProvider } from '../providers/payment/stripe.provider';
import { TapProvider } from '../providers/payment/tap.provider';
import { HyperPayProvider } from '../providers/payment/hyperpay.provider';

@Injectable()
export class IntegrationsConfigService {
  private readonly logger = new Logger(IntegrationsConfigService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly twilioSmsProvider: TwilioSmsProvider,
    private readonly twilioWhatsAppProvider: TwilioWhatsAppProvider,
    private readonly stripeProvider: StripeProvider,
    private readonly tapProvider: TapProvider,
    private readonly hyperPayProvider: HyperPayProvider,
  ) {}

  async create(tenantId: string, dto: CreateIntegrationDto) {
    // Check if integration already exists for this provider
    const existing = await this.prisma.integrationConfig.findFirst({
      where: {
        tenantId,
        provider: dto.provider,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Integration for ${dto.provider} already exists`,
      );
    }

    // Encrypt credentials
    const encryptedCredentials = await EncryptionUtil.encrypt(
      JSON.stringify(dto.credentials),
    );

    // If setting as default, unset other defaults of same type
    if (dto.isDefault) {
      await this.prisma.integrationConfig.updateMany({
        where: {
          tenantId,
          type: dto.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    const integration = await this.prisma.integrationConfig.create({
      data: {
        tenantId,
        provider: dto.provider,
        type: dto.type,
        displayName: dto.displayName,
        credentials: encryptedCredentials,
        settings: dto.settings ?? {},
        isActive: dto.isActive ?? false,
        isDefault: dto.isDefault ?? false,
      },
    });

    this.eventEmitter.emit('integration.created', {
      tenantId,
      integrationId: integration.id,
      provider: integration.provider,
      type: integration.type,
    });

    return this.sanitizeIntegration(integration);
  }

  async findAll(tenantId: string, query: QueryIntegrationsDto) {
    const where: Prisma.IntegrationConfigWhereInput = {
      tenantId,
    };

    if (query.provider) {
      where.provider = query.provider;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isDefault !== undefined) {
      where.isDefault = query.isDefault;
    }

    const integrations = await this.prisma.integrationConfig.findMany({
      where,
      orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { displayName: 'asc' }],
    });

    return integrations.map((i) => this.sanitizeIntegration(i));
  }

  async findOne(tenantId: string, id: string) {
    const integration = await this.prisma.integrationConfig.findFirst({
      where: { id, tenantId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    return this.sanitizeIntegration(integration);
  }

  async findDefault(tenantId: string, type: IntegrationType) {
    const integration = await this.prisma.integrationConfig.findFirst({
      where: {
        tenantId,
        type,
        isDefault: true,
        isActive: true,
      },
    });

    return integration ? this.sanitizeIntegration(integration) : null;
  }

  async update(tenantId: string, id: string, dto: UpdateIntegrationDto) {
    const existing = await this.prisma.integrationConfig.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Integration not found');
    }

    const updateData: Prisma.IntegrationConfigUpdateInput = {};

    if (dto.displayName !== undefined) {
      updateData.displayName = dto.displayName;
    }

    if (dto.credentials !== undefined) {
      updateData.credentials = await EncryptionUtil.encrypt(
        JSON.stringify(dto.credentials),
      );
      updateData.lastTestedAt = null; // Reset test status when credentials change
      updateData.lastTestSuccess = null;
    }

    if (dto.settings !== undefined) {
      updateData.settings = dto.settings;
    }

    if (dto.isActive !== undefined) {
      updateData.isActive = dto.isActive;
    }

    if (dto.isDefault !== undefined) {
      // If setting as default, unset other defaults of same type
      if (dto.isDefault) {
        await this.prisma.integrationConfig.updateMany({
          where: {
            tenantId,
            type: existing.type,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });
      }
      updateData.isDefault = dto.isDefault;
    }

    const integration = await this.prisma.integrationConfig.update({
      where: { id },
      data: updateData,
    });

    this.eventEmitter.emit('integration.updated', {
      tenantId,
      integrationId: integration.id,
      provider: integration.provider,
      type: integration.type,
    });

    return this.sanitizeIntegration(integration);
  }

  async delete(tenantId: string, id: string) {
    const existing = await this.prisma.integrationConfig.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      throw new NotFoundException('Integration not found');
    }

    await this.prisma.integrationConfig.delete({
      where: { id },
    });

    this.eventEmitter.emit('integration.deleted', {
      tenantId,
      integrationId: id,
      provider: existing.provider,
      type: existing.type,
    });

    return { success: true };
  }

  async testConnection(tenantId: string, id: string) {
    const integration = await this.prisma.integrationConfig.findFirst({
      where: { id, tenantId },
    });

    if (!integration) {
      throw new NotFoundException('Integration not found');
    }

    const credentials = await this.getDecryptedCredentials(integration.credentials);
    const provider = this.getProvider(integration.provider);

    if (!provider) {
      throw new BadRequestException(`Provider ${integration.provider} not supported`);
    }

    try {
      const isConnected = await provider.testConnection(credentials);

      await this.prisma.integrationConfig.update({
        where: { id },
        data: {
          lastTestedAt: new Date(),
          lastTestSuccess: isConnected,
        },
      });

      // Log the test
      await this.logIntegrationActivity(
        tenantId,
        id,
        'TEST_CONNECTION',
        isConnected ? IntegrationLogStatus.SUCCESS : IntegrationLogStatus.FAILED,
        isConnected ? null : 'Connection test failed',
      );

      return { success: isConnected };
    } catch (error) {
      await this.logIntegrationActivity(
        tenantId,
        id,
        'TEST_CONNECTION',
        IntegrationLogStatus.FAILED,
        error instanceof Error ? error.message : 'Unknown error',
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }

  async getProviderInfo(provider: IntegrationProvider) {
    const providerInfo: Partial<Record<IntegrationProvider, any>> = {
      [IntegrationProvider.TWILIO_SMS]: {
        name: 'Twilio SMS',
        types: [IntegrationType.SMS],
        requiredCredentials: ['accountSid', 'authToken', 'fromNumber'],
        description: 'SMS messaging via Twilio',
        docs: 'https://www.twilio.com/docs/sms',
      },
      [IntegrationProvider.TWILIO_WHATSAPP]: {
        name: 'Twilio WhatsApp',
        types: [IntegrationType.WHATSAPP],
        requiredCredentials: ['accountSid', 'authToken', 'fromNumber'],
        description: 'WhatsApp Business messaging via Twilio',
        docs: 'https://www.twilio.com/docs/whatsapp',
      },
      [IntegrationProvider.STRIPE]: {
        name: 'Stripe',
        types: [IntegrationType.PAYMENT],
        requiredCredentials: ['secretKey'],
        optionalCredentials: ['webhookSecret'],
        description: 'Global payment processing',
        docs: 'https://stripe.com/docs',
      },
      [IntegrationProvider.TAP_PAYMENTS]: {
        name: 'Tap Payments',
        types: [IntegrationType.PAYMENT],
        requiredCredentials: ['secretKey'],
        optionalCredentials: ['webhookSecret'],
        description: 'Middle East payment processing',
        docs: 'https://tappayments.api-docs.io',
      },
      [IntegrationProvider.HYPERPAY]: {
        name: 'HyperPay',
        types: [IntegrationType.PAYMENT],
        requiredCredentials: ['entityId', 'accessToken'],
        optionalCredentials: ['testMode'],
        description: 'Middle East & Africa payment processing',
        docs: 'https://wordpresshyperpay.docs.oppwa.com',
      },
    };

    return providerInfo[provider] ?? null;
  }

  async getAllProvidersInfo() {
    const providers = Object.values(IntegrationProvider);
    const info: Record<string, any> = {};

    for (const provider of providers) {
      info[provider] = await this.getProviderInfo(provider);
    }

    return info;
  }

  // Internal helper methods

  async getDecryptedCredentials(encryptedCredentials: string): Promise<Record<string, any>> {
    try {
      const decrypted = await EncryptionUtil.decrypt(encryptedCredentials);
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Failed to decrypt credentials', error);
      throw new BadRequestException('Invalid credentials');
    }
  }

  private getProvider(provider: IntegrationProvider) {
    switch (provider) {
      case IntegrationProvider.TWILIO_SMS:
        return this.twilioSmsProvider;
      case IntegrationProvider.TWILIO_WHATSAPP:
        return this.twilioWhatsAppProvider;
      case IntegrationProvider.STRIPE:
        return this.stripeProvider;
      case IntegrationProvider.TAP_PAYMENTS:
        return this.tapProvider;
      case IntegrationProvider.HYPERPAY:
        return this.hyperPayProvider;
      default:
        return null;
    }
  }

  private sanitizeIntegration(integration: any) {
    // Remove encrypted credentials from response
    const { credentials, ...rest } = integration;
    return {
      ...rest,
      hasCredentials: !!credentials,
    };
  }

  private async logIntegrationActivity(
    tenantId: string,
    configId: string,
    action: string,
    status: IntegrationLogStatus,
    errorMessage?: string | null,
  ) {
    await this.prisma.integrationLog.create({
      data: {
        tenantId,
        configId,
        action,
        status,
        errorMessage,
      },
    });
  }
}
