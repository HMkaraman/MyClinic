import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, Role, MessageDirection } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import {
  CreateConversationDto,
  UpdateConversationDto,
  QueryConversationsDto,
  CreateMessageDto,
  CreateInternalNoteDto,
} from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(user: JwtPayload, query: QueryConversationsDto) {
    const {
      channel,
      status,
      assignedTo,
      unassigned,
      tags,
      pipelineStage,
      patientId,
      leadId,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.ConversationWhereInput = {
      tenantId: user.tenantId,
    };

    if (channel) {
      where.channel = channel;
    }

    if (status) {
      where.status = status;
    }

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    if (unassigned) {
      where.assignedTo = null;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (pipelineStage) {
      where.pipelineStage = pipelineStage;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (leadId) {
      where.leadId = leadId;
    }

    // Non-admin users can only see conversations assigned to them or unassigned
    if (!ADMIN_ROLES.includes(user.role) && user.role !== Role.SUPPORT) {
      where.OR = [
        { assignedTo: user.sub },
        { assignedTo: null },
      ];
    }

    const orderBy: Prisma.ConversationOrderByWithRelationInput = {};
    if (sortBy === 'lastMessageAt') {
      orderBy.lastMessageAt = sortOrder;
    } else {
      orderBy[sortBy as keyof Prisma.ConversationOrderByWithRelationInput] = sortOrder;
    }

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          lead: {
            select: { id: true, name: true, phone: true, stage: true },
          },
          patient: {
            select: { id: true, name: true, phone: true, fileNumber: true },
          },
          assignee: {
            select: { id: true, name: true, email: true },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              direction: true,
              isInternalNote: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      data: conversations,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(user: JwtPayload, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        lead: {
          select: { id: true, name: true, phone: true, email: true, stage: true, source: true },
        },
        patient: {
          select: { id: true, name: true, phone: true, email: true, fileNumber: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async getMessages(user: JwtPayload, conversationId: string, page = 1, limit = 50) {
    // Verify conversation exists and user has access
    await this.findById(user, conversationId);

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);

    return {
      data: messages.reverse(), // Return in chronological order
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(user: JwtPayload, dto: CreateConversationDto) {
    const conversation = await this.prisma.conversation.create({
      data: {
        tenantId: user.tenantId,
        channel: dto.channel,
        externalId: dto.externalId,
        leadId: dto.leadId,
        patientId: dto.patientId,
        assignedTo: dto.assignedTo,
        tags: dto.tags || [],
        pipelineStage: dto.pipelineStage,
      },
      include: {
        lead: {
          select: { id: true, name: true, phone: true },
        },
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await this.activityService.logConversationActivity(
      user.tenantId,
      conversation.id,
      'created',
      user.sub,
      { channel: conversation.channel },
    );

    return conversation;
  }

  async update(user: JwtPayload, id: string, dto: UpdateConversationDto) {
    const existing = await this.findById(user, id);

    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: {
        assignedTo: dto.assignedTo,
        tags: dto.tags,
        pipelineStage: dto.pipelineStage,
        status: dto.status,
        patientId: dto.patientId,
        leadId: dto.leadId,
      },
      include: {
        lead: {
          select: { id: true, name: true, phone: true },
        },
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity for status change
    if (dto.status && dto.status !== existing.status) {
      await this.activityService.logConversationActivity(
        user.tenantId,
        conversation.id,
        'status_changed',
        user.sub,
        { from: existing.status, to: dto.status },
      );
    }

    // Log activity for assignment change
    if (dto.assignedTo && dto.assignedTo !== existing.assignedTo) {
      await this.activityService.logConversationActivity(
        user.tenantId,
        conversation.id,
        'assigned',
        user.sub,
        { assignedTo: dto.assignedTo },
      );
    }

    return conversation;
  }

  async assign(user: JwtPayload, id: string, assignedTo: string) {
    const existing = await this.findById(user, id);

    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: { assignedTo },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await this.activityService.logConversationActivity(
      user.tenantId,
      conversation.id,
      'assigned',
      user.sub,
      { from: existing.assignedTo, to: assignedTo },
    );

    return conversation;
  }

  async addTags(user: JwtPayload, id: string, tags: string[]) {
    const existing = await this.findById(user, id);
    const newTags = [...new Set([...existing.tags, ...tags])];

    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: { tags: newTags },
    });

    // Log activity
    await this.activityService.logConversationActivity(
      user.tenantId,
      conversation.id,
      'tags_added',
      user.sub,
      { tags },
    );

    return conversation;
  }

  async removeTag(user: JwtPayload, id: string, tag: string) {
    const existing = await this.findById(user, id);
    const newTags = existing.tags.filter((t) => t !== tag);

    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: { tags: newTags },
    });

    // Log activity
    await this.activityService.logConversationActivity(
      user.tenantId,
      conversation.id,
      'tag_removed',
      user.sub,
      { tag },
    );

    return conversation;
  }

  async addMessage(user: JwtPayload, conversationId: string, dto: CreateMessageDto) {
    // Verify conversation exists
    await this.findById(user, conversationId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        direction: dto.direction,
        content: dto.content,
        isInternalNote: dto.isInternalNote || false,
        attachments: dto.attachments || [],
        senderId: dto.direction === MessageDirection.OUTBOUND ? user.sub : null,
        externalSenderId: dto.externalSenderId,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Update conversation's lastMessageAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Log activity
    await this.activityService.logConversationActivity(
      user.tenantId,
      conversationId,
      dto.isInternalNote ? 'internal_note_added' : 'message_sent',
      user.sub,
      { messageId: message.id, direction: dto.direction },
    );

    return message;
  }

  async addInternalNote(user: JwtPayload, conversationId: string, dto: CreateInternalNoteDto) {
    // Verify conversation exists
    await this.findById(user, conversationId);

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        direction: MessageDirection.OUTBOUND,
        content: dto.content,
        isInternalNote: true,
        attachments: dto.attachments || [],
        senderId: user.sub,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await this.activityService.logConversationActivity(
      user.tenantId,
      conversationId,
      'internal_note_added',
      user.sub,
      { messageId: message.id },
    );

    return message;
  }

  async markMessagesAsRead(user: JwtPayload, conversationId: string) {
    // Verify conversation exists
    await this.findById(user, conversationId);

    await this.prisma.message.updateMany({
      where: {
        conversationId,
        direction: MessageDirection.INBOUND,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return { message: 'Messages marked as read' };
  }

  async linkToPatient(user: JwtPayload, id: string, patientId: string) {
    await this.findById(user, id);

    // Verify patient exists
    const patient = await this.prisma.patient.findFirst({
      where: {
        id: patientId,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const conversation = await this.prisma.conversation.update({
      where: { id },
      data: { patientId },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, fileNumber: true },
        },
      },
    });

    // Log activity
    await this.activityService.logConversationActivity(
      user.tenantId,
      conversation.id,
      'linked_to_patient',
      user.sub,
      { patientId, patientName: patient.name },
    );

    return conversation;
  }

  async getUnreadCount(user: JwtPayload) {
    const where: Prisma.ConversationWhereInput = {
      tenantId: user.tenantId,
      messages: {
        some: {
          direction: MessageDirection.INBOUND,
          readAt: null,
        },
      },
    };

    // Non-admin users can only see their assigned or unassigned conversations
    if (!ADMIN_ROLES.includes(user.role) && user.role !== Role.SUPPORT) {
      where.OR = [
        { assignedTo: user.sub },
        { assignedTo: null },
      ];
    }

    const count = await this.prisma.conversation.count({ where });

    return { unreadCount: count };
  }
}
