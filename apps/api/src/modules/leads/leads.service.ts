import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, PipelineStage, Channel, PatientSource } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateLeadDto, UpdateLeadDto, QueryLeadsDto } from './dto';
import { JwtPayload } from '../auth/decorators/current-user.decorator';

// Map Channel (lead source) to PatientSource
function channelToPatientSource(channel: Channel): PatientSource {
  const mapping: Record<Channel, PatientSource> = {
    [Channel.WHATSAPP]: PatientSource.WHATSAPP,
    [Channel.SMS]: PatientSource.PHONE,
    [Channel.EMAIL]: PatientSource.OTHER,
    [Channel.WEB_CHAT]: PatientSource.WEBSITE,
    [Channel.PHONE]: PatientSource.PHONE,
  };
  return mapping[channel] || PatientSource.OTHER;
}

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(user: JwtPayload, query: QueryLeadsDto) {
    const {
      search,
      source,
      stage,
      converted,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;
    const skip = (page! - 1) * limit!;

    const where: Prisma.LeadWhereInput = {
      tenantId: user.tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (source) {
      where.source = source;
    }

    if (stage) {
      where.stage = stage;
    }

    if (converted !== undefined) {
      if (converted) {
        where.patientId = { not: null };
      } else {
        where.patientId = null;
      }
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy!]: sortOrder },
        include: {
          patient: {
            select: { id: true, name: true, phone: true, fileNumber: true },
          },
          conversations: {
            take: 1,
            orderBy: { lastMessageAt: 'desc' },
            select: { id: true, status: true, lastMessageAt: true },
          },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: {
        total,
        page: page!,
        limit: limit!,
        totalPages: Math.ceil(total / limit!),
      },
    };
  }

  async findById(user: JwtPayload, id: string) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        tenantId: user.tenantId,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true, email: true, fileNumber: true },
        },
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          select: { id: true, channel: true, status: true, lastMessageAt: true },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async create(user: JwtPayload, dto: CreateLeadDto) {
    // Check if a lead with the same phone already exists
    const existingLead = await this.prisma.lead.findFirst({
      where: {
        tenantId: user.tenantId,
        phone: dto.phone,
      },
    });

    if (existingLead) {
      throw new ConflictException(`Lead with phone ${dto.phone} already exists`);
    }

    const lead = await this.prisma.lead.create({
      data: {
        tenantId: user.tenantId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        source: dto.source,
        stage: dto.stage || PipelineStage.INQUIRY,
        notes: dto.notes,
      },
    });

    // Log activity
    await this.activityService.logLeadActivity(
      user.tenantId,
      lead.id,
      'created',
      user.sub,
      { name: lead.name, source: lead.source },
    );

    return lead;
  }

  async update(user: JwtPayload, id: string, dto: UpdateLeadDto) {
    const existingLead = await this.findById(user, id);

    // Check duplicate phone if changing
    if (dto.phone && dto.phone !== existingLead.phone) {
      const duplicateLead = await this.prisma.lead.findFirst({
        where: {
          tenantId: user.tenantId,
          phone: dto.phone,
          id: { not: id },
        },
      });

      if (duplicateLead) {
        throw new ConflictException(`Lead with phone ${dto.phone} already exists`);
      }
    }

    const lead = await this.prisma.lead.update({
      where: { id },
      data: dto,
    });

    // Log activity
    await this.activityService.logLeadActivity(
      user.tenantId,
      lead.id,
      'updated',
      user.sub,
      { updatedFields: Object.keys(dto) },
    );

    return lead;
  }

  async changeStage(user: JwtPayload, id: string, newStage: PipelineStage, reason?: string) {
    const lead = await this.findById(user, id);
    const previousStage = lead.stage;

    if (previousStage === newStage) {
      throw new BadRequestException(`Lead is already in ${newStage} stage`);
    }

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: { stage: newStage },
    });

    // Log activity
    await this.activityService.logLeadActivity(
      user.tenantId,
      updatedLead.id,
      'stage_changed',
      user.sub,
      { from: previousStage, to: newStage, reason },
    );

    return updatedLead;
  }

  async convertToPatient(user: JwtPayload, id: string, branchId: string) {
    const lead = await this.findById(user, id);

    if (lead.patientId) {
      throw new BadRequestException('Lead is already converted to a patient');
    }

    // Generate file number for the new patient
    const count = await this.prisma.patient.count({
      where: { tenantId: user.tenantId },
    });
    const date = new Date();
    const dateStr =
      date.getFullYear().toString() +
      (date.getMonth() + 1).toString().padStart(2, '0') +
      date.getDate().toString().padStart(2, '0');
    const sequence = (count + 1).toString().padStart(5, '0');
    const fileNumber = `P-${dateStr}-${sequence}`;

    // Create patient and update lead in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          tenantId: user.tenantId,
          branchId,
          fileNumber,
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
          source: channelToPatientSource(lead.source),
        },
      });

      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          patientId: patient.id,
          stage: PipelineStage.CONVERTED,
        },
      });

      // Also link any conversations to the patient
      await tx.conversation.updateMany({
        where: { leadId: id },
        data: { patientId: patient.id },
      });

      return { lead: updatedLead, patient };
    });

    // Log activities
    await this.activityService.logLeadActivity(
      user.tenantId,
      lead.id,
      'converted_to_patient',
      user.sub,
      { patientId: result.patient.id, patientFileNumber: result.patient.fileNumber },
    );

    await this.activityService.logPatientActivity(
      user.tenantId,
      result.patient.id,
      'created_from_lead',
      user.sub,
      { leadId: lead.id },
    );

    return result;
  }

  async delete(user: JwtPayload, id: string) {
    const lead = await this.findById(user, id);

    if (lead.patientId) {
      throw new BadRequestException('Cannot delete a converted lead');
    }

    // Delete lead (cascade will handle conversations)
    await this.prisma.lead.delete({ where: { id } });

    // Log activity
    await this.activityService.logLeadActivity(
      user.tenantId,
      lead.id,
      'deleted',
      user.sub,
      { name: lead.name, phone: lead.phone },
    );

    return { message: 'Lead deleted successfully' };
  }

  async getPipelineStats(user: JwtPayload) {
    const stats = await this.prisma.lead.groupBy({
      by: ['stage'],
      where: { tenantId: user.tenantId },
      _count: { id: true },
    });

    const pipelineStages = Object.values(PipelineStage);
    const result = pipelineStages.map((stage) => ({
      stage,
      count: stats.find((s) => s.stage === stage)?._count.id || 0,
    }));

    return result;
  }
}
