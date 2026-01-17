import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsDateString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceItemDto {
  @ApiPropertyOptional({ example: 'service-id' })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({ example: 'General Consultation' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 25000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'branch-main' })
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({ example: 'patient-id' })
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @ApiPropertyOptional({ example: 'appointment-id' })
  @IsString()
  @IsOptional()
  appointmentId?: string;

  @ApiPropertyOptional({ example: 'visit-id' })
  @IsString()
  @IsOptional()
  visitId?: string;

  @ApiProperty({ type: [InvoiceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items!: InvoiceItemDto[];

  @ApiPropertyOptional({ example: 5000, description: 'Discount amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ example: 'VIP patient discount' })
  @IsString()
  @IsOptional()
  discountReason?: string;

  @ApiPropertyOptional({ example: 0, description: 'Tax amount' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  tax?: number;

  @ApiPropertyOptional({ example: '2026-02-01' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
