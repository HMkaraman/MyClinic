import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'General Consultation' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'استشارة عامة' })
  @IsString()
  @IsOptional()
  nameAr?: string;

  @ApiPropertyOptional({ example: 'General Consultation' })
  @IsString()
  @IsOptional()
  nameEn?: string;

  @ApiPropertyOptional({ example: 'شاوەڕی گشتی' })
  @IsString()
  @IsOptional()
  nameCkb?: string;

  @ApiPropertyOptional({ example: 'Şêwirmendiya Giştî' })
  @IsString()
  @IsOptional()
  nameKmr?: string;

  @ApiPropertyOptional({ example: 30, description: 'Duration in minutes' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: 25000, description: 'Price in smallest currency unit' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 'consultation' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
