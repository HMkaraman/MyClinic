import { IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CustomerAgentIntent {
  GENERAL_INQUIRY = 'general_inquiry',
  SERVICE_INQUIRY = 'service_inquiry',
  PRICING_INQUIRY = 'pricing_inquiry',
  APPOINTMENT_REQUEST = 'appointment_request',
  APPOINTMENT_RESCHEDULE = 'appointment_reschedule',
  APPOINTMENT_CANCEL = 'appointment_cancel',
  COMPLAINT = 'complaint',
  MEDICAL_QUESTION = 'medical_question',
  OTHER = 'other',
}

export class MessageHistoryItem {
  @ApiProperty({ enum: ['user', 'assistant'] })
  @IsEnum(['user', 'assistant'] as const)
  role!: 'user' | 'assistant';

  @ApiProperty()
  @IsString()
  content!: string;
}

export class CustomerAgentRequestDto {
  @ApiProperty({ description: 'The current user message' })
  @IsString()
  message!: string;

  @ApiPropertyOptional({ description: 'Conversation ID if continuing a conversation' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ description: 'Lead ID if this is from an existing lead' })
  @IsOptional()
  @IsString()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Patient ID if customer is already a patient' })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Previous messages in the conversation', type: [MessageHistoryItem] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageHistoryItem)
  messageHistory?: MessageHistoryItem[];

  @ApiPropertyOptional({ description: 'Customer phone number' })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Channel of communication', enum: ['WHATSAPP', 'SMS', 'EMAIL', 'WEB_CHAT', 'PHONE'] })
  @IsOptional()
  @IsString()
  channel?: string;
}

// Define these classes before they are referenced
export class SuggestedAction {
  @ApiProperty({ description: 'Type of action' })
  type!: 'create_appointment' | 'create_task' | 'escalate' | 'send_info' | 'follow_up';

  @ApiProperty({ description: 'Description of the suggested action' })
  description!: string;

  @ApiPropertyOptional({ description: 'Parameters for the action' })
  params?: Record<string, unknown>;
}

export class ExtractedData {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  phone?: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  preferredService?: string;

  @ApiPropertyOptional()
  preferredDate?: string;

  @ApiPropertyOptional()
  preferredTime?: string;

  @ApiPropertyOptional()
  preferredDoctor?: string;

  @ApiPropertyOptional()
  notes?: string;
}

export class CustomerAgentResponseDto {
  @ApiProperty({ description: 'Response message to send to the customer' })
  response!: string;

  @ApiProperty({ description: 'Detected intent of the customer message', enum: CustomerAgentIntent })
  intent!: CustomerAgentIntent;

  @ApiPropertyOptional({ description: 'Confidence score (0-1)' })
  confidence?: number;

  @ApiPropertyOptional({ description: 'Whether human handoff is required' })
  requiresHumanHandoff?: boolean;

  @ApiPropertyOptional({ description: 'Reason for human handoff' })
  handoffReason?: string;

  @ApiPropertyOptional({ description: 'Suggested actions for follow-up' })
  suggestedActions?: SuggestedAction[];

  @ApiPropertyOptional({ description: 'Created or found lead ID' })
  leadId?: string;

  @ApiPropertyOptional({ description: 'Created appointment ID' })
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Data extracted from the conversation' })
  extractedData?: ExtractedData;
}
