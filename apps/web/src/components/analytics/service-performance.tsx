'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ServicePerformance as ServicePerformanceType } from '@/lib/analytics-api';

interface ServicePerformanceProps {
  data: ServicePerformanceType | null;
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

export function ServicePerformance({ data, isLoading }: ServicePerformanceProps) {
  const t = useTranslations('analytics');
  const locale = useLocale();
  const isRtl = locale === 'ar' || locale === 'ckb';

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('services.performance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('services.performance')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {t('noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.services.slice(0, 10).map((service) => ({
    name: service.name,
    appointments: service.appointmentCount,
    revenue: service.revenue,
  }));

  return (
    <div className="grid gap-4">
      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('services.revenueByService')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11 }}
                  height={60}
                />
                <YAxis
                  orientation={isRtl ? 'right' : 'left'}
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="revenue" fill="#0088FE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('services.details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('services.name')}</TableHead>
                <TableHead className="text-center">{t('services.appointments')}</TableHead>
                <TableHead className="text-end">{t('services.revenue')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-center">{service.appointmentCount}</TableCell>
                  <TableCell className="text-end">{formatCurrency(service.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
