import { Module } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsCacheService } from './analytics-cache.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsCacheService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
