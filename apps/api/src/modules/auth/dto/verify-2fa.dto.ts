import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2FADto {
  @ApiProperty({ example: '123456', description: '6-digit TOTP code' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code!: string;
}

export class Setup2FAResponseDto {
  @ApiProperty({ description: 'QR code as base64 data URL' })
  qrCode!: string;

  @ApiProperty({ description: 'Secret for manual entry' })
  secret!: string;
}
