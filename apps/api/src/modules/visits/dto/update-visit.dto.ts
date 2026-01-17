import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsObject,
} from 'class-validator';

export class UpdateVisitDto {
  @ApiPropertyOptional({ example: 'Headache and fever for 3 days' })
  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @ApiPropertyOptional({ example: 'Viral fever, Upper respiratory infection' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Prescribed paracetamol 500mg...' })
  @IsString()
  @IsOptional()
  treatmentNotes?: string;

  @ApiPropertyOptional({
    example: [
      { medication: 'Paracetamol', dosage: '500mg', frequency: 'TDS', duration: '5 days' },
    ],
    description: 'Prescriptions as JSON array',
  })
  @IsObject()
  @IsOptional()
  prescriptions?: Record<string, unknown>;
}
