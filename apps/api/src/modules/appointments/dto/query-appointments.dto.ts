import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AppointmentStatus } from '@prisma/client';

export class QueryAppointmentsDto {
  @ApiPropertyOptional({ example: 'branch-main' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 'doctor-id' })
  @IsString()
  @IsOptional()
  doctorId?: string;

  @ApiPropertyOptional({ example: 'patient-id' })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ example: '2026-01-20', description: 'Filter by date (start)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-01-27', description: 'Filter by date (end)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'scheduledAt', enum: ['scheduledAt', 'createdAt'] })
  @IsString()
  @IsOptional()
  sortBy?: string = 'scheduledAt';

  @ApiPropertyOptional({ example: 'asc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class AvailableSlotsDto {
  @ApiPropertyOptional({ example: 'branch-main' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ example: 'doctor-id' })
  @IsString()
  @IsOptional()
  doctorId?: string;

  @ApiProperty({ example: '2026-01-20' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: 30, description: 'Slot duration in minutes' })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @IsOptional()
  durationMinutes?: number = 30;
}
