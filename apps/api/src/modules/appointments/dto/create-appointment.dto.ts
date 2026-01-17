import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentDto {
  @ApiProperty({ example: 'branch-main' })
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({ example: 'patient-id' })
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @ApiProperty({ example: 'doctor-id' })
  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @ApiProperty({ example: 'service-id' })
  @IsString()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ example: '2026-01-20T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt!: string;

  @ApiPropertyOptional({ example: 30, description: 'Duration in minutes (defaults to service duration)' })
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 'Patient requested morning appointment' })
  @IsString()
  @IsOptional()
  notes?: string;
}
