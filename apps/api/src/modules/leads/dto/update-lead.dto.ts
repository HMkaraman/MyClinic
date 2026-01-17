import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { PipelineStage } from '@prisma/client';

export class UpdateLeadDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+964 750 123 4567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ enum: PipelineStage })
  @IsEnum(PipelineStage)
  @IsOptional()
  stage?: PipelineStage;

  @ApiPropertyOptional({ example: 'Follow-up scheduled for next week' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ChangeStageDto {
  @ApiProperty({ enum: PipelineStage })
  @IsEnum(PipelineStage)
  stage!: PipelineStage;

  @ApiPropertyOptional({ example: 'Customer confirmed interest' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ConvertToPatientDto {
  @ApiProperty({ example: 'branch-main' })
  @IsString()
  branchId!: string;
}
