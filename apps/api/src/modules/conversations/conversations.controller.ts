import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { ConversationsService } from './conversations.service';
import {
  CreateConversationDto,
  UpdateConversationDto,
  QueryConversationsDto,
  CreateMessageDto,
  CreateInternalNoteDto,
  AssignConversationDto,
  AddTagsDto,
  RemoveTagDto,
} from './dto';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Audit } from '../audit/decorators/audit.decorator';

@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @ApiOperation({ summary: 'List conversations (Unified Inbox)' })
  @ApiResponse({ status: 200, description: 'Returns paginated conversations' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryConversationsDto,
  ) {
    return this.conversationsService.findAll(user, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of conversations with unread messages' })
  @ApiResponse({ status: 200, description: 'Returns unread count' })
  async getUnreadCount(@CurrentUser() user: JwtPayload) {
    return this.conversationsService.getUnreadCount(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation by ID' })
  @ApiResponse({ status: 200, description: 'Returns conversation details' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  async findById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.conversationsService.findById(user, id);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  @ApiResponse({ status: 200, description: 'Returns paginated messages' })
  async getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.getMessages(
      user,
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'Conversation', action: 'create' })
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ status: 201, description: 'Conversation created' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationsService.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'Conversation', action: 'update' })
  @ApiOperation({ summary: 'Update conversation' })
  @ApiResponse({ status: 200, description: 'Conversation updated' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    return this.conversationsService.update(user, id, dto);
  }

  @Post(':id/assign')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT)
  @Audit({ entityType: 'Conversation', action: 'assign' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign conversation to a user' })
  @ApiResponse({ status: 200, description: 'Conversation assigned' })
  async assign(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
  ) {
    return this.conversationsService.assign(user, id, dto.assignedTo);
  }

  @Post(':id/tags')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'Conversation', action: 'add_tags' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add tags to conversation' })
  @ApiResponse({ status: 200, description: 'Tags added' })
  async addTags(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: AddTagsDto,
  ) {
    return this.conversationsService.addTags(user, id, dto.tags);
  }

  @Post(':id/tags/remove')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'Conversation', action: 'remove_tag' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a tag from conversation' })
  @ApiResponse({ status: 200, description: 'Tag removed' })
  async removeTag(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: RemoveTagDto,
  ) {
    return this.conversationsService.removeTag(user, id, dto.tag);
  }

  @Post(':id/messages')
  @Audit({ entityType: 'Message', action: 'create' })
  @ApiOperation({ summary: 'Add a message to conversation' })
  @ApiResponse({ status: 201, description: 'Message added' })
  async addMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.conversationsService.addMessage(user, id, dto);
  }

  @Post(':id/notes')
  @Audit({ entityType: 'Message', action: 'create_internal_note' })
  @ApiOperation({ summary: 'Add an internal note to conversation' })
  @ApiResponse({ status: 201, description: 'Internal note added' })
  async addInternalNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateInternalNoteDto,
  ) {
    return this.conversationsService.addInternalNote(user, id, dto);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markAsRead(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.conversationsService.markMessagesAsRead(user, id);
  }

  @Post(':id/link-patient')
  @Roles(Role.ADMIN, Role.MANAGER, Role.SUPPORT, Role.RECEPTION)
  @Audit({ entityType: 'Conversation', action: 'link_patient' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Link conversation to a patient' })
  @ApiResponse({ status: 200, description: 'Conversation linked to patient' })
  async linkToPatient(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('patientId') patientId: string,
  ) {
    return this.conversationsService.linkToPatient(user, id, patientId);
  }
}
