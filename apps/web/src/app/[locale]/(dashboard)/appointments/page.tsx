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
  DropdownMenuSeparator,
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
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  CalendarDays,
  List,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  useAppointments,
  useAppointmentTodayStats,
  type AppointmentStatus,
} from '@/hooks/use-appointments';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const statusConfig = {
  NEW: { variant: 'secondary' as const, label: 'status.new' },
  CONFIRMED: { variant: 'success' as const, label: 'status.confirmed' },
  ARRIVED: { variant: 'info' as const, label: 'status.arrived' },
  IN_PROGRESS: { variant: 'warning' as const, label: 'status.inProgress' },
  COMPLETED: { variant: 'success' as const, label: 'status.completed' },
  NO_SHOW: { variant: 'destructive' as const, label: 'status.noShow' },
  CANCELLED: { variant: 'destructive' as const, label: 'status.cancelled' },
};

const defaultConfig = { variant: 'secondary' as const, label: 'status.new' };

function getDateString(offset: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0] as string;
}

export default function AppointmentsPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [dateFilter, setDateFilter] = React.useState<string>('today');
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = React.useState(getDateString());

  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const { data: todayStats, isLoading: isLoadingStats } = useAppointmentTodayStats();

  const getDateParams = () => {
    switch (dateFilter) {
      case 'today':
        return { date: getDateString() };
      case 'yesterday':
        return { date: getDateString(-1) };
      case 'week':
        return {
          dateFrom: getDateString(-7),
          dateTo: getDateString(),
        };
      default:
        return {};
    }
  };

  const { data, isLoading, isError, error } = useAppointments({
    ...getDateParams(),
    status: statusFilter !== 'all' ? (statusFilter.toUpperCase() as AppointmentStatus) : undefined,
  });

  const appointments = data?.data ?? [];

  // Filter by search on client side
  const filteredAppointments = appointments.filter((apt) => {
    if (!debouncedSearch) return true;
    const search = debouncedSearch.toLowerCase();
    return (
      apt.patient?.name?.toLowerCase().includes(search) ||
      apt.patient?.phone?.includes(search)
    );
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-IQ', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const goToPreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0] as string);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0] as string);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('appointments.title')}
          </h1>
          <p className="text-muted-foreground">
            {isLoadingStats ? (
              <Skeleton className="h-4 w-32 inline-block" />
            ) : (
              `${t('appointments.todayAppointments')}: ${todayStats?.total ?? 0}`
            )}
          </p>
        </div>
        <Button asChild>
          <Link href="/appointments/new">
            <Plus className="me-2 h-4 w-4" />
            {t('appointments.newAppointment')}
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{todayStats?.total ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('dashboard.todayAppointments')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{todayStats?.completed ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('dashboard.completed')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{todayStats?.waiting ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('dashboard.waiting')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                {isLoadingStats ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{todayStats?.confirmed ?? 0}</p>
                )}
                <p className="text-sm text-muted-foreground">{t('appointments.status.confirmed')}</p>
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
                placeholder={t('patients.searchPlaceholder')}
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
                <SelectItem value="today">{t('appointments.today')}</SelectItem>
                <SelectItem value="yesterday">{t('appointments.yesterday')}</SelectItem>
                <SelectItem value="week">{t('appointments.thisWeek')}</SelectItem>
                <SelectItem value="all">{t('inbox.all')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('inbox.all')}</SelectItem>
                <SelectItem value="new">{t('appointments.status.new')}</SelectItem>
                <SelectItem value="confirmed">{t('appointments.status.confirmed')}</SelectItem>
                <SelectItem value="arrived">{t('appointments.status.arrived')}</SelectItem>
                <SelectItem value="completed">{t('appointments.status.completed')}</SelectItem>
                <SelectItem value="no_show">{t('appointments.status.noShow')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <CalendarDays className="h-4 w-4" />
              </Button>
            </div>
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

      {/* Appointments List */}
      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('appointments.title')}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToNextDay}>
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <span className="text-sm">{formatDate(selectedDate)}</span>
                <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-16" />
                    <Skeleton className="h-12 flex-1" />
                    <Skeleton className="h-12 w-24" />
                    <Skeleton className="h-12 w-24" />
                    <Skeleton className="h-12 w-16" />
                    <Skeleton className="h-12 w-20" />
                    <Skeleton className="h-12 w-10" />
                  </div>
                ))}
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {t('appointments.noAppointments') || 'No appointments found'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.time')}</TableHead>
                    <TableHead>{t('patients.patientName')}</TableHead>
                    <TableHead>{t('appointments.selectDoctor')}</TableHead>
                    <TableHead>{t('appointments.selectService')}</TableHead>
                    <TableHead>{t('appointments.duration')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead className="w-[70px]">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => {
                    const config = statusConfig[apt.status as keyof typeof statusConfig] ?? defaultConfig;
                    return (
                      <TableRow key={apt.id}>
                        <TableCell className="font-medium">{apt.startTime}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{apt.patient?.name}</p>
                            <p className="text-sm text-muted-foreground" dir="ltr">
                              {apt.patient?.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{apt.doctor?.name}</TableCell>
                        <TableCell>{apt.service?.name || '-'}</TableCell>
                        <TableCell>
                          {apt.duration} {t('appointments.minutes')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.variant}>
                            {t(`appointments.${config.label}`)}
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
                                <Link href={`/appointments/${apt.id}`}>
                                  <Eye className="me-2 h-4 w-4" />
                                  {t('common.view') || 'View'}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/appointments/${apt.id}/edit`}>
                                  <Edit className="me-2 h-4 w-4" />
                                  {t('common.edit')}
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {apt.status === 'CONFIRMED' && (
                                <DropdownMenuItem>
                                  <CheckCircle className="me-2 h-4 w-4" />
                                  {t('appointments.confirmArrival')}
                                </DropdownMenuItem>
                              )}
                              {apt.status === 'ARRIVED' && (
                                <DropdownMenuItem>
                                  <Clock className="me-2 h-4 w-4" />
                                  {t('appointments.startVisit')}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem>
                                <Calendar className="me-2 h-4 w-4" />
                                {t('appointments.reschedule')}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="me-2 h-4 w-4" />
                                {t('appointments.cancelAppointment')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t('common.comingSoon') || 'Coming Soon'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[400px] items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CalendarDays className="mx-auto h-12 w-12 mb-4" />
                <p>{t('common.calendarViewComingSoon') || 'Calendar view coming soon'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
