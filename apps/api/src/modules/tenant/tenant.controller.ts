import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { TenantService } from './tenant.service';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('tenant')
@ApiBearerAuth()
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @ApiOperation({ summary: 'Get current tenant information' })
  @ApiResponse({ status: 200, description: 'Tenant data retrieved' })
  async getCurrentTenant(@CurrentUser() user: JwtPayload) {
    return this.tenantService.findById(user.tenantId);
  }

  @Get('branches')
  @ApiOperation({ summary: 'Get all branches for current tenant' })
  @ApiResponse({ status: 200, description: 'Branches retrieved' })
  async getBranches(@CurrentUser() user: JwtPayload) {
    return this.tenantService.getTenantBranches(user.tenantId);
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get tenant settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  async getSettings(@CurrentUser() user: JwtPayload) {
    return this.tenantService.getSettings(user.tenantId);
  }
}
