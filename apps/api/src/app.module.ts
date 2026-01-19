import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { AuditModule } from './modules/audit/audit.module';
import { ActivityModule } from './modules/activity/activity.module';

// Milestone 2 Modules
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { PatientsModule } from './modules/patients/patients.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { VisitsModule } from './modules/visits/visits.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { AttachmentsModule } from './modules/attachments/attachments.module';
import { SequencesModule } from './modules/sequences/sequences.module';

// Milestone 3 Modules
import { ConversationsModule } from './modules/conversations/conversations.module';
import { LeadsModule } from './modules/leads/leads.module';
import { TasksModule } from './modules/tasks/tasks.module';

// Milestone 4 Modules
import { AiModule } from './modules/ai/ai.module';

// Milestone 6 Modules
import { AnalyticsModule } from './modules/analytics/analytics.module';

// Milestone 7 Modules
import { NotificationsModule } from './modules/notifications/notifications.module';

// Milestone 9 Modules
import { InventoryModule } from './modules/inventory/inventory.module';
import { SchedulingModule } from './modules/scheduling/scheduling.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';

import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { TenantGuard } from './modules/tenant/guards/tenant.guard';
import { TenantMiddleware } from './modules/tenant/middleware/tenant.middleware';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { AuditInterceptor } from './modules/audit/interceptors/audit.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Event Emitter for notifications
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),

    // Core Infrastructure
    PrismaModule,
    RedisModule,

    // Feature Modules - Milestone 1
    HealthModule,
    AuthModule,
    TenantModule,
    AuditModule,
    ActivityModule,

    // Feature Modules - Milestone 2
    UsersModule,
    ServicesModule,
    PatientsModule,
    AppointmentsModule,
    VisitsModule,
    InvoicesModule,
    AttachmentsModule,
    SequencesModule,

    // Feature Modules - Milestone 3
    ConversationsModule,
    LeadsModule,
    TasksModule,

    // Feature Modules - Milestone 4
    AiModule,

    // Feature Modules - Milestone 6
    AnalyticsModule,

    // Feature Modules - Milestone 7
    NotificationsModule,

    // Feature Modules - Milestone 9
    InventoryModule,
    SchedulingModule,
    IntegrationsModule,
  ],
  controllers: [],
  providers: [
    // Global rate limiting guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Global JWT authentication guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global roles guard
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global tenant guard
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    // Global audit interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply tenant middleware to all routes
    consumer.apply(TenantMiddleware).forRoutes('*');
    // Apply tenant context middleware for AsyncLocalStorage propagation
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
