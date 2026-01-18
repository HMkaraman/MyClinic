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
import type { PatientStats } from '@/lib/analytics-api';

interface PatientDemographicsProps {
  data: PatientStats | null;
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export function PatientDemographics({ data, isLoading }: PatientDemographicsProps) {
  const t = useTranslations('analytics');
  const locale = useLocale();
  const isRtl = locale === 'ar' || locale === 'ckb';

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{t('patients.trend')}</CardTitle>
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
          <CardTitle>{t('patients.summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{data.total}</div>
              <div className="text-sm text-muted-foreground">{t('patients.total')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{data.new}</div>
              <div className="text-sm text-muted-foreground">{t('patients.new')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{data.returning}</div>
              <div className="text-sm text-muted-foreground">{t('patients.returning')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patient Trend */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{t('patients.trend')}</CardTitle>
          <CardDescription>{t('patients.newPatientsOverTime')}</CardDescription>
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
                  formatter={(value) => [value, t('patients.count')]}
                  labelFormatter={(label) => `${t('date')}: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#00C49F"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Source */}
      <Card>
        <CardHeader>
          <CardTitle>{t('patients.bySource')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.bySource}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {data.bySource.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Gender */}
      <Card>
        <CardHeader>
          <CardTitle>{t('patients.byGender')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.byGender}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gender" tick={{ fontSize: 12 }} />
                <YAxis orientation={isRtl ? 'right' : 'left'} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884D8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* By Branch */}
      {data.byBranch.length > 0 && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{t('patients.byBranch')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.byBranch}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="branch" tick={{ fontSize: 12 }} />
                  <YAxis orientation={isRtl ? 'right' : 'left'} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
