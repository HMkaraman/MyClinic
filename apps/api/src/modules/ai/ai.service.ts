import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ToolsGatewayService } from './tools-gateway.service';
import { CustomerAgentService } from './customer-agent.service';
import { StaffCopilotService } from './staff-copilot.service';
import {
  ToolCallDto,
  ToolResultDto,
  CustomerAgentRequestDto,
  CustomerAgentResponseDto,
  StaffCopilotRequestDto,
  StaffCopilotResponseDto,
} from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openAiApiKey: string | undefined;
  private readonly aiEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private toolsGateway: ToolsGatewayService,
    private customerAgent: CustomerAgentService,
    private staffCopilot: StaffCopilotService,
  ) {
    this.openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.aiEnabled = !!this.openAiApiKey;

    if (!this.aiEnabled) {
      this.logger.warn('OPENAI_API_KEY not configured - AI features will use rule-based fallbacks');
    }
  }

  /**
   * Check if AI features are enabled
   */
  isEnabled(): boolean {
    return true; // Basic AI features work without OpenAI key
  }

  /**
   * Execute a direct tool call
   */
  async executeTool(user: JwtPayload, dto: ToolCallDto): Promise<ToolResultDto> {
    return this.toolsGateway.executeTool(user, dto.tool, dto.params, 'staff');
  }

  /**
   * Process a customer message through the customer agent
   */
  async processCustomerMessage(
    user: JwtPayload,
    request: CustomerAgentRequestDto,
  ): Promise<CustomerAgentResponseDto> {
    return this.customerAgent.processMessage(user, request);
  }

  /**
   * Process a staff query through the staff copilot
   */
  async processStaffQuery(
    user: JwtPayload,
    request: StaffCopilotRequestDto,
  ): Promise<StaffCopilotResponseDto> {
    return this.staffCopilot.processQuery(user, request);
  }

  /**
   * Get AI feature status
   */
  getStatus(): {
    enabled: boolean;
    features: {
      customerAgent: boolean;
      staffCopilot: boolean;
      advancedNLP: boolean;
    };
  } {
    return {
      enabled: true,
      features: {
        customerAgent: true,
        staffCopilot: true,
        advancedNLP: this.aiEnabled, // Advanced NLP requires OpenAI
      },
    };
  }
}
