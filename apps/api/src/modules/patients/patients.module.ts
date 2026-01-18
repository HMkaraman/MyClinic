import { Module } from '@nestjs/common';

import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { ActivityModule } from '../activity/activity.module';
import { SequencesModule } from '../sequences/sequences.module';

@Module({
  imports: [ActivityModule, SequencesModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
