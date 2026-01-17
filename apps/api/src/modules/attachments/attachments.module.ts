import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';

import { AttachmentsService } from './attachments.service';
import {
  AttachmentsController,
  PatientAttachmentsController,
  VisitAttachmentsController,
  InvoiceAttachmentsController,
} from './attachments.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
    ActivityModule,
  ],
  controllers: [
    AttachmentsController,
    PatientAttachmentsController,
    VisitAttachmentsController,
    InvoiceAttachmentsController,
  ],
  providers: [AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
