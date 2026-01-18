'use client';

import { useTranslations } from 'next-intl';
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
import { Badge } from '@/components/ui/badge';
import type { StaffProductivity as StaffProductivityType } from '@/lib/analytics-api';

interface StaffProductivityProps {
  data: StaffProductivityType | null;
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

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MANAGER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  DOCTOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  NURSE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  RECEPTION: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ACCOUNTANT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  SUPPORT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
};

export function StaffProductivity({ data, isLoading }: StaffProductivityProps) {
  const t = useTranslations('analytics');

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('staff.productivity')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || data.staff.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('staff.productivity')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            {t('noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.staff.slice(0, 10).map((member) => ({
    name: member.name,
    appointments: member.appointmentsCompleted,
    revenue: member.revenue,
  }));

  return (
    <div className="grid gap-4">
      {/* Revenue by Staff Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('staff.revenueByStaff')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatCurrency(value)}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Bar dataKey="revenue" fill="#00C49F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('staff.details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('staff.name')}</TableHead>
                <TableHead>{t('staff.role')}</TableHead>
                <TableHead className="text-center">{t('staff.appointments')}</TableHead>
                <TableHead className="text-center">{t('staff.avgPerDay')}</TableHead>
                <TableHead className="text-end">{t('staff.revenue')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-800'}
                    >
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{member.appointmentsCompleted}</TableCell>
                  <TableCell className="text-center">{member.averageAppointmentsPerDay}</TableCell>
                  <TableCell className="text-end">{formatCurrency(member.revenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
