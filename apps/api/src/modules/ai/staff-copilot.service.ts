import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ToolsGatewayService } from './tools-gateway.service';
import {
  StaffCopilotRequestDto,
  StaffCopilotResponseDto,
  ToolExecution,
} from './dto';
import { ToolName, ToolResultDto } from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';

// Map natural language queries to tools
interface ToolMapping {
  patterns: RegExp[];
  tool: ToolName;
  extractParams: (message: string, context?: { entityType?: string; entityId?: string }) => Record<string, unknown>;
}

const TOOL_MAPPINGS: ToolMapping[] = [
  {
    patterns: [
      /find patient (?:with|by|for) (?:phone|number)? ?(.+)/i,
      /search (?:for )?patient (?:by )?phone (.+)/i,
      /patient (?:with )?phone (.+)/i,
      /who is (.+)/i,
    ],
    tool: ToolName.FIND_PATIENT_BY_PHONE,
    extractParams: (message) => {
      const phoneMatch = message.match(/(?:\+964|0)?7\d{9}/) || message.match(/\d{10,}/);
      return { phone: phoneMatch?.[0] || message.split(' ').pop() };
    },
  },
  {
    patterns: [
      /(?:available|next|open) (?:slots?|appointments?|times?) (?:for|on) (.+)/i,
      /when (?:is|are) (?:the )?(?:next )?(?:available|open) (?:slots?|times?)/i,
      /show (?:me )?availability (?:for|on) (.+)/i,
      /check availability/i,
    ],
    tool: ToolName.GET_NEXT_AVAILABLE_SLOTS,
    extractParams: (message) => {
      // Try to extract date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Check for specific date mentions
      if (message.toLowerCase().includes('today')) {
        return { date: new Date().toISOString().split('T')[0] };
      }
      if (message.toLowerCase().includes('tomorrow')) {
        return { date: tomorrow.toISOString().split('T')[0] };
      }

      // Default to tomorrow
      return { date: tomorrow.toISOString().split('T')[0] };
    },
  },
  {
    patterns: [
      /(?:last|previous|recent) visit (?:for|of) (?:patient )?(.+)/i,
      /summarize (?:the )?(?:last )?visit (?:for )?(.+)/i,
      /visit history (?:for )?(.+)/i,
      /what (?:was|happened) (?:in )?(?:the )?last visit/i,
    ],
    tool: ToolName.SUMMARIZE_LAST_VISIT,
    extractParams: (message, context) => {
      if (context?.entityType === 'Patient' && context?.entityId) {
        return { patientId: context.entityId };
      }
      // Try to extract patient ID from message if UUID-like
      const uuidMatch = message.match(/[a-f0-9-]{36}/i);
      if (uuidMatch) {
        return { patientId: uuidMatch[0] };
      }
      return {};
    },
  },
  {
    patterns: [
      /invoice (?:status|balance) (?:for )?(.+)/i,
      /(?:outstanding|unpaid|pending) (?:invoices?|balance) (?:for )?(.+)/i,
      /how much (?:does|do) (.+) owe/i,
      /check (?:invoice|payment) (?:status )?(?:for )?(.+)/i,
    ],
    tool: ToolName.GET_INVOICE_STATUS,
    extractParams: (message, context) => {
      // Check if viewing a patient
      if (context?.entityType === 'Patient' && context?.entityId) {
        return { patientId: context.entityId };
      }

      // Try to extract phone number
      const phoneMatch = message.match(/(?:\+964|0)?7\d{9}/);
      if (phoneMatch) {
        return { phone: phoneMatch[0] };
      }

      // Try to extract invoice number
      const invoiceMatch = message.match(/INV-\d{6}-\d{5}/);
      if (invoiceMatch) {
        return { invoiceNumber: invoiceMatch[0] };
      }

      return {};
    },
  },
  {
    patterns: [
      /create (?:a )?(?:follow[- ]?up )?task (?:to )?(.+)/i,
      /remind (?:me|us|them) to (.+)/i,
      /add (?:a )?task (?:for )?(.+)/i,
      /schedule (?:a )?follow[- ]?up (.+)/i,
    ],
    tool: ToolName.CREATE_FOLLOWUP_TASK,
    extractParams: (message, context) => {
      const params: Record<string, unknown> = {
        title: message.replace(/create (?:a )?(?:follow[- ]?up )?task (?:to )?/i, '').trim(),
      };

      // Set entity context if available
      if (context?.entityType && context?.entityId) {
        params.entityType = context.entityType;
        params.entityId = context.entityId;
      }

      // Default due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      params.dueDate = tomorrow.toISOString().split('T')[0];

      return params;
    },
  },
];

