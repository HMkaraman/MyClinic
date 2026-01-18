import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { AiService } from './ai.service';
import {
  ToolCallDto,
  CustomerAgentRequestDto,
  StaffCopilotRequestDto,
} from './dto';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../audit/decorators/audit.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get AI feature status' })
  @ApiResponse({ status: 200, description: 'Returns AI feature status' })
  getStatus() {
    return this.aiService.getStatus();
  }

  @Post('tools/execute')
  @Roles(Role.ADMIN, Role.MANAGER, Role.RECEPTION, Role.DOCTOR, Role.NURSE, Role.SUPPORT, Role.ACCOUNTANT)
  @Audit({ entityType: 'AiTool', action: 'execute' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute an AI tool directly' })
  @ApiResponse({ status: 200, description: 'Tool executed successfully' })
  @ApiResponse({ status: 403, description: 'Permission denied for tool' })
  async executeTool(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToolCallDto,
  ) {
    return this.aiService.executeTool(user, dto);
  }

  @Post('customer-agent')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'CustomerAgent', action: 'process_message' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a customer message through the Customer Agent' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  async processCustomerMessage(
    @CurrentUser() user: JwtPayload,
    @Body() request: CustomerAgentRequestDto,
  ) {
    return this.aiService.processCustomerMessage(user, request);
  }

  @Post('staff-copilot')
  @Roles(Role.ADMIN, Role.MANAGER, Role.RECEPTION, Role.DOCTOR, Role.NURSE, Role.SUPPORT, Role.ACCOUNTANT)
  @Audit({ entityType: 'StaffCopilot', action: 'process_query' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process a staff query through the Staff Copilot' })
  @ApiResponse({ status: 200, description: 'Query processed successfully' })
  async processStaffQuery(
    @CurrentUser() user: JwtPayload,
    @Body() request: StaffCopilotRequestDto,
  ) {
    return this.aiService.processStaffQuery(user, request);
  }
}
