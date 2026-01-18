import { PrismaClient } from '@prisma/client';

export type MockPrismaClient = {
  [K in keyof PrismaClient]: K extends `$${string}`
    ? jest.Mock
    : {
        findUnique: jest.Mock;
        findFirst: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
        count: jest.Mock;
        aggregate: jest.Mock;
        groupBy: jest.Mock;
        upsert: jest.Mock;
        deleteMany: jest.Mock;
        updateMany: jest.Mock;
        createMany: jest.Mock;
      };
};

export function createMockPrismaClient(): MockPrismaClient {
  const mockModel = {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
    updateMany: jest.fn(),
    createMany: jest.fn(),
  };

  return {
    user: { ...mockModel },
    tenant: { ...mockModel },
    branch: { ...mockModel },
    patient: { ...mockModel },
    appointment: { ...mockModel },
    visit: { ...mockModel },
    service: { ...mockModel },
    invoice: { ...mockModel },
    payment: { ...mockModel },
    attachment: { ...mockModel },
    auditLog: { ...mockModel },
    activity: { ...mockModel },
    conversation: { ...mockModel },
    message: { ...mockModel },
    lead: { ...mockModel },
    task: { ...mockModel },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn((fn) => {
      if (typeof fn === 'function') {
        return fn(createMockPrismaClient());
      }
      return Promise.all(fn);
    }),
    $queryRaw: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRawUnsafe: jest.fn(),
    $executeRawUnsafe: jest.fn(),
  } as unknown as MockPrismaClient;
}

export class MockPrismaService {
  user = this.createMockModel();
  tenant = this.createMockModel();
  branch = this.createMockModel();
  patient = this.createMockModel();
  appointment = this.createMockModel();
  visit = this.createMockModel();
  service = this.createMockModel();
  invoice = this.createMockModel();
  payment = this.createMockModel();
  attachment = this.createMockModel();
  auditLog = this.createMockModel();
  activity = this.createMockModel();
  conversation = this.createMockModel();
  message = this.createMockModel();
  lead = this.createMockModel();
  task = this.createMockModel();

  $connect = jest.fn();
  $disconnect = jest.fn();
  $transaction = jest.fn((operations: unknown[]) => Promise.all(operations));
  $queryRaw = jest.fn();
  $executeRaw = jest.fn();
  $queryRawUnsafe = jest.fn();
  $executeRawUnsafe = jest.fn();

  private createMockModel() {
    return {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    };
  }

  resetAllMocks() {
    const models = [
      'user',
      'tenant',
      'branch',
      'patient',
      'appointment',
      'visit',
      'service',
      'invoice',
      'payment',
      'attachment',
      'auditLog',
      'activity',
      'conversation',
      'message',
      'lead',
      'task',
    ];

    for (const model of models) {
      const mockModel = this[model as keyof this] as Record<string, jest.Mock>;
      Object.values(mockModel).forEach((mock) => mock.mockReset());
    }

    this.$connect.mockReset();
    this.$disconnect.mockReset();
    this.$transaction.mockReset();
    this.$queryRaw.mockReset();
    this.$executeRaw.mockReset();
  }
}
