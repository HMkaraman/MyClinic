import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Gender, PatientSource } from '@prisma/client';

export class UpdatePatientDto {
  @ApiPropertyOptional({ example: 'Ahmed Mohammed' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: '+9647501234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '1990-05-15' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiPropertyOptional({ example: 'Baghdad, Iraq' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: { allergies: ['penicillin'], conditions: ['diabetes'] },
    description: 'Medical summary JSON',
  })
  @IsObject()
  @IsOptional()
  medicalSummary?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: PatientSource, example: PatientSource.WALK_IN })
  @IsEnum(PatientSource)
  @IsOptional()
  source?: PatientSource;
}
