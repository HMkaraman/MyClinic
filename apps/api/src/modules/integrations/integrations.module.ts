import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

// Providers
import { TwilioSmsProvider } from './providers/sms/twilio.provider';
import { TwilioWhatsAppProvider } from './providers/whatsapp/twilio-whatsapp.provider';
import { StripeProvider } from './providers/payment/stripe.provider';
import { TapProvider } from './providers/payment/tap.provider';
import { HyperPayProvider } from './providers/payment/hyperpay.provider';

// Config
import { IntegrationsConfigService } from './config/integrations-config.service';
import { IntegrationsConfigController } from './config/integrations-config.controller';

// Webhooks
import { WebhooksService } from './webhooks/webhooks.service';
import { WebhooksController } from './webhooks/webhooks.controller';

// Reminders
import { RemindersService } from './reminders/reminders.service';
import { RemindersController } from './reminders/reminders.controller';

// Logs
import { IntegrationLogsService } from './logs/integration-logs.service';
import { IntegrationLogsController } from './logs/integration-logs.controller';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [
    IntegrationsConfigController,
    WebhooksController,
    RemindersController,
    IntegrationLogsController,
  ],
  providers: [
    // Providers
    TwilioSmsProvider,
    TwilioWhatsAppProvider,
    StripeProvider,
    TapProvider,
    HyperPayProvider,
    // Services
    IntegrationsConfigService,
    WebhooksService,
    RemindersService,
    IntegrationLogsService,
  ],
  exports: [
    // Export providers for use in other modules
    TwilioSmsProvider,
    TwilioWhatsAppProvider,
    StripeProvider,
    TapProvider,
    HyperPayProvider,
    IntegrationsConfigService,
    RemindersService,
  ],
})
export class IntegrationsModule {}
