import {
  Controller,
  Get,
  Query,
  Param,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Response } from 'express';

import { AnalyticsService } from './analytics.service';
import { QueryAnalyticsDto, ExportFormat, ReportType } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get dashboard KPI summary' })
  @ApiResponse({ status: 200, description: 'Dashboard summary data' })
  async getDashboard(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getDashboard(user, query);
  }

  @Get('revenue')
  @Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get revenue analytics and trends' })
  @ApiResponse({ status: 200, description: 'Revenue data with trends and breakdowns' })
  async getRevenue(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getRevenue(user, query);
  }

  @Get('patients')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get patient statistics' })
  @ApiResponse({ status: 200, description: 'Patient stats with demographics' })
  async getPatients(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getPatients(user, query);
  }

  @Get('appointments')
  @Roles(Role.ADMIN, Role.MANAGER, Role.RECEPTION)
  @ApiOperation({ summary: 'Get appointment metrics' })
  @ApiResponse({ status: 200, description: 'Appointment metrics and statistics' })
  async getAppointments(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getAppointments(user, query);
  }

  @Get('services')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get service performance analytics' })
  @ApiResponse({ status: 200, description: 'Service performance data' })
  async getServices(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getServices(user, query);
  }

  @Get('staff')
  @Roles(Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get staff productivity metrics' })
  @ApiResponse({ status: 200, description: 'Staff productivity data' })
  async getStaff(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getStaff(user, query);
  }

  @Get('leads')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT)
  @ApiOperation({ summary: 'Get lead funnel analytics' })
  @ApiResponse({ status: 200, description: 'Lead funnel data' })
  async getLeads(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryAnalyticsDto,
  ) {
    return this.analyticsService.getLeads(user, query);
  }

  @Get('export/:type')
  @Roles(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Export analytics report' })
  @ApiParam({ name: 'type', enum: ReportType })
  @ApiResponse({ status: 200, description: 'Report data for export' })
  async exportReport(
    @CurrentUser() user: JwtPayload,
    @Param('type') type: ReportType,
    @Query() query: QueryAnalyticsDto,
    @Query('format') format: ExportFormat = ExportFormat.CSV,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { data, filename } = await this.analyticsService.exportReport(user, type, query);

    // Set appropriate headers based on format
    let contentType: string;
    let fileExtension: string;

    switch (format) {
      case ExportFormat.EXCEL:
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        fileExtension = 'xlsx';
        break;
      case ExportFormat.PDF:
        contentType = 'application/pdf';
        fileExtension = 'pdf';
        break;
      case ExportFormat.CSV:
      default:
        contentType = 'text/csv';
        fileExtension = 'csv';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.${fileExtension}"`);

    // For now, return JSON data - frontend will handle the actual export format conversion
    // This is a common pattern where the API provides structured data and the frontend
    // uses libraries like xlsx or pdfmake to generate the actual files
    return data;
  }
}
