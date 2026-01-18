import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ToolsGatewayService } from './tools-gateway.service';
import { CustomerAgentService } from './customer-agent.service';
import { StaffCopilotService } from './staff-copilot.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    AuditModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    ToolsGatewayService,
    CustomerAgentService,
    StaffCopilotService,
  ],
  exports: [AiService, ToolsGatewayService],
})
export class AiModule {}
