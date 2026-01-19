import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsArray } from 'class-validator';

export class ApplyTemplateDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiProperty({ description: 'Branch ID' })
  @IsString()
  branchId!: string;

  @ApiProperty({ description: 'Template ID to apply' })
  @IsString()
  templateId!: string;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({ description: 'Overwrite existing schedules', default: false })
  @IsOptional()
  overwrite?: boolean;
}

export class BulkDeleteDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({ description: 'Branch ID (optional, delete from all if not specified)' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ description: 'Start date (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)' })
  @IsDateString()
  endDate!: string;
}
