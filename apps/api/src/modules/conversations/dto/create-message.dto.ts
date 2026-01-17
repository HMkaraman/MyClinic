import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { MessageDirection } from '@prisma/client';

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello, I would like to book an appointment' })
  @IsString()
  content!: string;

  @ApiProperty({ enum: MessageDirection, example: 'OUTBOUND' })
  @IsEnum(MessageDirection)
  direction!: MessageDirection;

  @ApiPropertyOptional({ example: false, description: 'Mark as internal note (not visible to customer)' })
  @IsBoolean()
  @IsOptional()
  isInternalNote?: boolean = false;

  @ApiPropertyOptional({ example: ['attachment-id-1', 'attachment-id-2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({ example: 'external-sender-id', description: 'External sender ID for inbound messages' })
  @IsString()
  @IsOptional()
  externalSenderId?: string;
}

export class CreateInternalNoteDto {
  @ApiProperty({ example: 'Patient mentioned they have a dental emergency' })
  @IsString()
  content!: string;

  @ApiPropertyOptional({ example: ['attachment-id-1'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
