import { Module } from '@nestjs/common';

import { InvoicesService } from './invoices.service';
import { InvoicesController, PatientInvoicesController } from './invoices.controller';
import { ActivityModule } from '../activity/activity.module';
import { SequencesModule } from '../sequences/sequences.module';

@Module({
  imports: [ActivityModule, SequencesModule],
  controllers: [InvoicesController, PatientInvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
