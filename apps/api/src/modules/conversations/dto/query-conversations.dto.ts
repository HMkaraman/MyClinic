import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Channel, ConversationStatus, PipelineStage } from '@prisma/client';

export class QueryConversationsDto {
  @ApiPropertyOptional({ enum: Channel })
  @IsEnum(Channel)
  @IsOptional()
  channel?: Channel;

  @ApiPropertyOptional({ enum: ConversationStatus })
  @IsEnum(ConversationStatus)
  @IsOptional()
  status?: ConversationStatus;

  @ApiPropertyOptional({ example: 'user-id' })
  @IsString()
  @IsOptional()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Filter unassigned conversations' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  unassigned?: boolean;

  @ApiPropertyOptional({ example: ['inquiry', 'urgent'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  tags?: string[];

  @ApiPropertyOptional({ enum: PipelineStage })
  @IsEnum(PipelineStage)
  @IsOptional()
  pipelineStage?: PipelineStage;

  @ApiPropertyOptional({ example: 'patient-id' })
  @IsString()
  @IsOptional()
  patientId?: string;

  @ApiPropertyOptional({ example: 'lead-id' })
  @IsString()
  @IsOptional()
  leadId?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ example: 'lastMessageAt', enum: ['lastMessageAt', 'createdAt', 'updatedAt'] })
  @IsString()
  @IsOptional()
  sortBy?: string = 'lastMessageAt';

  @ApiPropertyOptional({ example: 'desc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
