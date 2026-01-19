import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role, IntegrationProvider } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';
import { IntegrationsConfigService } from './integrations-config.service';
import { CreateIntegrationDto, UpdateIntegrationDto, QueryIntegrationsDto } from './dto';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsConfigController {
  constructor(private readonly integrationsService: IntegrationsConfigService) {}

  @Post()
  @Roles(Role.ADMIN)
  @Audit({ action: 'create', entityType: 'integration' })
  @ApiOperation({ summary: 'Create a new integration configuration' })
  @ApiResponse({ status: 201, description: 'Integration created' })
  @ApiResponse({ status: 409, description: 'Integration already exists' })
  async create(
    @CurrentUser() user: { tenantId: string; id: string },
    @Body() dto: CreateIntegrationDto,
  ) {
    return this.integrationsService.create(user.tenantId, dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get all integration configurations' })
  @ApiResponse({ status: 200, description: 'List of integrations' })
  async findAll(
    @CurrentUser() user: { tenantId: string },
    @Query() query: QueryIntegrationsDto,
  ) {
    return this.integrationsService.findAll(user.tenantId, query);
  }

  @Get('providers')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get information about all available providers' })
  @ApiResponse({ status: 200, description: 'Provider information' })
  async getProvidersInfo() {
    return this.integrationsService.getAllProvidersInfo();
  }

  @Get('providers/:provider')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get information about a specific provider' })
  @ApiParam({ name: 'provider', enum: IntegrationProvider })
  @ApiResponse({ status: 200, description: 'Provider information' })
  async getProviderInfo(@Param('provider') provider: IntegrationProvider) {
    return this.integrationsService.getProviderInfo(provider);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get a specific integration configuration' })
  @ApiResponse({ status: 200, description: 'Integration details' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async findOne(
    @CurrentUser() user: { tenantId: string },
    @Param('id') id: string,
  ) {
    return this.integrationsService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Audit({ action: 'update', entityType: 'integration', entityIdParam: 'id' })
  @ApiOperation({ summary: 'Update an integration configuration' })
  @ApiResponse({ status: 200, description: 'Integration updated' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async update(
    @CurrentUser() user: { tenantId: string; id: string },
    @Param('id') id: string,
    @Body() dto: UpdateIntegrationDto,
  ) {
    return this.integrationsService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @Audit({ action: 'delete', entityType: 'integration', entityIdParam: 'id' })
  @ApiOperation({ summary: 'Delete an integration configuration' })
  @ApiResponse({ status: 200, description: 'Integration deleted' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async delete(
    @CurrentUser() user: { tenantId: string; id: string },
    @Param('id') id: string,
  ) {
    return this.integrationsService.delete(user.tenantId, id);
  }

  @Post(':id/test')
  @Roles(Role.ADMIN)
  @Audit({ action: 'test', entityType: 'integration', entityIdParam: 'id' })
  @ApiOperation({ summary: 'Test integration connection' })
  @ApiResponse({ status: 200, description: 'Test result' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  async testConnection(
    @CurrentUser() user: { tenantId: string; id: string },
    @Param('id') id: string,
  ) {
    return this.integrationsService.testConnection(user.tenantId, id);
  }
}
