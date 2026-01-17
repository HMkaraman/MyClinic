import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { AppointmentStatus } from '@prisma/client';

export class ChangeStatusDto {
  @ApiProperty({ enum: AppointmentStatus, example: AppointmentStatus.CONFIRMED })
  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus;
}

export class RescheduleAppointmentDto {
  @ApiProperty({ example: '2026-01-21T14:00:00Z' })
  @IsString()
  newScheduledAt!: string;

  @ApiPropertyOptional({ example: 'Patient requested reschedule' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CancelAppointmentDto {
  @ApiPropertyOptional({ example: 'Patient cancelled due to travel' })
  @IsString()
  @IsOptional()
  reason?: string;
}
