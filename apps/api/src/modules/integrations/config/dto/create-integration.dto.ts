import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsBoolean, IsOptional, IsObject } from 'class-validator';
import { IntegrationProvider, IntegrationType } from '@prisma/client';

export class CreateIntegrationDto {
  @ApiProperty({ description: 'Integration provider', enum: IntegrationProvider })
  @IsEnum(IntegrationProvider)
  provider!: IntegrationProvider;

  @ApiProperty({ description: 'Integration type', enum: IntegrationType })
  @IsEnum(IntegrationType)
  type!: IntegrationType;

  @ApiProperty({ description: 'Display name for this integration' })
  @IsString()
  displayName!: string;

  @ApiProperty({ description: 'Provider credentials (will be encrypted)' })
  @IsObject()
  credentials!: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional settings' })
  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Whether this integration is active', default: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Set as default for this type', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
