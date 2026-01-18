import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Channel, PipelineStage } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ToolsGatewayService } from './tools-gateway.service';
import {
  CustomerAgentRequestDto,
  CustomerAgentResponseDto,
  CustomerAgentIntent,
  SuggestedAction,
  ExtractedData,
} from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';
import { ToolName } from './dto';

// Keywords that indicate different intents
const INTENT_KEYWORDS: Record<CustomerAgentIntent, string[]> = {
  [CustomerAgentIntent.GENERAL_INQUIRY]: ['information', 'tell me about', 'what is', 'how does'],
  [CustomerAgentIntent.SERVICE_INQUIRY]: ['service', 'treatment', 'procedure', 'offer', 'do you have'],
  [CustomerAgentIntent.PRICING_INQUIRY]: ['price', 'cost', 'how much', 'fee', 'expensive', 'discount'],
  [CustomerAgentIntent.APPOINTMENT_REQUEST]: ['appointment', 'book', 'schedule', 'available', 'slot', 'when can'],
  [CustomerAgentIntent.APPOINTMENT_RESCHEDULE]: ['reschedule', 'change appointment', 'move my', 'different time'],
  [CustomerAgentIntent.APPOINTMENT_CANCEL]: ['cancel', 'cancel appointment', 'not coming'],
  [CustomerAgentIntent.COMPLAINT]: ['complaint', 'unhappy', 'problem', 'issue', 'bad', 'terrible', 'angry'],
  [CustomerAgentIntent.MEDICAL_QUESTION]: ['symptom', 'pain', 'medicine', 'prescription', 'diagnosis', 'treatment plan', 'side effect'],
  [CustomerAgentIntent.OTHER]: [],
};

// Phrases that should trigger human handoff
const HANDOFF_TRIGGERS = [
  'speak to a human',
  'talk to someone',
  'real person',
  'emergency',
  'urgent',
  'lawyer',
  'sue',
  'legal',
  'manager',
  'supervisor',
];

@Injectable()
export class CustomerAgentService {
  private readonly logger = new Logger(CustomerAgentService.name);
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
   * Process a customer message and generate a response
   */
  async processMessage(
    user: JwtPayload,
    request: CustomerAgentRequestDto,
  ): Promise<CustomerAgentResponseDto> {
    const { message, conversationId, leadId, patientId, messageHistory, customerPhone, customerName, channel } = request;

    // Detect intent from the message
    const intent = this.detectIntent(message);

    // Check for explicit handoff requests
    const handoffCheck = this.checkForHandoffTriggers(message);
    if (handoffCheck.required) {
      return this.createHandoffResponse(intent, handoffCheck.reason!);
    }

    // Medical questions always require handoff
    if (intent === CustomerAgentIntent.MEDICAL_QUESTION) {
      return this.createHandoffResponse(
        intent,
        'Medical questions require review by our medical team',
      );
    }

    // Complaints with strong language require handoff
    if (intent === CustomerAgentIntent.COMPLAINT && this.hasStrongNegativeSentiment(message)) {
      return this.createHandoffResponse(
        intent,
        'Customer concern requires personal attention',
      );
    }

    // Extract data from the message
    const extractedData = this.extractData(message, messageHistory);

    // Try to find existing patient
    let foundPatientId = patientId;
    let foundLeadId = leadId;

    if (!foundPatientId && customerPhone) {
      const result = await this.toolsGateway.executeTool(
        user,
        ToolName.FIND_PATIENT_BY_PHONE,
        { phone: customerPhone },
        'customer',
      );
      if (result.success && result.data) {
        foundPatientId = (result.data as { id: string }).id;
      }
    }

    // If no patient found, check for lead
    if (!foundPatientId && !foundLeadId && customerPhone) {
      const lead = await this.prisma.lead.findFirst({
        where: {
          tenantId: user.tenantId,
          phone: customerPhone,
        },
      });
      if (lead) {
        foundLeadId = lead.id;
      }
    }

    // Generate response based on intent
    let response: CustomerAgentResponseDto;

    switch (intent) {
      case CustomerAgentIntent.APPOINTMENT_REQUEST:
        response = await this.handleAppointmentRequest(user, extractedData, foundPatientId, foundLeadId);
        break;
      case CustomerAgentIntent.PRICING_INQUIRY:
        response = await this.handlePricingInquiry(user, extractedData);
        break;
      case CustomerAgentIntent.SERVICE_INQUIRY:
        response = await this.handleServiceInquiry(user, extractedData);
        break;
      case CustomerAgentIntent.APPOINTMENT_RESCHEDULE:
      case CustomerAgentIntent.APPOINTMENT_CANCEL:
        response = this.createHandoffResponse(
          intent,
          'Appointment changes require verification by our team',
        );
        break;
      default:
        response = await this.handleGeneralInquiry(user, message, extractedData);
    }

    // Create or update lead if we have new contact info
    if (!foundPatientId && (customerPhone || extractedData.phone)) {
      const newLeadId = await this.createOrUpdateLead(
        user,
        foundLeadId,
        {
          name: customerName || extractedData.name,
          phone: customerPhone || extractedData.phone,
          email: extractedData.email,
          channel: channel as Channel || Channel.WEB_CHAT,
        },
      );
      response.leadId = newLeadId;
    }

    response.intent = intent;
    response.extractedData = extractedData;

    // Log the interaction
    await this.logInteraction(user, request, response);

    return response;
  }

