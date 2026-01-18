import { IsString, IsOptional, IsObject, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ToolName {
  FIND_PATIENT_BY_PHONE = 'find_patient_by_phone',
  GET_NEXT_AVAILABLE_SLOTS = 'get_next_available_slots',
  CREATE_OR_UPDATE_APPOINTMENT = 'create_or_update_appointment',
  SUMMARIZE_LAST_VISIT = 'summarize_last_visit',
  GET_INVOICE_STATUS = 'get_invoice_status',
  CREATE_FOLLOWUP_TASK = 'create_followup_task',
}

export class ToolCallDto {
  @ApiProperty({ enum: ToolName, description: 'Name of the tool to call' })
  @IsEnum(ToolName)
  tool!: ToolName;

  @ApiProperty({ description: 'Parameters for the tool call' })
  @IsObject()
  params!: Record<string, unknown>;
}

export class ToolResultDto {
  @ApiProperty({ description: 'Whether the tool call was successful' })
  success!: boolean;

  @ApiPropertyOptional({ description: 'Result data from the tool' })
  data?: unknown;

  @ApiPropertyOptional({ description: 'Error message if the call failed' })
  error?: string;

  @ApiPropertyOptional({ description: 'Whether human handoff is required' })
  requiresHumanHandoff?: boolean;

  @ApiPropertyOptional({ description: 'Reason for human handoff' })
  handoffReason?: string;
}

// Tool-specific parameter types
export interface FindPatientByPhoneParams {
  phone: string;
}

export interface GetNextAvailableSlotsParams {
  branchId?: string;
  doctorId?: string;
  serviceId?: string;
  date: string; // ISO date string
  durationMinutes?: number;
}

export interface CreateOrUpdateAppointmentParams {
  appointmentId?: string; // If provided, updates existing
  patientId: string;
  doctorId: string;
  serviceId: string;
  branchId: string;
  scheduledAt: string; // ISO datetime string
  durationMinutes?: number;
  notes?: string;
}

export interface SummarizeLastVisitParams {
  patientId: string;
}

export interface GetInvoiceStatusParams {
  patientId?: string;
  phone?: string;
  invoiceNumber?: string;
}

export interface CreateFollowupTaskParams {
  entityType: 'Patient' | 'Lead' | 'Appointment' | 'Conversation';
  entityId: string;
  title: string;
  description?: string;
  assignedTo: string;
  dueDate: string; // ISO date string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}
