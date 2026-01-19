import { Module } from '@nestjs/common';

import { ActivityModule } from '../activity/activity.module';

import { TemplatesController } from './templates/templates.controller';
import { TemplatesService } from './templates/templates.service';

import { SchedulesController } from './schedules/schedules.controller';
import { SchedulesService } from './schedules/schedules.service';

import { TimeOffController } from './time-off/time-off.controller';
import { TimeOffService } from './time-off/time-off.service';

import { AvailabilityController } from './availability/availability.controller';
import { AvailabilityService } from './availability/availability.service';

@Module({
  imports: [ActivityModule],
  controllers: [
    TemplatesController,
    SchedulesController,
    TimeOffController,
    AvailabilityController,
  ],
  providers: [
    TemplatesService,
    SchedulesService,
    TimeOffService,
    AvailabilityService,
  ],
  exports: [
    TemplatesService,
    SchedulesService,
    TimeOffService,
    AvailabilityService,
  ],
})
export class SchedulingModule {}
