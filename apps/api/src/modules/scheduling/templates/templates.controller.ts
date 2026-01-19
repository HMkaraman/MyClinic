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
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto } from './dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../auth/decorators/current-user.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

@ApiTags('schedule-templates')
@ApiBearerAuth()
@Controller('scheduling/templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'List all schedule templates' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('active') active?: string,
  ) {
    const activeFilter = active !== undefined ? active === 'true' : undefined;
    return this.templatesService.findAll(user.tenantId, activeFilter);
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default schedule template' })
  @ApiResponse({ status: 200, description: 'Default template' })
  async getDefault(@CurrentUser() user: JwtPayload) {
    return this.templatesService.getDefault(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template found' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.templatesService.findById(user.tenantId, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'create', entityType: 'ScheduleTemplate' })
  @ApiOperation({ summary: 'Create a new schedule template' })
  @ApiResponse({ status: 201, description: 'Template created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTemplateDto,
  ) {
    return this.templatesService.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'update', entityType: 'ScheduleTemplate', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update schedule template' })
  @ApiResponse({ status: 200, description: 'Template updated' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.update(user.tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'delete', entityType: 'ScheduleTemplate', entityIdParam: 'id', captureBeforeState: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete schedule template' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.templatesService.delete(user.tenantId, id, user.sub);
  }
}
