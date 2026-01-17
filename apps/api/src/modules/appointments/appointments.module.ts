import { Module } from '@nestjs/common';

import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
