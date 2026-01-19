import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

import { AvailabilityService } from './availability.service';
import { CurrentUser, JwtPayload } from '../../auth/decorators/current-user.decorator';

@ApiTags('scheduling-availability')
@ApiBearerAuth()
@Controller('scheduling/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('user/:userId')
  @ApiOperation({ summary: 'Check user availability for a date' })
  @ApiResponse({ status: 200, description: 'User availability' })
  @ApiQuery({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'branchId', required: false })
  async checkUserAvailability(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Query('date') date: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.availabilityService.checkUserAvailability(
      user.tenantId,
      userId,
      date,
      branchId,
    );
  }

  @Get('doctors')
  @ApiOperation({ summary: 'Get available doctors for a time slot' })
  @ApiResponse({ status: 200, description: 'Available doctors' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'startTime', required: true, description: 'Start time (HH:mm)' })
  @ApiQuery({ name: 'duration', required: true, description: 'Duration in minutes' })
  async getAvailableDoctors(
    @CurrentUser() user: JwtPayload,
    @Query('branchId') branchId: string,
    @Query('date') date: string,
    @Query('startTime') startTime: string,
    @Query('duration') duration: string,
  ) {
    return this.availabilityService.getAvailableDoctors(
      user.tenantId,
      branchId,
      date,
      startTime,
      parseInt(duration),
    );
  }

  @Get('user/:userId/week')
  @ApiOperation({ summary: 'Get user schedule for a week' })
  @ApiResponse({ status: 200, description: 'Week schedule' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'startDate', required: true, description: 'Week start date (YYYY-MM-DD)' })
  async getWeekSchedule(
    @CurrentUser() user: JwtPayload,
    @Param('userId') userId: string,
    @Query('branchId') branchId: string,
    @Query('startDate') startDate: string,
  ) {
    return this.availabilityService.getDoctorScheduleForWeek(
      user.tenantId,
      userId,
      branchId,
      startDate,
    );
  }
}
