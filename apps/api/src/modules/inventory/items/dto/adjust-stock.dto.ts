import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { MovementType } from '@prisma/client';

// Only allow manual adjustment types
const ManualAdjustmentTypes = [
  MovementType.ADJUSTMENT_IN,
  MovementType.ADJUSTMENT_OUT,
  MovementType.RETURN,
  MovementType.EXPIRED,
  MovementType.DAMAGED,
  MovementType.INITIAL,
] as const;

type ManualAdjustmentType = (typeof ManualAdjustmentTypes)[number];

export class AdjustStockDto {
  @ApiProperty({
    description: 'Type of stock adjustment',
    enum: ManualAdjustmentTypes,
  })
  @IsEnum(ManualAdjustmentTypes, {
    message: `type must be one of: ${ManualAdjustmentTypes.join(', ')}`,
  })
  type!: ManualAdjustmentType;

  @ApiProperty({ description: 'Quantity to adjust (always positive)', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Unit cost for this adjustment' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Reference number (e.g., transfer ID)' })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ description: 'Notes/reason for adjustment' })
  @IsString()
  @IsOptional()
  notes?: string;
}
