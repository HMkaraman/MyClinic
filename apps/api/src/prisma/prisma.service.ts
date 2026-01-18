import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { getTenantContext } from '../common/context/tenant-context';

// Models that require tenant scoping
const TENANT_SCOPED_MODELS = [
  'Appointment',
  'Patient',
  'Invoice',
  'Visit',
  'Attachment',
  'Conversation',
  'Task',
  'Lead',
  'Service',
  'Branch',
  'Message',
  'InvoiceItem',
  'Notification',
];

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();

    // Add tenant-scoping middleware
    this.$use(this.tenantScopingMiddleware.bind(this));
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Prisma middleware that auto-injects tenantId for tenant-scoped models
   */
  private async tenantScopingMiddleware(
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
  ): Promise<unknown> {
    const ctx = getTenantContext();

    // Skip if no tenant context or model is not tenant-scoped
    if (!ctx?.tenantId || !params.model || !TENANT_SCOPED_MODELS.includes(params.model)) {
      return next(params);
    }

    // Auto-inject tenantId for read operations
    if (['findUnique', 'findFirst', 'findMany', 'count', 'aggregate', 'groupBy'].includes(params.action)) {
      params.args = params.args || {};
      params.args.where = { ...params.args.where, tenantId: ctx.tenantId };
    }

    // Auto-inject tenantId for create operations
    if (params.action === 'create') {
      params.args = params.args || {};
      params.args.data = { ...params.args.data, tenantId: ctx.tenantId };
    }

    // Auto-inject tenantId for createMany operations
    if (params.action === 'createMany') {
      params.args = params.args || {};
      if (Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((item: Record<string, unknown>) => ({
          ...item,
          tenantId: ctx.tenantId,
        }));
      } else if (params.args.data) {
        params.args.data = { ...params.args.data, tenantId: ctx.tenantId };
      }
    }

    // Auto-inject tenantId for update operations
    if (['update', 'updateMany'].includes(params.action)) {
      params.args = params.args || {};
      params.args.where = { ...params.args.where, tenantId: ctx.tenantId };
    }

    // Auto-inject tenantId for delete operations
    if (['delete', 'deleteMany'].includes(params.action)) {
      params.args = params.args || {};
      params.args.where = { ...params.args.where, tenantId: ctx.tenantId };
    }

    // Auto-inject tenantId for upsert operations
    if (params.action === 'upsert') {
      params.args = params.args || {};
      params.args.where = { ...params.args.where, tenantId: ctx.tenantId };
      params.args.create = { ...params.args.create, tenantId: ctx.tenantId };
    }

    return next(params);
  }

  /**
   * Clean database for testing
   * WARNING: Only use in test environment
   */
  async cleanDatabase() {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('cleanDatabase can only be called in test environment');
    }

    const tablenames = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    try {
      await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.log({ error });
    }
  }
}
