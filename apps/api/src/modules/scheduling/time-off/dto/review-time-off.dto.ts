import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewTimeOffDto {
  @ApiProperty({ description: 'Review action', enum: ReviewAction })
  @IsEnum(ReviewAction)
  action!: ReviewAction;

  @ApiPropertyOptional({ description: 'Review notes' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
