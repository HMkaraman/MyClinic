import { Module } from '@nestjs/common';

import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
