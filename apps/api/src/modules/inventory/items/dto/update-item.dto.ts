import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateItemDto } from './create-item.dto';

export class UpdateItemDto extends PartialType(
  OmitType(CreateItemDto, ['sku', 'quantityInStock'] as const),
) {}
