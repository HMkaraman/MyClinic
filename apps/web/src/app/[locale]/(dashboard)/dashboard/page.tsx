'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/stores/auth-store';
import {
  Users,
  Calendar,
  Receipt,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAppointments, useAppointmentTodayStats } from '@/hooks/use-appointments';
import { usePatients } from '@/hooks/use-patients';
import { useFinanceStats } from '@/hooks/use-invoices';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  isLoading?: boolean;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon: Icon, isLoading, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend && (
            <span className={trend.isPositive ? 'text-green-600' : 'text-red-600'}>
              {trend.isPositive ? (
                <ArrowUpRight className="inline h-3 w-3" />
              ) : (
                <ArrowDownRight className="inline h-3 w-3" />
              )}
              {trend.value}%
            </span>
          )}
          {description}
        </div>
      </CardContent>
    </Card>
  );
}

const statusColors = {
  CONFIRMED: 'success',
  ARRIVED: 'info',
  NEW: 'warning',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  NO_SHOW: 'destructive',
  CANCELLED: 'destructive',
} as const;

function getDateString(): string {
  return new Date().toISOString().split('T')[0] as string;
}

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuthStore();

  // Fetch today's appointments
  const { data: todayStats, isLoading: isLoadingTodayStats } = useAppointmentTodayStats();

  // Fetch today's appointments list
  const { data: appointmentsData, isLoading: isLoadingAppointments } = useAppointments({
    date: getDateString(),
    limit: 5,
  });

  // Fetch patients count
  const { data: patientsData, isLoading: isLoadingPatients } = usePatients({ limit: 1 });

  // Fetch finance stats
  const { data: financeStats, isLoading: isLoadingFinance } = useFinanceStats();

  const appointments = appointmentsData?.data ?? [];
  const totalPatients = patientsData?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('common.welcome')}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-muted-foreground">
            {t('dashboard.overview')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus className="me-2 h-4 w-4" />
            {t('appointments.new')}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('dashboard.todayAppointments')}
          value={todayStats?.total ?? 0}
          description={t('dashboard.fromYesterday')}
          icon={Calendar}
          isLoading={isLoadingTodayStats}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title={t('dashboard.totalPatients')}
          value={totalPatients.toLocaleString()}
          description={t('dashboard.thisMonth')}
          icon={Users}
          isLoading={isLoadingPatients}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title={t('dashboard.todayRevenue')}
          value={`${(financeStats?.todayRevenue ?? 0).toLocaleString()} IQD`}
          description={t('dashboard.fromYesterday')}
          icon={Receipt}
          isLoading={isLoadingFinance}
          trend={{ value: financeStats?.revenueChange ?? 0, isPositive: (financeStats?.revenueChange ?? 0) >= 0 }}
        />
        <StatCard
          title={t('dashboard.conversionRate')}
          value={todayStats?.total ? `${Math.round((todayStats.completed / todayStats.total) * 100)}%` : '0%'}
          description={t('dashboard.thisWeek')}
          icon={TrendingUp}
          isLoading={isLoadingTodayStats}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('dashboard.todaySchedule')}</CardTitle>
                <CardDescription>{t('dashboard.upcomingAppointments')}</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                {t('common.viewAll')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingAppointments ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('dashboard.noAppointmentsToday') || 'No appointments today'}
              </div>
            ) : (
              <div className="space-y-4">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium">{apt.patient?.name}</p>
                        <p className="text-sm text-muted-foreground">{apt.service?.name || t('appointments.consultation')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={statusColors[apt.status] || 'secondary'}>
                        {t(`appointments.status.${apt.status.toLowerCase()}`)}
                      </Badge>
                      <span className="text-sm font-medium">{apt.startTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Alerts */}
        <div className="space-y-4">
          {/* Pending Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                {t('dashboard.pendingTasks')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-3">
                  <div>
                    <p className="font-medium">{t('dashboard.followUpReminder')}</p>
                    <p className="text-sm text-muted-foreground">5 {t('dashboard.patientsNeedFollowUp')}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    {t('common.view')}
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
                  <div>
                    <p className="font-medium">{t('dashboard.unpaidInvoices')}</p>
                    <p className="text-sm text-muted-foreground">
                      {financeStats?.pendingPayments ? `${financeStats.pendingPayments.toLocaleString()} IQD` : '0 IQD'} {t('dashboard.invoicesPending')}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    {t('common.view')}
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3">
                  <div>
                    <p className="font-medium">{t('dashboard.newLeads')}</p>
                    <p className="text-sm text-muted-foreground">8 {t('dashboard.leadsToContact')}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    {t('common.view')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.quickStats')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  {isLoadingTodayStats ? (
                    <Skeleton className="h-9 w-12 mx-auto mb-2" />
                  ) : (
                    <p className="text-3xl font-bold text-green-600">{todayStats?.completed ?? 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{t('dashboard.completed')}</p>
                </div>
                <div className="text-center">
                  {isLoadingTodayStats ? (
                    <Skeleton className="h-9 w-12 mx-auto mb-2" />
                  ) : (
                    <p className="text-3xl font-bold text-yellow-600">{todayStats?.waiting ?? 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{t('dashboard.waiting')}</p>
                </div>
                <div className="text-center">
                  {isLoadingTodayStats ? (
                    <Skeleton className="h-9 w-12 mx-auto mb-2" />
                  ) : (
                    <p className="text-3xl font-bold text-red-600">{todayStats?.noShow ?? 0}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{t('dashboard.noShow')}</p>
                </div>
                <div className="text-center">
                  {isLoadingTodayStats ? (
                    <Skeleton className="h-9 w-12 mx-auto mb-2" />
                  ) : (
                    <p className="text-3xl font-bold text-blue-600">
                      {(todayStats?.total ?? 0) - (todayStats?.completed ?? 0) - (todayStats?.noShow ?? 0) - (todayStats?.cancelled ?? 0)}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">{t('dashboard.upcoming')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
