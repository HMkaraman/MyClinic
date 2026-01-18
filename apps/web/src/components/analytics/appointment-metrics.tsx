'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { AppointmentMetrics as AppointmentMetricsType } from '@/lib/analytics-api';

interface AppointmentMetricsProps {
  data: AppointmentMetricsType | null;
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: '#0088FE',
  CONFIRMED: '#00C49F',
  ARRIVED: '#FFBB28',
  IN_PROGRESS: '#FF8042',
  COMPLETED: '#4CAF50',
  NO_SHOW: '#f44336',
  CANCELLED: '#9e9e9e',
  RESCHEDULED: '#9c27b0',
};

export function AppointmentMetrics({ data, isLoading }: AppointmentMetricsProps) {
  const t = useTranslations('analytics');
  const locale = useLocale();
  const isRtl = locale === 'ar' || locale === 'ckb';

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{t('appointments.trend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Summary Cards */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{t('appointments.summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{data.total}</div>
              <div className="text-sm text-muted-foreground">{t('appointments.total')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{data.completed}</div>
              <div className="text-sm text-muted-foreground">{t('appointments.completed')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-600">{data.cancelled}</div>
              <div className="text-sm text-muted-foreground">{t('appointments.cancelled')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{data.noShow}</div>
              <div className="text-sm text-muted-foreground">{t('appointments.noShow')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{data.averageWaitTime} min</div>
              <div className="text-sm text-muted-foreground">{t('appointments.avgWaitTime')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment Trend */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{t('appointments.trend')}</CardTitle>
          <CardDescription>
            {t('appointments.completionRate')}: {data.completionRate}%
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.trend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" reversed={isRtl} tick={{ fontSize: 12 }} />
                <YAxis orientation={isRtl ? 'right' : 'left'} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [value, t('appointments.count')]}
                  labelFormatter={(label) => `${t('date')}: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0088FE"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Status */}
      <Card>
        <CardHeader>
          <CardTitle>{t('appointments.byStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {data.byStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.status] || '#8884D8'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Doctor */}
      <Card>
        <CardHeader>
          <CardTitle>{t('appointments.byDoctor')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byDoctor}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="doctor"
                  width={70}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
