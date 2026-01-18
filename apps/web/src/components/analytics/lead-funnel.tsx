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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { LeadFunnel as LeadFunnelType } from '@/lib/analytics-api';

interface LeadFunnelProps {
  data: LeadFunnelType | null;
  isLoading: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  INQUIRY: '#0088FE',
  QUALIFIED: '#00C49F',
  BOOKED: '#FFBB28',
  ARRIVED: '#FF8042',
  FOLLOW_UP: '#8884D8',
  RE_ENGAGE: '#82ca9d',
  CONVERTED: '#4CAF50',
  LOST: '#f44336',
};

const SOURCE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function LeadFunnel({ data, isLoading }: LeadFunnelProps) {
  const t = useTranslations('analytics');
  const locale = useLocale();
  const isRtl = locale === 'ar' || locale === 'ckb';

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{t('leads.funnel')}</CardTitle>
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
      {/* Funnel Visualization */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{t('leads.funnel')}</CardTitle>
          <CardDescription>{t('leads.stageBreakdown')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.stages.filter((s) => s.count > 0)}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, _name, props) => [
                    `${value} (${(props?.payload as { conversionRate?: number })?.conversionRate ?? 0}%)`,
                    t('leads.count'),
                  ]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.stages
                    .filter((s) => s.count > 0)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STAGE_COLORS[entry.stage] || '#8884D8'}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Lead Trend */}
      <Card>
        <CardHeader>
          <CardTitle>{t('leads.trend')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.trend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" reversed={isRtl} tick={{ fontSize: 12 }} />
                <YAxis orientation={isRtl ? 'right' : 'left'} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [value, t('leads.count')]}
                  labelFormatter={(label) => `${t('date')}: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884D8"
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
          <CardTitle>{t('leads.bySource')}</CardTitle>
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
                    <Cell
                      key={`cell-${index}`}
                      fill={SOURCE_COLORS[index % SOURCE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Stage Summary Table */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{t('leads.stageSummary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {data.stages.map((stage) => (
              <div
                key={stage.stage}
                className="text-center p-3 rounded-lg border"
                style={{ borderColor: STAGE_COLORS[stage.stage] || '#8884D8' }}
              >
                <div className="text-2xl font-bold">{stage.count}</div>
                <div className="text-xs text-muted-foreground truncate" title={stage.stage}>
                  {stage.stage}
                </div>
                <div
                  className="text-xs font-medium"
                  style={{ color: STAGE_COLORS[stage.stage] || '#8884D8' }}
                >
                  {stage.conversionRate}%
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
