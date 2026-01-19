import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { IntegrationProvider, IntegrationType } from '@prisma/client';

export class QueryIntegrationsDto {
  @ApiPropertyOptional({ description: 'Filter by provider', enum: IntegrationProvider })
  @IsEnum(IntegrationProvider)
  @IsOptional()
  provider?: IntegrationProvider;

  @ApiPropertyOptional({ description: 'Filter by type', enum: IntegrationType })
  @IsEnum(IntegrationType)
  @IsOptional()
  type?: IntegrationType;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by default status' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isDefault?: boolean;
}