// Queries that should be answered without tools
const GENERAL_KNOWLEDGE_PATTERNS = [
  /how do I/i,
  /what is (?:a |the )?/i,
  /can you explain/i,
  /help me with/i,
];

@Injectable()
export class StaffCopilotService {
  private readonly logger = new Logger(StaffCopilotService.name);
  private readonly openAiApiKey: string | undefined;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private auditService: AuditService,
    private toolsGateway: ToolsGatewayService,
  ) {
    this.openAiApiKey = this.configService.get<string>('OPENAI_API_KEY');
  }

  /**
   * Process a staff copilot query
   */
  async processQuery(
    user: JwtPayload,
    request: StaffCopilotRequestDto,
  ): Promise<StaffCopilotResponseDto> {
    const { query, currentContext, currentEntityType, currentEntityId } = request;

    // Check if this is a general knowledge question
    if (GENERAL_KNOWLEDGE_PATTERNS.some((pattern) => pattern.test(query))) {
      return this.handleGeneralKnowledge(query, user);
    }

    // Try to match query to a tool
    const toolMatch = this.matchQueryToTool(query);

    if (!toolMatch) {
      // No matching tool, provide helpful response
      return {
        response: this.getHelpfulResponse(user.role),
        suggestedFollowUps: this.getSuggestedQueries(user.role),
      };
    }

    // Extract parameters for the tool
    const params = toolMatch.mapping.extractParams(query, {
      entityType: currentEntityType,
      entityId: currentEntityId,
    });

    // Check if we have required params
    const missingParams = this.checkMissingParams(toolMatch.mapping.tool, params);
    if (missingParams.length > 0) {
      return {
        response: `To ${this.getToolDescription(toolMatch.mapping.tool)}, I need the following information: ${missingParams.join(', ')}. Can you provide these?`,
      };
    }

    // Execute the tool
    const result = await this.toolsGateway.executeTool(
      user,
      toolMatch.mapping.tool,
      params,
      'staff',
    );

    // Build response from tool result
    const toolExecution: ToolExecution = {
      tool: toolMatch.mapping.tool,
      params,
      success: result.success,
      result: result.data,
      error: result.error,
    };

    if (!result.success) {
      if (result.requiresHumanHandoff) {
        return {
          response: `I cannot complete this request: ${result.error}. ${result.handoffReason}`,
          toolsExecuted: [toolExecution],
          permissionDenied: true,
          permissionDeniedReason: result.error,
        };
      }

      return {
        response: `I encountered an error: ${result.error}. Please try again or contact support if the issue persists.`,
        toolsExecuted: [toolExecution],
      };
    }

    // Format successful response
    const response = this.formatToolResult(toolMatch.mapping.tool, result);

    // Log the interaction
    await this.logInteraction(user, request, response, [toolExecution]);

    return {
      response,
      toolsExecuted: [toolExecution],
      data: result.data as Record<string, unknown>,
      suggestedFollowUps: this.getSuggestedFollowUps(toolMatch.mapping.tool, result),
    };
  }

  /**
   * Match a query to a tool
   */
  private matchQueryToTool(query: string): { mapping: ToolMapping } | null {
    for (const mapping of TOOL_MAPPINGS) {
      for (const pattern of mapping.patterns) {
        if (pattern.test(query)) {
          return { mapping };
        }
      }
    }
    return null;
  }

  /**
   * Check for missing required parameters
   */
  private checkMissingParams(tool: ToolName, params: Record<string, unknown>): string[] {
    const missing: string[] = [];

    switch (tool) {
      case ToolName.FIND_PATIENT_BY_PHONE:
        if (!params.phone) missing.push('phone number');
        break;
      case ToolName.GET_NEXT_AVAILABLE_SLOTS:
        if (!params.date) missing.push('date');
        break;
      case ToolName.SUMMARIZE_LAST_VISIT:
        if (!params.patientId) missing.push('patient ID');
        break;
      case ToolName.CREATE_FOLLOWUP_TASK:
        if (!params.title) missing.push('task description');
        if (!params.assignedTo) missing.push('assignee');
        if (!params.entityType || !params.entityId) missing.push('related entity');
        break;
    }

    return missing;
  }

  /**
   * Get a human-readable description of a tool
   */
  private getToolDescription(tool: ToolName): string {
    const descriptions: Record<ToolName, string> = {
      [ToolName.FIND_PATIENT_BY_PHONE]: 'find a patient by phone number',
      [ToolName.GET_NEXT_AVAILABLE_SLOTS]: 'check available appointment slots',
      [ToolName.CREATE_OR_UPDATE_APPOINTMENT]: 'create or update an appointment',
      [ToolName.SUMMARIZE_LAST_VISIT]: 'summarize the last visit',
      [ToolName.GET_INVOICE_STATUS]: 'check invoice status',
      [ToolName.CREATE_FOLLOWUP_TASK]: 'create a follow-up task',
    };
    return descriptions[tool];
  }

  /**
   * Format a tool result into a human-readable response
   */
  private formatToolResult(tool: ToolName, result: ToolResultDto): string {
    const data = result.data as Record<string, unknown>;

    switch (tool) {
      case ToolName.FIND_PATIENT_BY_PHONE:
        if (!data) {
          return 'No patient found with that phone number.';
        }
        const patient = data as { name: string; phone: string; fileNumber: string; branch: { name: string } };
        return `Found patient: **${patient.name}**\n- File Number: ${patient.fileNumber}\n- Phone: ${patient.phone}\n- Branch: ${patient.branch?.name || 'N/A'}`;

      case ToolName.GET_NEXT_AVAILABLE_SLOTS:
        const slotsData = data as { date: string; availableSlots: { start: string }[]; totalAvailable: number };
        if (slotsData.totalAvailable === 0) {
          return `No available slots on ${slotsData.date}. Would you like me to check another day?`;
        }
        const slots = slotsData.availableSlots.map((s) => {
          const time = new Date(s.start);
          return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        });
        return `Available slots on ${slotsData.date}:\n${slots.map((s) => `• ${s}`).join('\n')}\n\nTotal available: ${slotsData.totalAvailable} slots`;

      case ToolName.SUMMARIZE_LAST_VISIT:
        const visitData = data as { hasVisitHistory: boolean; lastVisit?: { date: Date; doctor: string; chiefComplaint: string; diagnosis: string; treatmentNotes: string } };
        if (!visitData.hasVisitHistory) {
          return 'No visit history found for this patient.';
        }
        const visit = visitData.lastVisit!;
        return `**Last Visit Summary**\n- Date: ${new Date(visit.date).toLocaleDateString()}\n- Doctor: ${visit.doctor}\n- Chief Complaint: ${visit.chiefComplaint || 'Not recorded'}\n- Diagnosis: ${visit.diagnosis || 'Not recorded'}\n- Treatment: ${visit.treatmentNotes || 'Not recorded'}`;

      case ToolName.GET_INVOICE_STATUS:
        if (!(data as { found: boolean }).found) {
          return 'No invoices found matching your query.';
        }
        if ((data as { invoice?: unknown }).invoice) {
          const inv = (data as { invoice: { invoiceNumber: string; total: number; paidAmount: number; remainingBalance: number; status: string; patientName: string } }).invoice;
          return `**Invoice ${inv.invoiceNumber}**\n- Patient: ${inv.patientName}\n- Total: ${inv.total.toLocaleString()} IQD\n- Paid: ${inv.paidAmount.toLocaleString()} IQD\n- Remaining: ${inv.remainingBalance.toLocaleString()} IQD\n- Status: ${inv.status}`;
        }
        const summary = (data as { patientName: string; summary: { totalOutstanding: number; unpaidInvoiceCount: number } });
        return `**Invoice Status for ${summary.patientName}**\n- Outstanding Balance: ${summary.summary.totalOutstanding.toLocaleString()} IQD\n- Unpaid Invoices: ${summary.summary.unpaidInvoiceCount}`;

      case ToolName.CREATE_FOLLOWUP_TASK:
        const taskData = data as { task: { title: string; dueDate: Date; assignedTo: string; priority: string } };
        return `✓ Task created: "${taskData.task.title}"\n- Due: ${new Date(taskData.task.dueDate).toLocaleDateString()}\n- Assigned to: ${taskData.task.assignedTo}\n- Priority: ${taskData.task.priority}`;

      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Handle general knowledge questions
   */
  private handleGeneralKnowledge(query: string, user: JwtPayload): StaffCopilotResponseDto {
    const lowerQuery = query.toLowerCase();

    // Common questions
    if (lowerQuery.includes('book') || lowerQuery.includes('appointment')) {
      return {
        response: 'To book an appointment:\n1. Find the patient (or create a new one)\n2. Go to the Appointments section\n3. Select a doctor and service\n4. Choose an available time slot\n5. Confirm the booking\n\nI can also help you find available slots if you tell me the date!',
        suggestedFollowUps: ['Check available slots for tomorrow', 'Find patient by phone'],
      };
    }

    if (lowerQuery.includes('invoice') || lowerQuery.includes('payment')) {
      return {
        response: 'To create an invoice:\n1. Go to the patient record\n2. Click "Create Invoice"\n3. Add services and any discounts\n4. Save the invoice\n5. Record payments as received\n\nI can check invoice status for any patient if you give me their phone number!',
        suggestedFollowUps: ['Check invoice status for patient'],
      };
    }

    return {
      response: `I'm here to help! As your clinic assistant, I can:\n\n• Find patients by phone number\n• Check available appointment slots\n• Summarize recent visits (medical staff only)\n• Check invoice status\n• Create follow-up tasks\n\nJust ask me in plain language what you need!`,
      suggestedFollowUps: this.getSuggestedQueries(user.role),
    };
  }

  /**
   * Get helpful response when no tool matches
   */
  private getHelpfulResponse(role: Role): string {
    return `I am not sure how to help with that. Here's what I can do:\n\n` +
      `• Find patients by phone number\n` +
      `• Check available appointment slots\n` +
      (this.isMedicalRole(role) ? `• Summarize recent visits\n` : '') +
      `• Check invoice status\n` +
      `• Create follow-up tasks\n\n` +
      `Try asking something like "Find patient with phone 0770123456" or "What slots are available tomorrow?"`;
  }

  /**
   * Get suggested queries based on role
   */
  private getSuggestedQueries(role: Role): string[] {
    const common = [
      'Find patient with phone ...',
      'Available slots for tomorrow',
      'Check invoice status for ...',
    ];

    if (this.isMedicalRole(role)) {
      return [...common, 'Summarize last visit for ...'];
    }

    return common;
  }

  /**
   * Get suggested follow-ups based on tool result
   */
  private getSuggestedFollowUps(tool: ToolName, result: ToolResultDto): string[] {
    if (!result.success) return [];

    switch (tool) {
      case ToolName.FIND_PATIENT_BY_PHONE:
        if (result.data) {
          return ['Check invoice status', 'Check last visit', 'Available slots for tomorrow'];
        }
        return [];

      case ToolName.GET_NEXT_AVAILABLE_SLOTS:
        return ['Book an appointment', 'Check slots for another day'];

      case ToolName.SUMMARIZE_LAST_VISIT:
        return ['Check invoice status', 'Create follow-up task'];

      default:
        return [];
    }
  }

  /**
   * Check if role is medical staff
   */
  private isMedicalRole(role: Role): boolean {
    const medicalRoles: Role[] = [Role.ADMIN, Role.MANAGER, Role.DOCTOR, Role.NURSE];
    return medicalRoles.includes(role);
  }

  /**
   * Log AI interaction for audit
   */
  private async logInteraction(
    user: JwtPayload,
    request: StaffCopilotRequestDto,
    response: string,
    toolsExecuted: ToolExecution[],
  ): Promise<void> {
    await this.auditService.log({
      userId: user.sub,
      tenantId: user.tenantId,
      userRole: user.role,
      action: 'STAFF_COPILOT_QUERY',
      entityType: 'StaffCopilot',
      entityId: 'query',
      after: {
        query: request.query,
        toolsExecuted: toolsExecuted.map((t) => ({
          tool: t.tool,
          success: t.success,
        })),
        context: {
          entityType: request.currentEntityType,
          entityId: request.currentEntityId,
        },
      },
    });
  }
}
