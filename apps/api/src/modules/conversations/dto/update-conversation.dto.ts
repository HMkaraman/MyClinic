import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ConversationStatus, PipelineStage } from '@prisma/client';

export class UpdateConversationDto {
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

  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;

  @ApiPropertyOptional({ example: 'patient-id' })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ example: 'lead-id' })
  @IsString()
  @IsOptional()
  leadId?: string;
}

export class AssignConversationDto {
  @ApiProperty({ example: 'user-id' })
  @IsString()
  assignedTo!: string;
}

export class AddTagsDto {
  @ApiProperty({ example: ['inquiry', 'vip'] })
  @IsArray()
  @IsString({ each: true })
  tags!: string[];
}

export class RemoveTagDto {
  @ApiProperty({ example: 'inquiry' })
  @IsString()
  tag!: string;
}
