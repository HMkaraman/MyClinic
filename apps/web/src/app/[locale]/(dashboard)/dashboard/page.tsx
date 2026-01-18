'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
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

interface AppointmentItem {
  id: string;
  patientName: string;
  time: string;
  service: string;
  status: 'confirmed' | 'arrived' | 'pending';
}

const mockAppointments: AppointmentItem[] = [
  { id: '1', patientName: 'أحمد محمد', time: '09:00', service: 'فحص عام', status: 'confirmed' },
  { id: '2', patientName: 'فاطمة علي', time: '09:30', service: 'تنظيف أسنان', status: 'arrived' },
  { id: '3', patientName: 'محمود حسن', time: '10:00', service: 'استشارة', status: 'pending' },
  { id: '4', patientName: 'نور الدين', time: '10:30', service: 'متابعة', status: 'confirmed' },
  { id: '5', patientName: 'سارة أحمد', time: '11:00', service: 'فحص عام', status: 'pending' },
];

const statusColors = {
  confirmed: 'success',
  arrived: 'info',
  pending: 'warning',
} as const;

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useAuthStore();

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
          value="24"
          description={t('dashboard.fromYesterday')}
          icon={Calendar}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title={t('dashboard.totalPatients')}
          value="1,234"
          description={t('dashboard.thisMonth')}
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title={t('dashboard.todayRevenue')}
          value="$2,450"
          description={t('dashboard.fromYesterday')}
          icon={Receipt}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          title={t('dashboard.conversionRate')}
          value="68%"
          description={t('dashboard.thisWeek')}
          icon={TrendingUp}
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
            <div className="space-y-4">
              {mockAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{apt.patientName}</p>
                      <p className="text-sm text-muted-foreground">{apt.service}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={statusColors[apt.status]}>
                      {t(`appointments.status.${apt.status}`)}
                    </Badge>
                    <span className="text-sm font-medium">{apt.time}</span>
                  </div>
                </div>
              ))}
            </div>
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
                    <p className="text-sm text-muted-foreground">3 {t('dashboard.invoicesPending')}</p>
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
                  <p className="text-3xl font-bold text-green-600">18</p>
                  <p className="text-sm text-muted-foreground">{t('dashboard.completed')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-600">4</p>
                  <p className="text-sm text-muted-foreground">{t('dashboard.waiting')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-600">2</p>
                  <p className="text-sm text-muted-foreground">{t('dashboard.noShow')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">6</p>
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
