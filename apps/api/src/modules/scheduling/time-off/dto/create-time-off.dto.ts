import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, MaxLength } from 'class-validator';
import { TimeOffType } from '@prisma/client';

export class CreateTimeOffDto {
  @ApiProperty({ description: 'Type of time off', enum: TimeOffType })
  @IsEnum(TimeOffType)
  type!: TimeOffType;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Reason for time off' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
