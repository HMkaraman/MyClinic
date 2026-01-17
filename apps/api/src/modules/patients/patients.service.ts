import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreatePatientDto, UpdatePatientDto, QueryPatientsDto } from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(user: JwtPayload, query: QueryPatientsDto) {
    const {
      search,
      branchId,
      gender,
      source,
      includeDeleted,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.PatientWhereInput = {
      tenantId: user.tenantId,
    };

    // Branch scoping for non-admin users
    if (branchId) {
      where.branchId = branchId;
    } else if (
      !ADMIN_ROLES.includes(user.role) &&
      user.branchIds.length > 0
    ) {
      where.branchId = { in: user.branchIds };
    }

    // Soft delete filter
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { fileNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (gender) {
      where.gender = gender;
    }

    if (source) {
      where.source = source;
    }

    const [patients, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy!]: sortOrder },
        include: {
          branch: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.patient.count({ where }),
    ]);

    return {
      data: patients,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(user: JwtPayload, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Branch access check for non-admin users
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(patient.branchId)
    ) {
      throw new ForbiddenException('Access denied to this patient');
    }

    return patient;
  }

  async search(user: JwtPayload, searchTerm: string) {
    const where: Prisma.PatientWhereInput = {
      tenantId: user.tenantId,
      deletedAt: null,
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm } },
        { fileNumber: { contains: searchTerm, mode: 'insensitive' } },
      ],
    };

    // Branch scoping for non-admin users
    if (
      !ADMIN_ROLES.includes(user.role) &&
      user.branchIds.length > 0
    ) {
      where.branchId = { in: user.branchIds };
    }

    const patients = await this.prisma.patient.findMany({
      where,
      take: 10,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        phone: true,
        fileNumber: true,
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    return patients;
  }

  async create(user: JwtPayload, dto: CreatePatientDto) {
    // Check duplicate phone within tenant
    const existingPatient = await this.prisma.patient.findFirst({
      where: {
        tenantId: user.tenantId,
        phone: dto.phone,
        deletedAt: null,
      },
    });

    if (existingPatient) {
      throw new ConflictException(
        `Patient with phone ${dto.phone} already exists (File: ${existingPatient.fileNumber})`,
      );
    }

    // Branch access check for non-admin users
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(dto.branchId)
    ) {
      throw new ForbiddenException('Access denied to this branch');
    }

    // Generate unique file number
    const fileNumber = await this.generateFileNumber(user.tenantId);

    const patient = await this.prisma.patient.create({
      data: {
        tenantId: user.tenantId,
        branchId: dto.branchId,
        fileNumber,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        address: dto.address,
        medicalSummary: dto.medicalSummary as Prisma.InputJsonValue,
        source: dto.source,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await this.activityService.logPatientActivity(
      patient.id,
      'created',
      user.sub,
      { name: patient.name, fileNumber: patient.fileNumber },
    );

    return patient;
  }

  async update(user: JwtPayload, id: string, dto: UpdatePatientDto) {
    const existingPatient = await this.prisma.patient.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!existingPatient) {
      throw new NotFoundException('Patient not found');
    }

    // Branch access check for non-admin users
    if (
      !ADMIN_ROLES.includes(user.role) &&
      !user.branchIds.includes(existingPatient.branchId)
    ) {
      throw new ForbiddenException('Access denied to this patient');
    }

    // Check duplicate phone if changing
    if (dto.phone && dto.phone !== existingPatient.phone) {
      const duplicatePatient = await this.prisma.patient.findFirst({
        where: {
          tenantId: user.tenantId,
          phone: dto.phone,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (duplicatePatient) {
        throw new ConflictException(
          `Patient with phone ${dto.phone} already exists (File: ${duplicatePatient.fileNumber})`,
        );
      }
    }

    const updateData: any = { ...dto };

    if (dto.dateOfBirth) {
      updateData.dateOfBirth = new Date(dto.dateOfBirth);
    }

    const patient = await this.prisma.patient.update({
      where: { id },
      data: updateData,
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await this.activityService.logPatientActivity(
      patient.id,
      'updated',
      user.sub,
      { updatedFields: Object.keys(dto) },
    );

    return patient;
  }

  async delete(user: JwtPayload, id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
        deletedAt: null,
      },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // Soft delete
    await this.prisma.patient.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Log activity
    await this.activityService.logPatientActivity(patient.id, 'deleted', user.sub, {
      name: patient.name,
      fileNumber: patient.fileNumber,
    });

    return { message: 'Patient deleted successfully' };
  }

  private async generateFileNumber(tenantId: string): Promise<string> {
    // Get the count of patients in this tenant to generate sequential number
    const count = await this.prisma.patient.count({
      where: { tenantId },
    });

    // Format: P-YYYYMMDD-XXXXX (P-20260118-00001)
    const date = new Date();
    const dateStr =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    const sequence = (count + 1).toString().padStart(5, '0');

    return `P-${dateStr}-${sequence}`;
  }
}
