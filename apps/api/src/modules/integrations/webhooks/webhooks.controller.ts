import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  RawBodyRequest,
  Req,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe/:tenantId')
  @ApiExcludeEndpoint()
  async handleStripeWebhook(
    @Param('tenantId') tenantId: string,
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new BadRequestException('Missing raw body');
    }

    return this.webhooksService.handleStripeWebhook(
      tenantId,
      rawBody.toString(),
      signature,
    );
  }

  @Post('tap/:tenantId')
  @ApiExcludeEndpoint()
  async handleTapWebhook(
    @Param('tenantId') tenantId: string,
    @Body() body: any,
    @Headers('tap-signature') signature: string,
  ) {
    return this.webhooksService.handleTapWebhook(tenantId, body, signature);
  }

  @Post('hyperpay/:tenantId')
  @ApiExcludeEndpoint()
  async handleHyperPayWebhook(
    @Param('tenantId') tenantId: string,
    @Body() body: any,
  ) {
    return this.webhooksService.handleHyperPayWebhook(tenantId, body);
  }

  @Post('twilio/:tenantId')
  @ApiExcludeEndpoint()
  async handleTwilioWebhook(
    @Param('tenantId') tenantId: string,
    @Body() body: any,
    @Headers('x-twilio-signature') signature: string,
  ) {
    return this.webhooksService.handleTwilioWebhook(tenantId, body, signature);
  }

  // Health check endpoint for webhook verification
  @Post('verify/:provider/:tenantId')
  @ApiOperation({ summary: 'Webhook verification endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook verified' })
  async verifyWebhook(
    @Param('provider') provider: string,
    @Param('tenantId') tenantId: string,
    @Body() body: any,
  ) {
    this.logger.log(`Webhook verification for ${provider} (tenant: ${tenantId})`);

    // Return challenge for providers that require it
    if (body.challenge) {
      return { challenge: body.challenge };
    }

    return { status: 'ok' };
  }
}
