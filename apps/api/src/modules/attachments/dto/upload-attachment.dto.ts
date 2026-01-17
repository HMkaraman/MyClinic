import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
import { AttachmentEntityType } from '@prisma/client';

export class UploadAttachmentDto {
  @ApiProperty({ enum: AttachmentEntityType, example: AttachmentEntityType.PATIENT })
  @IsEnum(AttachmentEntityType)
  entityType!: AttachmentEntityType;

  @ApiProperty({ example: 'patient-id' })
  @IsString()
  @IsNotEmpty()
  entityId!: string;
}
