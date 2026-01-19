import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsDateString,
  MaxLength,
  Min,
} from 'class-validator';
import { StockUnit } from '@prisma/client';

export class CreateItemDto {
  @ApiProperty({ description: 'SKU (Stock Keeping Unit)', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  sku!: string;

  @ApiPropertyOptional({ description: 'Barcode' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  barcode?: string;

  @ApiProperty({ description: 'Item name (primary)', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'Arabic name' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameAr?: string;

  @ApiPropertyOptional({ description: 'English name' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameEn?: string;

  @ApiPropertyOptional({ description: 'Central Kurdish name' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameCkb?: string;

  @ApiPropertyOptional({ description: 'Northern Kurdish name' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameKmr?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Stock unit', enum: StockUnit, default: 'PIECES' })
  @IsEnum(StockUnit)
  @IsOptional()
  unit?: StockUnit;

  @ApiPropertyOptional({ description: 'Initial quantity in stock', default: 0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityInStock?: number;

  @ApiPropertyOptional({ description: 'Reorder point (minimum stock level)', default: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity', default: 50 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  reorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Cost price' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Selling price' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  sellingPrice?: number;

  @ApiPropertyOptional({ description: 'Expiry date (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Storage location' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({ description: 'Whether the item is active', default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
