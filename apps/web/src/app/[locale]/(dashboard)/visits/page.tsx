'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  FileText,
  Stethoscope,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useVisits, useVisitTodayStats, type VisitStatus } from '@/hooks/use-visits';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

function getDateString(offset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0] as string;
}

export default function VisitsPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const { data: todayStats, isLoading: isLoadingStats } = useVisitTodayStats();

  const getDateParams = () => {
    switch (dateFilter) {
      case 'today':
        return { date: getDateString() };
      case 'yesterday':
        return { date: getDateString(-1) };
      default:
        return {};
    }
  };

  const { data, isLoading, isError, error } = useVisits({
    ...getDateParams(),
    status: statusFilter !== 'all' ? (statusFilter.toUpperCase() as VisitStatus) : undefined,
  });

  const visits = data?.data ?? [];
  const totalVisits = data?.meta?.total ?? 0;

  // Filter by search on client side
  const filteredVisits = visits.filter((visit) => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return (
      visit.patient?.name?.toLowerCase().includes(search) ||
      visit.patient?.fileNumber?.toLowerCase().includes(search) ||
      visit.doctor?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('visits.title')}
          </h1>
          <p className="text-muted-foreground">
            {isLoadingStats ? (
              <Skeleton className="h-4 w-48 inline-block" />
            ) : (
              <>
                {t('visits.todayVisits')}: {todayStats?.total ?? 0} • {t('visits.inProgress')}: {todayStats?.inProgress ?? 0}
              </>
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/visits/new">
            <Plus className="me-2 h-4 w-4" />
            {t('visits.newVisit')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Stethoscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{todayStats?.total ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('visits.todayVisits')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{todayStats?.inProgress ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('visits.inProgress')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{totalVisits}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('visits.totalVisits')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('visits.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-10"
              />
            </div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.date')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inbox.all')}</SelectItem>
                <SelectItem value="today">{t('appointments.today')}</SelectItem>
                <SelectItem value="yesterday">{t('appointments.yesterday')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inbox.all')}</SelectItem>
                <SelectItem value="in_progress">{t('visits.inProgress')}</SelectItem>
                <SelectItem value="completed">{t('appointments.status.completed')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>
                {(error as any)?.message || t('common.errorLoading') || 'Error loading data'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('visits.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-20" />
                  <Skeleton className="h-12 w-10" />
                </div>
              ))}
            </div>
          ) : filteredVisits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('visits.noVisits') || 'No visits found'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('common.date')}</TableHead>
                  <TableHead>{t('patients.patientName')}</TableHead>
                  <TableHead>{t('appointments.selectDoctor')}</TableHead>
                  <TableHead>{t('visits.chiefComplaint')}</TableHead>
                  <TableHead>{t('visits.diagnosis')}</TableHead>
                  <TableHead>{t('common.status')}</TableHead>
                  <TableHead className="w-[70px]">{t('common.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.map((visit) => (
                  <TableRow key={visit.id}>
                    <TableCell>{visit.date}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{visit.patient?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {visit.patient?.fileNumber}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{visit.doctor?.name}</TableCell>
                    <TableCell>{visit.chiefComplaint || '-'}</TableCell>
                    <TableCell>{visit.diagnosis || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={visit.status === 'COMPLETED' ? 'success' : 'warning'}
                      >
                        {visit.status === 'COMPLETED'
                          ? t('appointments.status.completed')
                          : t('visits.inProgress')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/visits/${visit.id}`}>
                              <Eye className="me-2 h-4 w-4" />
                              {t('common.view') || 'View'}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/visits/${visit.id}/edit`}>
                              <Edit className="me-2 h-4 w-4" />
                              {t('common.edit')}
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/visits/${visit.id}/prescription`}>
                              <FileText className="me-2 h-4 w-4" />
                              {t('visits.prescription')}
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
