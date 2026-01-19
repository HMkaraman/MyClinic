'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  CalendarOff,
  FileText,
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  useWorkSchedules,
  useTimeOffRequests,
} from '@/hooks/use-scheduling';

interface Staff {
  id: string;
  name: string;
  role: string;
}

const getWeekDays = (weekStart: Date) => {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    days.push(date);
  }
  return days;
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
};

const formatDateForApi = (date: Date): string => {
  return date.toISOString().split('T')[0] ?? '';
};

export default function SchedulingPage() {
  const t = useTranslations();
  const [currentWeek, setCurrentWeek] = React.useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });
  const [selectedStaff, setSelectedStaff] = React.useState<string>('all');

  const weekDays = getWeekDays(currentWeek);
  const weekEnd = new Date(currentWeek);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const { data: schedulesData, isLoading: isLoadingSchedules, isError } = useWorkSchedules({
    startDate: formatDateForApi(currentWeek),
    endDate: formatDateForApi(weekEnd),
    ...(selectedStaff !== 'all' && { userId: selectedStaff }),
  });

  const { data: timeOffData } = useTimeOffRequests({
    status: 'PENDING',
  });

  const schedules = schedulesData?.data ?? [];
  const pendingRequests = timeOffData?.meta?.total ?? 0;

  // Extract unique staff from schedules
  const uniqueStaff = React.useMemo(() => {
    const staffMap = new Map<string, Staff>();
    schedules.forEach(s => {
      if (s.user && !staffMap.has(s.userId)) {
        staffMap.set(s.userId, {
          id: s.userId,
          name: s.user.name,
          role: s.user.role,
        });
      }
    });
    return Array.from(staffMap.values());
  }, [schedules]);

  const goToPreviousWeek = () => {
    const prev = new Date(currentWeek);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeek(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(currentWeek);
    next.setDate(next.getDate() + 7);
    setCurrentWeek(next);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    setCurrentWeek(new Date(today.setDate(diff)));
  };

  const stats = React.useMemo(() => {
    const today = formatDateForApi(new Date());
    const todaySchedules = schedules.filter(s => s.date === today);
    return {
      totalStaff: uniqueStaff.length,
      workingToday: todaySchedules.filter(s => s.isWorkingDay).length,
      onLeave: todaySchedules.filter(s => !s.isWorkingDay && s.notes?.includes('leave')).length,
      pendingRequests,
    };
  }, [schedules, uniqueStaff, pendingRequests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('scheduling.title') || 'Staff Scheduling'}
          </h1>
          <p className="text-muted-foreground">
            {t('scheduling.description') || 'Manage staff schedules and time-off requests'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/scheduling/templates">
              <FileText className="me-2 h-4 w-4" />
              {t('scheduling.templates') || 'Templates'}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/scheduling/time-off">
              <CalendarOff className="me-2 h-4 w-4" />
              {t('scheduling.timeOff') || 'Time Off'}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/scheduling/new">
              <Plus className="me-2 h-4 w-4" />
              {t('scheduling.newSchedule') || 'New Schedule'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('scheduling.staff') || 'Total Staff'}</p>
                {isLoadingSchedules ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.totalStaff}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('scheduling.workingToday') || 'Working Today'}</p>
                {isLoadingSchedules ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.workingToday}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-warning/10 p-3">
                <CalendarOff className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('scheduling.onLeave') || 'On Leave'}</p>
                {isLoadingSchedules ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.onLeave}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-info/10 p-3">
                <FileText className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('scheduling.pendingRequests') || 'Pending Requests'}</p>
                {isLoadingSchedules ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToCurrentWeek}>
                {t('common.today') || 'Today'}
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="ms-4 font-medium">
                {weekDays[0]?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('scheduling.selectStaff') || 'Select Staff'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all') || 'All Staff'}</SelectItem>
                {uniqueStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
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
              <span>{t('common.errorLoading') || 'Error loading data'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('scheduling.weekView') || 'Week View'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSchedules ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-16 w-32" />
                  {[...Array(7)].map((_, j) => (
                    <Skeleton key={j} className="h-16 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          ) : uniqueStaff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('scheduling.noSchedules') || 'No schedules found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 bg-muted text-start min-w-[150px]">
                      {t('scheduling.staff') || 'Staff'}
                    </th>
                    {weekDays.map((day) => {
                      const isToday = day.toDateString() === new Date().toDateString();
                      const isWeekend = day.getDay() === 5 || day.getDay() === 6;
                      return (
                        <th
                          key={day.toISOString()}
                          className={`border p-2 text-center min-w-[100px] ${
                            isToday ? 'bg-primary/10' : isWeekend ? 'bg-muted/50' : 'bg-muted'
                          }`}
                        >
                          <div className="font-medium">{formatDate(day)}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {uniqueStaff.map((staff) => (
                    <tr key={staff.id}>
                      <td className="border p-2">
                        <Link
                          href={`/scheduling/staff/${staff.id}`}
                          className="hover:underline"
                        >
                          <div className="font-medium">{staff.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {t(`roles.${staff.role.toLowerCase()}`) || staff.role}
                          </div>
                        </Link>
                      </td>
                      {weekDays.map((day) => {
                        const dateStr = formatDateForApi(day);
                        const schedule = schedules.find(
                          s => s.userId === staff.id && s.date === dateStr
                        );
                        const isToday = day.toDateString() === new Date().toDateString();
                        const isWeekend = day.getDay() === 5 || day.getDay() === 6;

                        return (
                          <td
                            key={day.toISOString()}
                            className={`border p-2 text-center ${isToday ? 'bg-primary/5' : ''}`}
                          >
                            {schedule?.isWorkingDay ? (
                              <div className="space-y-1">
                                <Badge variant="success" className="text-xs">
                                  {schedule.startTime} - {schedule.endTime}
                                </Badge>
                              </div>
                            ) : schedule && schedule.notes?.toLowerCase().includes('leave') ? (
                              <Badge variant="warning" className="text-xs">
                                {t('scheduling.leave') || 'Leave'}
                              </Badge>
                            ) : isWeekend ? (
                              <span className="text-xs text-muted-foreground">
                                {t('scheduling.dayOff') || 'Off'}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
