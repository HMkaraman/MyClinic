import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

export enum ExportFormat {
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf',
}

export enum ReportType {
  DASHBOARD = 'dashboard',
  REVENUE = 'revenue',
  PATIENTS = 'patients',
  APPOINTMENTS = 'appointments',
  SERVICES = 'services',
  STAFF = 'staff',
  LEADS = 'leads',
}

export class ExportReportDto {
  @ApiProperty({ enum: ExportFormat, description: 'Export file format' })
  @IsEnum(ExportFormat)
  format!: ExportFormat;

  @ApiPropertyOptional({ example: '2024-01-01', description: 'Start date (ISO format)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'End date (ISO format)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
