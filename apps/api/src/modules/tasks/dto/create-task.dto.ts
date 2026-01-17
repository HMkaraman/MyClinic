import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { TaskEntityType, TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Follow up with patient' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Call patient to check on their recovery' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: TaskEntityType, example: 'PATIENT' })
  @IsEnum(TaskEntityType)
  entityType!: TaskEntityType;

  @ApiProperty({ example: 'patient-id' })
  @IsString()
  entityId!: string;

  @ApiProperty({ example: 'user-id' })
  @IsString()
  assignedTo!: string;

  @ApiProperty({ example: '2026-01-20T10:00:00Z' })
  @IsDateString()
  dueDate!: string;

  @ApiPropertyOptional({ enum: TaskPriority, default: 'MEDIUM' })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;
}
