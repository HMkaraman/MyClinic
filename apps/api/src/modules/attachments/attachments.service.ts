import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AttachmentEntityType, Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { JwtPayload } from '../auth/decorators/current-user.decorator';

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];
const MEDICAL_ROLES: Role[] = [Role.DOCTOR, Role.NURSE, Role.ADMIN, Role.MANAGER];
const FINANCE_ROLES: Role[] = [Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT];

// Allowed file types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class AttachmentsService {
  private s3Client: S3Client;
  private bucket: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private activityService: ActivityService,
  ) {
    // Initialize S3 client (works with MinIO too)
    const endpoint = this.configService.get<string>('S3_ENDPOINT', 'http://localhost:9000');
    const region = this.configService.get<string>('S3_REGION', 'us-east-1');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY', 'minioadmin');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY', 'minioadmin');

    this.bucket = this.configService.get<string>('S3_BUCKET', 'myclinic-attachments');

    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  async upload(
    user: JwtPayload,
    file: Express.Multer.File,
    entityType: AttachmentEntityType,
    entityId: string,
  ) {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size ${file.size} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
      );
    }

    // Verify entity exists and user has access
    await this.verifyEntityAccess(user, entityType, entityId);

    // Generate unique file path
    const fileExtension = file.originalname.split('.').pop() || 'bin';
    const uniqueId = uuidv4();
    const filePath = `${user.tenantId}/${entityType.toLowerCase()}/${entityId}/${uniqueId}.${fileExtension}`;

    // Upload to S3/MinIO
    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filePath,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          'original-name': file.originalname,
          'uploaded-by': user.sub,
          'entity-type': entityType,
          'entity-id': entityId,
        },
      }),
    );

    // Create database record
    const attachment = await this.prisma.attachment.create({
      data: {
        tenantId: user.tenantId,
        entityType,
        entityId,
        filePath,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        uploadedBy: user.sub,
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Log activity
    await this.activityService.logAttachmentActivity(
      user.tenantId,
      entityType,
      entityId,
      'attachment_uploaded',
      user.sub,
      {
        attachmentId: attachment.id,
        fileName: file.originalname,
        fileSize: file.size,
      },
    );

    return attachment;
  }

  async findById(user: JwtPayload, id: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: {
        id,
        tenantId: user.tenantId, // Always scope to tenant
      },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Verify access to the entity (branch check)
    await this.verifyEntityAccess(user, attachment.entityType, attachment.entityId);

    // Generate signed URL for download
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: attachment.filePath,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return {
      ...attachment,
      downloadUrl: signedUrl,
    };
  }

  async getEntityAttachments(
    user: JwtPayload,
    entityType: AttachmentEntityType,
    entityId: string,
  ) {
    // Verify access to the entity
    await this.verifyEntityAccess(user, entityType, entityId);

    const attachments = await this.prisma.attachment.findMany({
      where: {
        tenantId: user.tenantId, // Always scope to tenant
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return attachments;
  }

  async delete(user: JwtPayload, id: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: {
        id,
        tenantId: user.tenantId, // Always scope to tenant
      },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Only owner or admin can delete
    if (
      attachment.uploadedBy !== user.sub &&
      !ADMIN_ROLES.includes(user.role)
    ) {
      throw new ForbiddenException('Only the uploader or admin can delete this attachment');
    }

    // Delete from S3/MinIO
    await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: attachment.filePath,
      }),
    );

    // Delete from database
    await this.prisma.attachment.delete({
      where: { id },
    });

    // Log activity
    await this.activityService.logAttachmentActivity(
      user.tenantId,
      attachment.entityType,
      attachment.entityId,
      'attachment_deleted',
      user.sub,
      {
        attachmentId: id,
        fileName: attachment.fileName,
      },
    );

    return { message: 'Attachment deleted successfully' };
  }

  private async verifyEntityAccess(
    user: JwtPayload,
    entityType: AttachmentEntityType,
    entityId: string,
  ): Promise<void> {
    switch (entityType) {
      case AttachmentEntityType.PATIENT: {
        const patient = await this.prisma.patient.findFirst({
          where: {
            id: entityId,
            tenantId: user.tenantId,
            deletedAt: null,
          },
        });
        if (!patient) {
          throw new NotFoundException('Patient not found');
        }
        if (
          !ADMIN_ROLES.includes(user.role) &&
          !user.branchIds.includes(patient.branchId)
        ) {
          throw new ForbiddenException('Access denied to this patient');
        }
        break;
      }

      case AttachmentEntityType.VISIT: {
        const visit = await this.prisma.visit.findFirst({
          where: { id: entityId, tenantId: user.tenantId },
        });
        if (!visit) {
          throw new NotFoundException('Visit not found');
        }
        // Only medical staff can access visit attachments
        if (!MEDICAL_ROLES.includes(user.role)) {
          throw new ForbiddenException('Access denied to visit attachments');
        }
        if (
          !ADMIN_ROLES.includes(user.role) &&
          !user.branchIds.includes(visit.branchId) &&
          user.sub !== visit.doctorId
        ) {
          throw new ForbiddenException('Access denied to this visit');
        }
        break;
      }

      case AttachmentEntityType.APPOINTMENT: {
        const appointment = await this.prisma.appointment.findFirst({
          where: { id: entityId, tenantId: user.tenantId },
        });
        if (!appointment) {
          throw new NotFoundException('Appointment not found');
        }
        if (
          !ADMIN_ROLES.includes(user.role) &&
          !user.branchIds.includes(appointment.branchId) &&
          user.sub !== appointment.doctorId
        ) {
          throw new ForbiddenException('Access denied to this appointment');
        }
        break;
      }

      case AttachmentEntityType.INVOICE: {
        const invoice = await this.prisma.invoice.findFirst({
          where: { id: entityId, tenantId: user.tenantId },
        });
        if (!invoice) {
          throw new NotFoundException('Invoice not found');
        }
        if (
          !FINANCE_ROLES.includes(user.role) &&
          !user.branchIds.includes(invoice.branchId)
        ) {
          throw new ForbiddenException('Access denied to this invoice');
        }
        break;
      }

      case AttachmentEntityType.CONVERSATION: {
        const conversation = await this.prisma.conversation.findFirst({
          where: { id: entityId, tenantId: user.tenantId },
        });
        if (!conversation) {
          throw new NotFoundException('Conversation not found');
        }
        // Tenant check is now built into the query above
        break;
      }

      default:
        // For other entity types, just check tenantId if possible
        break;
    }
  }
}
