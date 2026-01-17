import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { AttachmentEntityType, Role } from '@prisma/client';

import { AttachmentsService } from './attachments.service';
import { UploadAttachmentDto } from './dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Audit } from '../audit/decorators/audit.decorator';

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        entityType: {
          type: 'string',
          enum: Object.values(AttachmentEntityType),
        },
        entityId: {
          type: 'string',
        },
      },
      required: ['file', 'entityType', 'entityId'],
    },
  })
  @Audit({ action: 'upload', entityType: 'Attachment' })
  @ApiOperation({ summary: 'Upload a file attachment' })
  @ApiResponse({ status: 201, description: 'File uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAttachmentDto,
  ) {
    return this.attachmentsService.upload(user, file, dto.entityType, dto.entityId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attachment by ID (includes signed download URL)' })
  @ApiResponse({ status: 200, description: 'Attachment found with download URL' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async findById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.attachmentsService.findById(user, id);
  }

  @Delete(':id')
  @Audit({ action: 'delete', entityType: 'Attachment', entityIdParam: 'id' })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  @ApiResponse({ status: 403, description: 'Only uploader or admin can delete' })
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.attachmentsService.delete(user, id);
  }
}

// Controller for getting attachments by entity
@ApiTags('patients')
@ApiBearerAuth()
@Controller('patients')
export class PatientAttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get(':id/attachments')
  @ApiOperation({ summary: 'Get patient attachments' })
  @ApiResponse({ status: 200, description: 'List of attachments' })
  async getPatientAttachments(
    @CurrentUser() user: JwtPayload,
    @Param('id') entityId: string,
  ) {
    return this.attachmentsService.getEntityAttachments(
      user,
      AttachmentEntityType.PATIENT,
      entityId,
    );
  }
}

@ApiTags('visits')
@ApiBearerAuth()
@Controller('visits')
export class VisitAttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get(':id/attachments')
  @Roles(Role.DOCTOR, Role.NURSE, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get visit attachments' })
  @ApiResponse({ status: 200, description: 'List of attachments' })
  async getVisitAttachments(
    @CurrentUser() user: JwtPayload,
    @Param('id') entityId: string,
  ) {
    return this.attachmentsService.getEntityAttachments(
      user,
      AttachmentEntityType.VISIT,
      entityId,
    );
  }
}

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoiceAttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}

  @Get(':id/attachments')
  @Roles(Role.ACCOUNTANT, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get invoice attachments' })
  @ApiResponse({ status: 200, description: 'List of attachments' })
  async getInvoiceAttachments(
    @CurrentUser() user: JwtPayload,
    @Param('id') entityId: string,
  ) {
    return this.attachmentsService.getEntityAttachments(
      user,
      AttachmentEntityType.INVOICE,
      entityId,
    );
  }
}
