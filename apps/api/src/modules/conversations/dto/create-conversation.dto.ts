import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Channel, PipelineStage } from '@prisma/client';

export class CreateConversationDto {
  @ApiProperty({ enum: Channel, example: 'WHATSAPP' })
  @IsEnum(Channel)
  channel!: Channel;

  @ApiPropertyOptional({ example: 'wa-123456789' })
  @IsString()
  @IsOptional()
  externalId?: string;

  @ApiPropertyOptional({ example: 'lead-id' })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({ example: 'patient-id' })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ example: 'user-id' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ example: ['inquiry', 'urgent'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ enum: PipelineStage })
  @IsEnum(PipelineStage)
  @IsOptional()
  pipelineStage?: PipelineStage;
}
