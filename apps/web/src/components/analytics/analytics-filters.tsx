'use client';

import { useTranslations } from 'next-intl';
import { Calendar, ChevronDown } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Granularity } from '@/lib/analytics-api';

interface AnalyticsFiltersProps {
  dateFrom: string;
  dateTo: string;
  granularity: Granularity;
  onDateChange: (from: string, to: string) => void;
  onGranularityChange: (granularity: Granularity) => void;
}

const DATE_PRESETS = [
  { key: 'last7days', label: 'Last 7 days', getRange: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { key: 'last30days', label: 'Last 30 days', getRange: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { key: 'last90days', label: 'Last 90 days', getRange: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
  { key: 'thisMonth', label: 'This month', getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { key: 'thisYear', label: 'This year', getRange: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
];

export function AnalyticsFilters({
  dateFrom,
  dateTo,
  granularity,
  onDateChange,
  onGranularityChange,
}: AnalyticsFiltersProps) {
  const t = useTranslations('analytics');

  const handlePresetClick = (preset: typeof DATE_PRESETS[0]) => {
    const range = preset.getRange();
    onDateChange(format(range.from, 'yyyy-MM-dd'), format(range.to, 'yyyy-MM-dd'));
  };

  const formatDateRange = () => {
    if (!dateFrom || !dateTo) return t('selectDateRange');
    return `${format(new Date(dateFrom), 'MMM d, yyyy')} - ${format(new Date(dateTo), 'MMM d, yyyy')}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="min-w-[220px] justify-start">
            <Calendar className="me-2 h-4 w-4" />
            {formatDateRange()}
            <ChevronDown className="ms-auto h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px]">
          {DATE_PRESETS.map((preset) => (
            <DropdownMenuItem key={preset.key} onClick={() => handlePresetClick(preset)}>
              {t(`datePresets.${preset.key}`)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Select value={granularity} onValueChange={(value) => onGranularityChange(value as Granularity)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder={t('granularity')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="daily">{t('granularityOptions.daily')}</SelectItem>
          <SelectItem value="weekly">{t('granularityOptions.weekly')}</SelectItem>
          <SelectItem value="monthly">{t('granularityOptions.monthly')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
