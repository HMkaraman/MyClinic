import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: 'Receive appointment created notifications' })
  @IsOptional()
  @IsBoolean()
  appointmentCreated?: boolean;

  @ApiPropertyOptional({ description: 'Receive appointment cancelled notifications' })
  @IsOptional()
  @IsBoolean()
  appointmentCancelled?: boolean;

  @ApiPropertyOptional({ description: 'Receive appointment rescheduled notifications' })
  @IsOptional()
  @IsBoolean()
  appointmentRescheduled?: boolean;

  @ApiPropertyOptional({ description: 'Receive task assigned notifications' })
  @IsOptional()
  @IsBoolean()
  taskAssigned?: boolean;

  @ApiPropertyOptional({ description: 'Receive task completed notifications' })
  @IsOptional()
  @IsBoolean()
  taskCompleted?: boolean;

  @ApiPropertyOptional({ description: 'Receive lead stage changed notifications' })
  @IsOptional()
  @IsBoolean()
  leadStageChanged?: boolean;

  @ApiPropertyOptional({ description: 'Receive invoice paid notifications' })
  @IsOptional()
  @IsBoolean()
  invoicePaid?: boolean;

  @ApiPropertyOptional({ description: 'Receive invoice overdue notifications' })
  @IsOptional()
  @IsBoolean()
  invoiceOverdue?: boolean;

  @ApiPropertyOptional({ description: 'Receive message received notifications' })
  @IsOptional()
  @IsBoolean()
  messageReceived?: boolean;

  @ApiPropertyOptional({ description: 'Receive system notifications' })
  @IsOptional()
  @IsBoolean()
  systemNotifications?: boolean;
}
