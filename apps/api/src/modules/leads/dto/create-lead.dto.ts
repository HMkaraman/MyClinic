import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { Channel, PipelineStage } from '@prisma/client';

export class CreateLeadDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name!: string;

  @ApiProperty({ example: '+964 750 123 4567' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: Channel, example: 'WHATSAPP' })
  @IsEnum(Channel)
  source!: Channel;

  @ApiPropertyOptional({ enum: PipelineStage, default: 'INQUIRY' })
  @IsEnum(PipelineStage)
  @IsOptional()
  stage?: PipelineStage;

  @ApiPropertyOptional({ example: 'Interested in dental consultation' })
  @IsString()
  @IsOptional()
  notes?: string;
}
