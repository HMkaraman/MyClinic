import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReceiveItemDto {
  @ApiProperty({ description: 'Purchase order item ID' })
  @IsString()
  purchaseOrderItemId!: string;

  @ApiProperty({ description: 'Quantity received', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantityReceived!: number;
}

export class ReceiveItemsDto {
  @ApiProperty({ description: 'Items to receive', type: [ReceiveItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items!: ReceiveItemDto[];

  @ApiPropertyOptional({ description: 'Notes about the receipt' })
  @IsString()
  @IsOptional()
  notes?: string;
}
