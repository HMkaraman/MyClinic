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

import { SchedulesService } from './schedules.service';
import {
  CreateScheduleDto,
  UpdateScheduleDto,
  ApplyTemplateDto,
  BulkDeleteDto,
  QuerySchedulesDto,
} from './dto';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../../auth/decorators/current-user.decorator';
import { Audit } from '../../audit/decorators/audit.decorator';

@ApiTags('work-schedules')
@ApiBearerAuth()
@Controller('scheduling/schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'List work schedules' })
  @ApiResponse({ status: 200, description: 'List of schedules' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QuerySchedulesDto,
  ) {
    return this.schedulesService.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  @ApiResponse({ status: 200, description: 'Schedule found' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.schedulesService.findById(user.tenantId, id);
  }

  @Get('user/:userId/date/:date')
  @ApiOperation({ summary: 'Get schedules for a user on a specific date' })
  @ApiResponse({ status: 200, description: 'Schedules found' })
  async getByUserAndDate(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Param('date') date: string,
  ) {
    return this.schedulesService.getByUserAndDate(user.tenantId, userId, date);
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'create', entityType: 'WorkSchedule' })
  @ApiOperation({ summary: 'Create a work schedule' })
  @ApiResponse({ status: 201, description: 'Schedule created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateScheduleDto,
  ) {
    return this.schedulesService.create(user.tenantId, dto, user.sub);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'update', entityType: 'WorkSchedule', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update work schedule' })
  @ApiResponse({ status: 200, description: 'Schedule updated' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.schedulesService.update(user.tenantId, id, dto, user.sub);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'delete', entityType: 'WorkSchedule', entityIdParam: 'id', captureBeforeState: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete work schedule' })
  @ApiResponse({ status: 200, description: 'Schedule deleted' })
  @ApiResponse({ status: 404, description: 'Schedule not found' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.schedulesService.delete(user.tenantId, id, user.sub);
  }

  @Post('apply-template')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'apply_template', entityType: 'WorkSchedule' })
  @ApiOperation({ summary: 'Apply template to generate schedules' })
  @ApiResponse({ status: 200, description: 'Template applied' })
  async applyTemplate(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ApplyTemplateDto,
  ) {
    return this.schedulesService.applyTemplate(user.tenantId, dto, user.sub);
  }

  @Post('bulk-delete')
  @Roles(Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'bulk_delete', entityType: 'WorkSchedule' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete schedules in bulk for a date range' })
  @ApiResponse({ status: 200, description: 'Schedules deleted' })
  async bulkDelete(
    @CurrentUser() user: JwtPayload,
    @Body() dto: BulkDeleteDto,
  ) {
    return this.schedulesService.bulkDelete(user.tenantId, dto, user.sub);
  }
}
