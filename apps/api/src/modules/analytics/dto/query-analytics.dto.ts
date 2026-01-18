import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export enum Granularity {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class QueryAnalyticsDto {
  @ApiPropertyOptional({ example: '2024-01-01', description: 'Start date (ISO format)' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2024-12-31', description: 'End date (ISO format)' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ enum: Granularity, default: Granularity.DAILY })
  @IsEnum(Granularity)
  @IsOptional()
  granularity?: Granularity = Granularity.DAILY;

  @ApiPropertyOptional({ example: 'branch-id', description: 'Filter by branch' })
  @IsString()
  @IsOptional()
  branchId?: string;
}
