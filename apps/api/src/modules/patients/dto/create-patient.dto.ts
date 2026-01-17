import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Gender, PatientSource } from '@prisma/client';

export class CreatePatientDto {
  @ApiProperty({ example: 'Ahmed Mohammed' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+9647501234567' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'ahmed@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'branch-main' })
  @IsString()
  @IsNotEmpty()
  branchId!: string;

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