  /**
   * Detect the intent of a customer message
   */
  private detectIntent(message: string): CustomerAgentIntent {
    const lowerMessage = message.toLowerCase();

    // Check each intent's keywords
    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      if (keywords.some((keyword) => lowerMessage.includes(keyword))) {
        return intent as CustomerAgentIntent;
      }
    }

    return CustomerAgentIntent.OTHER;
  }

  /**
   * Check if the message contains triggers that require human handoff
   */
  private checkForHandoffTriggers(message: string): { required: boolean; reason?: string } {
    const lowerMessage = message.toLowerCase();

    for (const trigger of HANDOFF_TRIGGERS) {
      if (lowerMessage.includes(trigger)) {
        return {
          required: true,
          reason: `Customer requested human assistance`,
        };
      }
    }

    return { required: false };
  }

  /**
   * Check for strong negative sentiment
   */
  private hasStrongNegativeSentiment(message: string): boolean {
    const strongNegativeWords = ['terrible', 'awful', 'worst', 'hate', 'furious', 'disgusting', 'outrageous'];
    const lowerMessage = message.toLowerCase();
    return strongNegativeWords.some((word) => lowerMessage.includes(word));
  }

  /**
   * Extract structured data from the message
   */
  private extractData(
    message: string,
    messageHistory?: { role: 'user' | 'assistant'; content: string }[],
  ): ExtractedData {
    const allMessages = [
      ...(messageHistory?.map((m) => m.content) || []),
      message,
    ].join(' ');

    const data: ExtractedData = {};

    // Extract phone number
    const phoneMatch = allMessages.match(/(?:\+964|0)?7\d{9}/);
    if (phoneMatch) {
      data.phone = phoneMatch[0];
    }

    // Extract email
    const emailMatch = allMessages.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      data.email = emailMatch[0];
    }

    // Extract date (simple patterns)
    const datePatterns = [
      /(?:tomorrow|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}/,
    ];
    for (const pattern of datePatterns) {
      const match = allMessages.match(pattern);
      if (match) {
        data.preferredDate = match[0];
        break;
      }
    }

    // Extract time
    const timeMatch = allMessages.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?/);
    if (timeMatch) {
      data.preferredTime = timeMatch[0];
    }

    return data;
  }

  /**
   * Handle appointment booking request
   */
  private async handleAppointmentRequest(
    user: JwtPayload,
    extractedData: ExtractedData,
    patientId?: string,
    leadId?: string,
  ): Promise<CustomerAgentResponseDto> {
    // Get available slots for tomorrow as default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const slotsResult = await this.toolsGateway.executeTool(
      user,
      ToolName.GET_NEXT_AVAILABLE_SLOTS,
      { date: tomorrow.toISOString().split('T')[0] },
      'customer',
    );

    if (!slotsResult.success) {
      return {
        response: 'I apologize, but I am having trouble checking our availability. Let me connect you with our team who can help you book an appointment.',
        intent: CustomerAgentIntent.APPOINTMENT_REQUEST,
        requiresHumanHandoff: true,
        handoffReason: 'Unable to fetch appointment slots',
      };
    }

    const slotsData = slotsResult.data as { availableSlots: { start: string; end: string }[]; totalAvailable: number };

    if (slotsData.totalAvailable === 0) {
      return {
        response: 'I apologize, but we do not have any available slots for tomorrow. Would you like me to check another day, or connect you with our team to find the best time for you?',
        intent: CustomerAgentIntent.APPOINTMENT_REQUEST,
        suggestedActions: [
          {
            type: 'follow_up',
            description: 'Check alternative dates',
            params: { action: 'check_more_dates' },
          },
        ],
      };
    }

    // Format available slots for response
    const formattedSlots = slotsData.availableSlots.slice(0, 3).map((slot) => {
      const time = new Date(slot.start);
      return time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    });

    const response = patientId
      ? `Great! I can see you are already a patient with us. We have availability tomorrow at ${formattedSlots.join(', ')}. Would any of these times work for you?`
      : `Thank you for your interest! We have availability tomorrow at ${formattedSlots.join(', ')}. Which time would you prefer? I will also need your name and phone number to complete the booking.`;

    return {
      response,
      intent: CustomerAgentIntent.APPOINTMENT_REQUEST,
      suggestedActions: [
        {
          type: 'create_appointment',
          description: 'Create appointment once patient confirms time',
          params: {
            availableSlots: slotsData.availableSlots.slice(0, 3),
            patientId,
            leadId,
          },
        },
      ],
    };
  }

  /**
   * Handle pricing inquiry
   */
  private async handlePricingInquiry(
    user: JwtPayload,
    extractedData: ExtractedData,
  ): Promise<CustomerAgentResponseDto> {
    // Get services list
    const services = await this.prisma.service.findMany({
      where: {
        tenantId: user.tenantId,
        active: true,
      },
      select: {
        name: true,
        price: true,
        category: true,
      },
      take: 10,
    });

    if (services.length === 0) {
      return {
        response: 'For detailed pricing information, please contact our team directly. They will be happy to provide you with a complete price list.',
        intent: CustomerAgentIntent.PRICING_INQUIRY,
        requiresHumanHandoff: true,
        handoffReason: 'No services configured - needs human assistance',
      };
    }

    const serviceList = services
      .map((s) => `• ${s.name}: ${s.price.toNumber().toLocaleString()} IQD`)
      .join('\n');

    return {
      response: `Here are our main services and prices:\n\n${serviceList}\n\nWould you like to book an appointment for any of these services?`,
      intent: CustomerAgentIntent.PRICING_INQUIRY,
    };
  }

  /**
   * Handle service inquiry
   */
  private async handleServiceInquiry(
    user: JwtPayload,
    extractedData: ExtractedData,
  ): Promise<CustomerAgentResponseDto> {
    const services = await this.prisma.service.findMany({
      where: {
        tenantId: user.tenantId,
        active: true,
      },
      select: {
        name: true,
        category: true,
      },
      take: 15,
    });

    if (services.length === 0) {
      return {
        response: 'For information about our services, please contact our team directly.',
        intent: CustomerAgentIntent.SERVICE_INQUIRY,
        requiresHumanHandoff: true,
        handoffReason: 'No services configured',
      };
    }

    // Group by category
    const categories = new Map<string | null, string[]>();
    services.forEach((s) => {
      const cat = s.category || 'General';
      if (!categories.has(cat)) {
        categories.set(cat, []);
      }
      categories.get(cat)!.push(s.name);
    });

    let serviceList = '';
    categories.forEach((serviceNames, category) => {
      serviceList += `\n${category}:\n${serviceNames.map((n) => `• ${n}`).join('\n')}`;
    });

    return {
      response: `We offer a wide range of services:${serviceList}\n\nWould you like more details about any specific service, or would you like to book an appointment?`,
      intent: CustomerAgentIntent.SERVICE_INQUIRY,
    };
  }

  /**
   * Handle general inquiry with default response
   */
  private async handleGeneralInquiry(
    user: JwtPayload,
    message: string,
    extractedData: ExtractedData,
  ): Promise<CustomerAgentResponseDto> {
    // Get clinic info
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { name: true },
    });

    const clinicName = tenant?.name || 'our clinic';

    return {
      response: `Thank you for contacting ${clinicName}! How can I help you today? I can assist you with:\n\n• Booking appointments\n• Information about our services\n• Pricing inquiries\n• General questions\n\nWhat would you like to know?`,
      intent: CustomerAgentIntent.GENERAL_INQUIRY,
    };
  }

  /**
   * Create a response that requires human handoff
   */
  private createHandoffResponse(
    intent: CustomerAgentIntent,
    reason: string,
  ): CustomerAgentResponseDto {
    return {
      response: 'Thank you for your message. I am connecting you with one of our team members who can better assist you. They will respond shortly.',
      intent,
      requiresHumanHandoff: true,
      handoffReason: reason,
      suggestedActions: [
        {
          type: 'escalate',
          description: reason,
        },
      ],
    };
  }

  /**
   * Create or update a lead
   */
  private async createOrUpdateLead(
    user: JwtPayload,
    existingLeadId: string | undefined,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      channel: Channel;
    },
  ): Promise<string> {
    if (!data.phone) {
      return existingLeadId || '';
    }

    if (existingLeadId) {
      // Update existing lead
      await this.prisma.lead.update({
        where: { id: existingLeadId },
        data: {
          name: data.name || undefined,
          email: data.email || undefined,
        },
      });
      return existingLeadId;
    }

    // Check if lead already exists
    const existingLead = await this.prisma.lead.findFirst({
      where: {
        tenantId: user.tenantId,
        phone: data.phone,
      },
    });

    if (existingLead) {
      return existingLead.id;
    }

    // Create new lead
    const lead = await this.prisma.lead.create({
      data: {
        tenantId: user.tenantId,
        name: data.name || 'Unknown',
        phone: data.phone,
        email: data.email,
        source: data.channel,
        stage: PipelineStage.INQUIRY,
      },
    });

    return lead.id;
  }

  /**
   * Log AI interaction for audit
   */
  private async logInteraction(
    user: JwtPayload,
    request: CustomerAgentRequestDto,
    response: CustomerAgentResponseDto,
  ): Promise<void> {
    await this.auditService.log({
      userId: user.sub,
      tenantId: user.tenantId,
      userRole: user.role,
      action: 'CUSTOMER_AGENT_INTERACTION',
      entityType: 'CustomerAgent',
      entityId: request.conversationId || 'new',
      after: {
        intent: response.intent,
        requiresHandoff: response.requiresHumanHandoff,
        handoffReason: response.handoffReason,
        leadId: response.leadId,
      },
    });
  }
}
