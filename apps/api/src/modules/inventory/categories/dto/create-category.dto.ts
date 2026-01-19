import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name (primary)', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ description: 'Arabic name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameAr?: string;

  @ApiPropertyOptional({ description: 'English name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Central Kurdish name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameCkb?: string;

  @ApiPropertyOptional({ description: 'Northern Kurdish name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  nameKmr?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for hierarchy' })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Whether the category is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
