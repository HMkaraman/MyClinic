import { Injectable } from '@nestjs/common';
import { Role, AppointmentStatus, InvoiceStatus, PipelineStage, Gender } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../auth/decorators/current-user.decorator';
import { AnalyticsCacheService } from './analytics-cache.service';
import { QueryAnalyticsDto, Granularity } from './dto';

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.MANAGER];

interface DateRange {
  start: Date;
  end: Date;
}

interface TrendDataPoint {
  date: string;
  value: number;
}

interface RevenueData {
  total: number;
  trend: TrendDataPoint[];
  byPaymentMethod: { method: string; amount: number }[];
  byService: { service: string; amount: number }[];
  comparison: {
    previousPeriod: number;
    percentChange: number;
  };
}

interface PatientStats {
  total: number;
  new: number;
  returning: number;
  trend: TrendDataPoint[];
  bySource: { source: string; count: number }[];
  byGender: { gender: string; count: number }[];
  byBranch: { branch: string; count: number }[];
}

interface AppointmentMetrics {
  total: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  trend: TrendDataPoint[];
  byStatus: { status: string; count: number }[];
  byDoctor: { doctor: string; count: number }[];
  averageWaitTime: number;
}

interface ServicePerformance {
  services: {
    id: string;
    name: string;
    appointmentCount: number;
    revenue: number;
    averageRating?: number;
  }[];
}

interface StaffProductivity {
  staff: {
    id: string;
    name: string;
    role: string;
    appointmentsCompleted: number;
    revenue: number;
    averageAppointmentsPerDay: number;
  }[];
}

interface LeadFunnel {
  stages: {
    stage: string;
    count: number;
    conversionRate: number;
  }[];
  bySource: { source: string; count: number }[];
  trend: TrendDataPoint[];
}

interface DashboardSummary {
  revenue: {
    total: number;
    percentChange: number;
  };
  patients: {
    total: number;
    new: number;
    percentChange: number;
  };
  appointments: {
    total: number;
    completionRate: number;
    percentChange: number;
  };
  leads: {
    total: number;
    converted: number;
    conversionRate: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: AnalyticsCacheService,
  ) {}

  private getDateRange(query: QueryAnalyticsDto): DateRange {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(now.getDate() - 30);

    return {
      start: query.dateFrom ? new Date(query.dateFrom) : defaultStart,
      end: query.dateTo ? new Date(query.dateTo) : now,
    };
  }

  private getPreviousPeriodRange(range: DateRange): DateRange {
    const duration = range.end.getTime() - range.start.getTime();
    return {
      start: new Date(range.start.getTime() - duration),
      end: new Date(range.start.getTime() - 1),
    };
  }

  private getBranchFilter(user: JwtPayload, branchId?: string): string[] | undefined {
    if (branchId) {
      return [branchId];
    }
    if (!ADMIN_ROLES.includes(user.role) && user.branchIds.length > 0) {
      return user.branchIds;
    }
    return undefined;
  }

