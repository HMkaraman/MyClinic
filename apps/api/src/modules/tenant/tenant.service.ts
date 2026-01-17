import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findById(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async getTenantBranches(tenantId: string) {
    return this.prisma.branch.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
      },
    });
  }

  async validateBranchAccess(
    tenantId: string,
    branchId: string,
  ): Promise<boolean> {
    const branch = await this.prisma.branch.findFirst({
      where: {
        id: branchId,
        tenantId,
      },
    });

    return !!branch;
  }

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });

    return tenant?.settings || {};
  }

  async updateSettings(tenantId: string, settings: Record<string, unknown>) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: settings as any },
      select: { settings: true },
    });
  }
}
