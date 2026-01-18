'use client';

import { useTranslations } from 'next-intl';
import { DollarSign, Users, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardSummary } from '@/lib/analytics-api';

interface AnalyticsKpiCardsProps {
  data: DashboardSummary | null;
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function ChangeIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center text-green-600 dark:text-green-400">
        <TrendingUp className="h-4 w-4 me-1" />
        {formatPercent(value)}
      </span>
    );
  }
  if (value < 0) {
    return (
      <span className="flex items-center text-red-600 dark:text-red-400">
        <TrendingDown className="h-4 w-4 me-1" />
        {formatPercent(value)}
      </span>
    );
  }
  return (
    <span className="flex items-center text-muted-foreground">
      <Minus className="h-4 w-4 me-1" />
      0%
    </span>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  icon: React.ElementType;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-16 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {subtitle && <span>{subtitle}</span>}
              {change !== undefined && <ChangeIndicator value={change} />}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsKpiCards({ data, isLoading }: AnalyticsKpiCardsProps) {
  const t = useTranslations('analytics');

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={t('kpi.revenue')}
        value={data ? formatCurrency(data.revenue.total) : '-'}
        change={data?.revenue.percentChange}
        icon={DollarSign}
        isLoading={isLoading}
      />
      <KpiCard
        title={t('kpi.patients')}
        value={data?.patients.total ?? '-'}
        subtitle={data ? `${data.patients.new} ${t('kpi.new')}` : undefined}
        change={data?.patients.percentChange}
        icon={Users}
        isLoading={isLoading}
      />
      <KpiCard
        title={t('kpi.appointments')}
        value={data?.appointments.total ?? '-'}
        subtitle={data ? `${data.appointments.completionRate}% ${t('kpi.completionRate')}` : undefined}
        change={data?.appointments.percentChange}
        icon={Calendar}
        isLoading={isLoading}
      />
      <KpiCard
        title={t('kpi.leads')}
        value={data?.leads.total ?? '-'}
        subtitle={data ? `${data.leads.conversionRate}% ${t('kpi.conversionRate')}` : undefined}
        icon={TrendingUp}
        isLoading={isLoading}
      />
    </div>
  );
}
