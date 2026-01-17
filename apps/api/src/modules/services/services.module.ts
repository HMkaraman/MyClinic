import { Module } from '@nestjs/common';

import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
