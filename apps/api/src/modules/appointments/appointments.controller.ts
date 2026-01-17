import {
  Controller,
  Get,
  Post,
  Patch,
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

import { AppointmentsService } from './appointments.service';
import {
  CreateAppointmentDto,
  UpdateAppointmentDto,
  QueryAppointmentsDto,
  AvailableSlotsDto,
  ChangeStatusDto,
  RescheduleAppointmentDto,
  CancelAppointmentDto,
} from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/decorators/audit.decorator';

@ApiTags('appointments')
@ApiBearerAuth()
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List appointments (paginated, with date range filter)' })
  @ApiResponse({ status: 200, description: 'List of appointments' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryAppointmentsDto,
  ) {
    return this.appointmentsService.findAll(user, query);
  }

  @Get('available-slots')
  @ApiOperation({ summary: 'Get available time slots for a given date' })
  @ApiResponse({ status: 200, description: 'List of available slots' })
  async getAvailableSlots(
    @CurrentUser() user: JwtPayload,
    @Query() query: AvailableSlotsDto,
  ) {
    return this.appointmentsService.getAvailableSlots(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get appointment by ID' })
  @ApiResponse({ status: 200, description: 'Appointment found' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.appointmentsService.findById(user, id);
  }

  @Post()
  @Roles(Role.RECEPTION, Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'create', entityType: 'Appointment' })
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({ status: 201, description: 'Appointment created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.RECEPTION, Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'update', entityType: 'Appointment', entityIdParam: 'id', captureBeforeState: true })
  @ApiOperation({ summary: 'Update appointment' })
  @ApiResponse({ status: 200, description: 'Appointment updated' })
  @ApiResponse({ status: 404, description: 'Appointment not found' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(user, id, dto);
  }

  @Post(':id/status')
  @Roles(Role.RECEPTION, Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE)
  @Audit({ action: 'change_status', entityType: 'Appointment', entityIdParam: 'id', captureBeforeState: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change appointment status' })
  @ApiResponse({ status: 200, description: 'Status changed' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  async changeStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.appointmentsService.changeStatus(user, id, dto);
  }

  @Post(':id/reschedule')
  @Roles(Role.RECEPTION, Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'reschedule', entityType: 'Appointment', entityIdParam: 'id', captureBeforeState: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reschedule appointment' })
  @ApiResponse({ status: 200, description: 'Appointment rescheduled (returns new appointment)' })
  @ApiResponse({ status: 400, description: 'Cannot reschedule appointment with current status' })
  async reschedule(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.reschedule(user, id, dto);
  }

  @Post(':id/cancel')
  @Roles(Role.RECEPTION, Role.ADMIN, Role.MANAGER)
  @Audit({ action: 'cancel', entityType: 'Appointment', entityIdParam: 'id', captureBeforeState: true })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel appointment' })
  @ApiResponse({ status: 200, description: 'Appointment cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel appointment with current status' })
  async cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(user, id, dto);
  }
}
