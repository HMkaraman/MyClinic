import { Module } from '@nestjs/common';

import { VisitsService } from './visits.service';
import { VisitsController, PatientVisitsController } from './visits.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [VisitsController, PatientVisitsController],
  providers: [VisitsService],
  exports: [VisitsService],
})
export class VisitsModule {}
