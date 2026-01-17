import { Controller, Get, Query, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { AuditService } from './audit.service';
import { QueryAuditDto } from './dto/query-audit.dto';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Query audit events' })
  @ApiResponse({ status: 200, description: 'Audit events retrieved' })
  async query(
    @CurrentUser() user: JwtPayload,
    @Query() dto: QueryAuditDto,
  ) {
    return this.auditService.query(user.tenantId, dto);
  }

  @Get('entity/:entityType/:entityId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get audit history for a specific entity' })
  @ApiResponse({ status: 200, description: 'Entity audit history retrieved' })
  async getEntityHistory(
    @CurrentUser() user: JwtPayload,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.auditService.getEntityHistory(
      user.tenantId,
      entityType,
      entityId,
    );
  }

  @Get('correlation/:correlationId')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get related audit events by correlation ID' })
  @ApiResponse({ status: 200, description: 'Correlated events retrieved' })
  async getByCorrelationId(
    @CurrentUser() user: JwtPayload,
    @Param('correlationId') correlationId: string,
  ) {
    return this.auditService.getByCorrelationId(user.tenantId, correlationId);
  }
}
