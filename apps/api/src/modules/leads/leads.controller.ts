import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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

import { LeadsService } from './leads.service';
import {
  CreateLeadDto,
  UpdateLeadDto,
  QueryLeadsDto,
  ChangeStageDto,
  ConvertToPatientDto,
} from './dto';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../audit/decorators/audit.decorator';

@ApiTags('leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads (CRM Pipeline)' })
  @ApiResponse({ status: 200, description: 'Returns paginated leads' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryLeadsDto,
  ) {
    return this.leadsService.findAll(user, query);
  }

  @Get('pipeline-stats')
  @ApiOperation({ summary: 'Get pipeline statistics' })
  @ApiResponse({ status: 200, description: 'Returns lead counts by stage' })
  async getPipelineStats(@CurrentUser() user: JwtPayload) {
    return this.leadsService.getPipelineStats(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  @ApiResponse({ status: 200, description: 'Returns lead details' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.leadsService.findById(user, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'Lead', action: 'create' })
  @ApiOperation({ summary: 'Create a new lead' })
  @ApiResponse({ status: 201, description: 'Lead created' })
  @ApiResponse({ status: 409, description: 'Lead with phone already exists' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leadsService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'Lead', action: 'update' })
  @ApiOperation({ summary: 'Update lead' })
  @ApiResponse({ status: 200, description: 'Lead updated' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.update(user, id, dto);
  }

  @Post(':id/stage')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'Lead', action: 'change_stage' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change lead pipeline stage' })
  @ApiResponse({ status: 200, description: 'Stage changed' })
  async changeStage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ChangeStageDto,
  ) {
    return this.leadsService.changeStage(user, id, dto.stage, dto.reason);
  }

  @Post(':id/convert')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'Lead', action: 'convert_to_patient' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert lead to patient' })
  @ApiResponse({ status: 200, description: 'Lead converted to patient' })
  @ApiResponse({ status: 400, description: 'Lead already converted' })
  async convertToPatient(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ConvertToPatientDto,
  ) {
    return this.leadsService.convertToPatient(user, id, dto.branchId);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ entityType: 'Lead', action: 'delete' })
  @ApiOperation({ summary: 'Delete lead' })
  @ApiResponse({ status: 200, description: 'Lead deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete converted lead' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.leadsService.delete(user, id);
  }
}
