import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateVisitDto {
  @ApiProperty({ example: 'branch-main' })
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @ApiProperty({ example: 'patient-id' })
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @ApiPropertyOptional({ example: 'appointment-id', description: 'Link to appointment if any' })
  @IsString()
  @IsOptional()
  appointmentId?: string;

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