  private formatDateForGranularity(date: Date, granularity: Granularity): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (granularity) {
      case Granularity.DAILY:
        return `${year}-${month}-${day}`;
      case Granularity.WEEKLY:
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate()) / 7)).padStart(2, '0')}`;
      case Granularity.MONTHLY:
        return `${year}-${month}`;
      default:
        return `${year}-${month}-${day}`;
    }
  }

  async getDashboard(user: JwtPayload, query: QueryAnalyticsDto): Promise<DashboardSummary> {
    const cacheKey = { branchId: query.branchId };
    const cached = await this.cacheService.getDashboardCache<DashboardSummary>(user.tenantId, query.branchId);
    if (cached) {
      return cached;
    }

    const range = this.getDateRange(query);
    const previousRange = this.getPreviousPeriodRange(range);
    const branchFilter = this.getBranchFilter(user, query.branchId);

    // Current period revenue
    const currentRevenue = await this.prisma.invoice.aggregate({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL] },
      },
      _sum: { paidAmount: true },
    });

    // Previous period revenue
    const previousRevenue = await this.prisma.invoice.aggregate({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: previousRange.start, lte: previousRange.end },
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL] },
      },
      _sum: { paidAmount: true },
    });

    // Current period patients
    const currentPatients = await this.prisma.patient.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        deletedAt: null,
      },
    });

    const newPatients = await this.prisma.patient.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        deletedAt: null,
      },
    });

    const previousNewPatients = await this.prisma.patient.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: previousRange.start, lte: previousRange.end },
        deletedAt: null,
      },
    });

    // Appointments
    const currentAppointments = await this.prisma.appointment.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
      },
    });

    const completedAppointments = await this.prisma.appointment.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
        status: AppointmentStatus.COMPLETED,
      },
    });

    const previousAppointments = await this.prisma.appointment.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: previousRange.start, lte: previousRange.end },
      },
    });

    // Leads
    const totalLeads = await this.prisma.lead.count({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: range.start, lte: range.end },
      },
    });

    const convertedLeads = await this.prisma.lead.count({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: range.start, lte: range.end },
        stage: PipelineStage.CONVERTED,
      },
    });

    const currentRevenueValue = Number(currentRevenue._sum.paidAmount || 0);
    const previousRevenueValue = Number(previousRevenue._sum.paidAmount || 0);
    const revenueChange = previousRevenueValue > 0
      ? ((currentRevenueValue - previousRevenueValue) / previousRevenueValue) * 100
      : 0;

    const patientChange = previousNewPatients > 0
      ? ((newPatients - previousNewPatients) / previousNewPatients) * 100
      : 0;

    const appointmentChange = previousAppointments > 0
      ? ((currentAppointments - previousAppointments) / previousAppointments) * 100
      : 0;

    const result: DashboardSummary = {
      revenue: {
        total: currentRevenueValue,
        percentChange: Math.round(revenueChange * 100) / 100,
      },
      patients: {
        total: currentPatients,
        new: newPatients,
        percentChange: Math.round(patientChange * 100) / 100,
      },
      appointments: {
        total: currentAppointments,
        completionRate: currentAppointments > 0
          ? Math.round((completedAppointments / currentAppointments) * 100)
          : 0,
        percentChange: Math.round(appointmentChange * 100) / 100,
      },
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        conversionRate: totalLeads > 0
          ? Math.round((convertedLeads / totalLeads) * 100)
          : 0,
      },
    };

    await this.cacheService.setDashboardCache(user.tenantId, result, query.branchId);

    return result;
  }

  async getRevenue(user: JwtPayload, query: QueryAnalyticsDto): Promise<RevenueData> {
    const range = this.getDateRange(query);
    const previousRange = this.getPreviousPeriodRange(range);
    const branchFilter = this.getBranchFilter(user, query.branchId);
    const granularity = query.granularity || Granularity.DAILY;

    // Check cache
    const cacheParams = {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      granularity,
      branchId: query.branchId,
    };
    const cached = await this.cacheService.get<RevenueData>(user.tenantId, 'revenue', cacheParams);
    if (cached) {
      return cached;
    }

    // Total revenue
    const totalRevenue = await this.prisma.invoice.aggregate({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL] },
      },
      _sum: { paidAmount: true },
    });

    // Previous period for comparison
    const previousRevenue = await this.prisma.invoice.aggregate({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: previousRange.start, lte: previousRange.end },
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL] },
      },
      _sum: { paidAmount: true },
    });

    // Revenue by payment method
    const payments = await this.prisma.payment.groupBy({
      by: ['method'],
      where: {
        invoice: {
          tenantId: user.tenantId,
          ...(branchFilter && { branchId: { in: branchFilter } }),
          createdAt: { gte: range.start, lte: range.end },
        },
      },
      _sum: { amount: true },
    });

    // Revenue trend by date
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL] },
      },
      select: {
        paidAmount: true,
        createdAt: true,
      },
    });

    // Aggregate by date
    const trendMap = new Map<string, number>();
    invoices.forEach((invoice) => {
      const dateKey = this.formatDateForGranularity(invoice.createdAt, granularity);
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + Number(invoice.paidAmount));
    });

    const trend: TrendDataPoint[] = Array.from(trendMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Revenue by service (from invoice items)
    const invoicesWithItems = await this.prisma.invoice.findMany({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL] },
      },
      select: {
        items: true,
      },
    });

    const serviceRevenueMap = new Map<string, number>();
    invoicesWithItems.forEach((invoice) => {
      const items = invoice.items as Array<{ serviceName?: string; name?: string; total?: number; amount?: number }>;
      if (Array.isArray(items)) {
        items.forEach((item) => {
          const name = item.serviceName || item.name || 'Unknown';
          const amount = Number(item.total || item.amount || 0);
          serviceRevenueMap.set(name, (serviceRevenueMap.get(name) || 0) + amount);
        });
      }
    });

    const byService = Array.from(serviceRevenueMap.entries())
      .map(([service, amount]) => ({ service, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const currentTotal = Number(totalRevenue._sum.paidAmount || 0);
    const previousTotal = Number(previousRevenue._sum.paidAmount || 0);
    const percentChange = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal) * 100
      : 0;

    const result: RevenueData = {
      total: currentTotal,
      trend,
      byPaymentMethod: payments.map((p) => ({
        method: p.method,
        amount: Number(p._sum.amount || 0),
      })),
      byService,
      comparison: {
        previousPeriod: previousTotal,
        percentChange: Math.round(percentChange * 100) / 100,
      },
    };

    await this.cacheService.set(user.tenantId, 'revenue', cacheParams, result, granularity);

    return result;
  }

  async getPatients(user: JwtPayload, query: QueryAnalyticsDto): Promise<PatientStats> {
    const range = this.getDateRange(query);
    const branchFilter = this.getBranchFilter(user, query.branchId);
    const granularity = query.granularity || Granularity.DAILY;

    const cacheParams = {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      granularity,
      branchId: query.branchId,
    };
    const cached = await this.cacheService.get<PatientStats>(user.tenantId, 'patients', cacheParams);
    if (cached) {
      return cached;
    }

    // Total patients
    const total = await this.prisma.patient.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        deletedAt: null,
      },
    });

    // New patients in period
    const newPatients = await this.prisma.patient.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        deletedAt: null,
      },
    });

    // Returning patients (had appointments before this period)
    const patientsWithPreviousAppointments = await this.prisma.patient.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        deletedAt: null,
        appointments: {
          some: {
            scheduledAt: { gte: range.start, lte: range.end },
          },
        },
        createdAt: { lt: range.start },
      },
    });

    // Patient trend by date
    const patients = await this.prisma.patient.findMany({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        deletedAt: null,
      },
      select: {
        createdAt: true,
      },
    });

    const trendMap = new Map<string, number>();
    patients.forEach((patient) => {
      const dateKey = this.formatDateForGranularity(patient.createdAt, granularity);
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
    });

    const trend: TrendDataPoint[] = Array.from(trendMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // By source
    const bySourceData = await this.prisma.patient.groupBy({
      by: ['source'],
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        deletedAt: null,
      },
      _count: true,
    });

    // By gender
    const byGenderData = await this.prisma.patient.groupBy({
      by: ['gender'],
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        deletedAt: null,
      },
      _count: true,
    });

    // By branch
    const byBranchData = await this.prisma.patient.groupBy({
      by: ['branchId'],
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        createdAt: { gte: range.start, lte: range.end },
        deletedAt: null,
      },
      _count: true,
    });

    // Get branch names
    const branchIds = byBranchData.map((b) => b.branchId);
    const branches = await this.prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true },
    });
    const branchNameMap = new Map(branches.map((b) => [b.id, b.name]));

    const result: PatientStats = {
      total,
      new: newPatients,
      returning: patientsWithPreviousAppointments,
      trend,
      bySource: bySourceData.map((s) => ({
        source: s.source,
        count: s._count,
      })),
      byGender: byGenderData
        .filter((g) => g.gender !== null)
        .map((g) => ({
          gender: g.gender as Gender,
          count: g._count,
        })),
      byBranch: byBranchData.map((b) => ({
        branch: branchNameMap.get(b.branchId) || b.branchId,
        count: b._count,
      })),
    };

    await this.cacheService.set(user.tenantId, 'patients', cacheParams, result, granularity);

    return result;
  }

  async getAppointments(user: JwtPayload, query: QueryAnalyticsDto): Promise<AppointmentMetrics> {
    const range = this.getDateRange(query);
    const branchFilter = this.getBranchFilter(user, query.branchId);
    const granularity = query.granularity || Granularity.DAILY;

    const cacheParams = {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      granularity,
      branchId: query.branchId,
    };
    const cached = await this.cacheService.get<AppointmentMetrics>(user.tenantId, 'appointments', cacheParams);
    if (cached) {
      return cached;
    }

    // Total appointments
    const total = await this.prisma.appointment.count({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
      },
    });

    // By status
    const byStatusData = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
      },
      _count: true,
    });

    const statusCounts = new Map(byStatusData.map((s) => [s.status, s._count]));

    const completed = statusCounts.get(AppointmentStatus.COMPLETED) || 0;
    const cancelled = statusCounts.get(AppointmentStatus.CANCELLED) || 0;
    const noShow = statusCounts.get(AppointmentStatus.NO_SHOW) || 0;

    // Trend by date
    const appointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
      },
      select: {
        scheduledAt: true,
      },
    });

    const trendMap = new Map<string, number>();
    appointments.forEach((apt) => {
      const dateKey = this.formatDateForGranularity(apt.scheduledAt, granularity);
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
    });

    const trend: TrendDataPoint[] = Array.from(trendMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // By doctor
    const byDoctorData = await this.prisma.appointment.groupBy({
      by: ['doctorId'],
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
      },
      _count: true,
    });

    const doctorIds = byDoctorData.map((d) => d.doctorId);
    const doctors = await this.prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, name: true },
    });
    const doctorNameMap = new Map(doctors.map((d) => [d.id, d.name]));

    // Calculate average wait time (arrival to check-in)
    const appointmentsWithTimes = await this.prisma.appointment.findMany({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
        arrivalTime: { not: null },
        checkInTime: { not: null },
      },
      select: {
        arrivalTime: true,
        checkInTime: true,
      },
    });

    let totalWaitTime = 0;
    appointmentsWithTimes.forEach((apt) => {
      if (apt.arrivalTime && apt.checkInTime) {
        totalWaitTime += apt.checkInTime.getTime() - apt.arrivalTime.getTime();
      }
    });
    const averageWaitTime = appointmentsWithTimes.length > 0
      ? Math.round(totalWaitTime / appointmentsWithTimes.length / 60000) // in minutes
      : 0;

    const result: AppointmentMetrics = {
      total,
      completed,
      cancelled,
      noShow,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      trend,
      byStatus: byStatusData.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      byDoctor: byDoctorData
        .map((d) => ({
          doctor: doctorNameMap.get(d.doctorId) || d.doctorId,
          count: d._count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      averageWaitTime,
    };

    await this.cacheService.set(user.tenantId, 'appointments', cacheParams, result, granularity);

    return result;
  }

  async getServices(user: JwtPayload, query: QueryAnalyticsDto): Promise<ServicePerformance> {
    const range = this.getDateRange(query);
    const branchFilter = this.getBranchFilter(user, query.branchId);
    const granularity = query.granularity || Granularity.DAILY;

    const cacheParams = {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      granularity,
      branchId: query.branchId,
    };
    const cached = await this.cacheService.get<ServicePerformance>(user.tenantId, 'services', cacheParams);
    if (cached) {
      return cached;
    }

    // Get appointments grouped by service
    const appointmentsByService = await this.prisma.appointment.groupBy({
      by: ['serviceId'],
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
      },
      _count: true,
    });

    const serviceIds = appointmentsByService.map((a) => a.serviceId);
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, price: true },
    });
    const serviceMap = new Map(services.map((s) => [s.id, s]));

    // Get completed appointments for revenue calculation
    const completedAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
        status: AppointmentStatus.COMPLETED,
      },
      include: {
        invoices: {
          where: {
            status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL] },
          },
          select: {
            paidAmount: true,
          },
        },
      },
    });

    // Calculate revenue per service
    const revenueByService = new Map<string, number>();
    completedAppointments.forEach((apt) => {
      const revenue = apt.invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
      revenueByService.set(apt.serviceId, (revenueByService.get(apt.serviceId) || 0) + revenue);
    });

    const result: ServicePerformance = {
      services: appointmentsByService
        .map((a) => {
          const service = serviceMap.get(a.serviceId);
          return {
            id: a.serviceId,
            name: service?.name || 'Unknown',
            appointmentCount: a._count,
            revenue: revenueByService.get(a.serviceId) || 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue),
    };

    await this.cacheService.set(user.tenantId, 'services', cacheParams, result, granularity);

    return result;
  }

  async getStaff(user: JwtPayload, query: QueryAnalyticsDto): Promise<StaffProductivity> {
    const range = this.getDateRange(query);
    const branchFilter = this.getBranchFilter(user, query.branchId);
    const granularity = query.granularity || Granularity.DAILY;

    const cacheParams = {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      granularity,
      branchId: query.branchId,
    };
    const cached = await this.cacheService.get<StaffProductivity>(user.tenantId, 'staff', cacheParams);
    if (cached) {
      return cached;
    }

    // Get completed appointments by doctor
    const appointmentsByDoctor = await this.prisma.appointment.groupBy({
      by: ['doctorId'],
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
        status: AppointmentStatus.COMPLETED,
      },
      _count: true,
    });

    const doctorIds = appointmentsByDoctor.map((a) => a.doctorId);
    const doctors = await this.prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, name: true, role: true },
    });
    const doctorMap = new Map(doctors.map((d) => [d.id, d]));

    // Calculate revenue per doctor
    const completedAppointments = await this.prisma.appointment.findMany({
      where: {
        tenantId: user.tenantId,
        ...(branchFilter && { branchId: { in: branchFilter } }),
        scheduledAt: { gte: range.start, lte: range.end },
        status: AppointmentStatus.COMPLETED,
      },
      include: {
        invoices: {
          where: {
            status: { in: [InvoiceStatus.PAID, InvoiceStatus.PARTIAL] },
          },
          select: {
            paidAmount: true,
          },
        },
      },
    });

    const revenueByDoctor = new Map<string, number>();
    completedAppointments.forEach((apt) => {
      const revenue = apt.invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
      revenueByDoctor.set(apt.doctorId, (revenueByDoctor.get(apt.doctorId) || 0) + revenue);
    });

    // Calculate days in period
    const daysInPeriod = Math.ceil((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24));

    const result: StaffProductivity = {
      staff: appointmentsByDoctor
        .map((a) => {
          const doctor = doctorMap.get(a.doctorId);
          return {
            id: a.doctorId,
            name: doctor?.name || 'Unknown',
            role: doctor?.role || 'DOCTOR',
            appointmentsCompleted: a._count,
            revenue: revenueByDoctor.get(a.doctorId) || 0,
            averageAppointmentsPerDay: Math.round((a._count / daysInPeriod) * 100) / 100,
          };
        })
        .sort((a, b) => b.revenue - a.revenue),
    };

    await this.cacheService.set(user.tenantId, 'staff', cacheParams, result, granularity);

    return result;
  }

  async getLeads(user: JwtPayload, query: QueryAnalyticsDto): Promise<LeadFunnel> {
    const range = this.getDateRange(query);
    const granularity = query.granularity || Granularity.DAILY;

    const cacheParams = {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      granularity,
    };
    const cached = await this.cacheService.get<LeadFunnel>(user.tenantId, 'leads', cacheParams);
    if (cached) {
      return cached;
    }

    // Get leads by stage
    const byStageData = await this.prisma.lead.groupBy({
      by: ['stage'],
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: range.start, lte: range.end },
      },
      _count: true,
    });

    const totalLeads = byStageData.reduce((sum, s) => sum + s._count, 0);

    // Define stage order for funnel
    const stageOrder = [
      PipelineStage.INQUIRY,
      PipelineStage.QUALIFIED,
      PipelineStage.BOOKED,
      PipelineStage.ARRIVED,
      PipelineStage.FOLLOW_UP,
      PipelineStage.RE_ENGAGE,
      PipelineStage.CONVERTED,
      PipelineStage.LOST,
    ];

    const stageCountMap = new Map(byStageData.map((s) => [s.stage, s._count]));

    const stages = stageOrder.map((stage) => {
      const count = stageCountMap.get(stage) || 0;
      return {
        stage,
        count,
        conversionRate: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
      };
    });

    // By source
    const bySourceData = await this.prisma.lead.groupBy({
      by: ['source'],
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: range.start, lte: range.end },
      },
      _count: true,
    });

    // Trend by date
    const leads = await this.prisma.lead.findMany({
      where: {
        tenantId: user.tenantId,
        createdAt: { gte: range.start, lte: range.end },
      },
      select: {
        createdAt: true,
      },
    });

    const trendMap = new Map<string, number>();
    leads.forEach((lead) => {
      const dateKey = this.formatDateForGranularity(lead.createdAt, granularity);
      trendMap.set(dateKey, (trendMap.get(dateKey) || 0) + 1);
    });

    const trend: TrendDataPoint[] = Array.from(trendMap.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const result: LeadFunnel = {
      stages,
      bySource: bySourceData.map((s) => ({
        source: s.source,
        count: s._count,
      })),
      trend,
    };

    await this.cacheService.set(user.tenantId, 'leads', cacheParams, result, granularity);

    return result;
  }

  async exportReport(
    user: JwtPayload,
    reportType: string,
    query: QueryAnalyticsDto,
  ): Promise<{ data: unknown; filename: string }> {
    let data: unknown;

    switch (reportType) {
      case 'dashboard':
        data = await this.getDashboard(user, query);
        break;
      case 'revenue':
        data = await this.getRevenue(user, query);
        break;
      case 'patients':
        data = await this.getPatients(user, query);
        break;
      case 'appointments':
        data = await this.getAppointments(user, query);
        break;
      case 'services':
        data = await this.getServices(user, query);
        break;
      case 'staff':
        data = await this.getStaff(user, query);
        break;
      case 'leads':
        data = await this.getLeads(user, query);
        break;
      default:
        data = await this.getDashboard(user, query);
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${reportType}-report-${dateStr}`;

    return { data, filename };
  }
}
