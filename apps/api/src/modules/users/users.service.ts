import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(tenantId: string, query: QueryUsersDto) {
    const { search, role, status, branchId, page, limit, sortBy, sortOrder } =
      query;
    const skip = (page! - 1) * limit!;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchIds = { has: branchId };
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy!]: sortOrder },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          branchIds: true,
          status: true,
          language: true,
          twoFactorEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(tenantId: string, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        branchIds: true,
        status: true,
        language: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async create(tenantId: string, dto: CreateUserDto, actorId: string) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        passwordHash,
        phone: dto.phone,
        role: dto.role,
        branchIds: dto.branchIds,
        language: dto.language,
        status: dto.status,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        branchIds: true,
        status: true,
        language: true,
        createdAt: true,
      },
    });

    // Log activity
    await this.activityService.create({
      tenantId,
      entityType: 'User',
      entityId: user.id,
      action: 'created',
      actorId,
      metadata: { email: user.email, role: user.role },
    });

    return user;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateUserDto,
    actorId: string,
  ) {
    const existingUser = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Check email uniqueness if changing email
    if (dto.email && dto.email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (emailInUse) {
        throw new ConflictException('Email already in use');
      }
    }

    const updateData: any = { ...dto };

    // Hash password if provided
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
      delete updateData.password;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        branchIds: true,
        status: true,
        language: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log activity
    await this.activityService.create({
      tenantId,
      entityType: 'User',
      entityId: user.id,
      action: 'updated',
      actorId,
      metadata: { updatedFields: Object.keys(dto) },
    });

    return user;
  }

  async delete(tenantId: string, id: string, actorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent self-deletion
    if (user.id === actorId) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    // Soft delete by setting status to INACTIVE
    await this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    // Log activity
    await this.activityService.create({
      tenantId,
      entityType: 'User',
      entityId: id,
      action: 'deleted',
      actorId,
      metadata: { email: user.email },
    });

    return { message: 'User deleted successfully' };
  }
}
