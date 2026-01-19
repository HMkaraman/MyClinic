'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  role: string;
}

interface ScheduleEntry {
  id: string;
  staffId: string;
  staff: Staff;
  date: string;
  startTime?: string;
  endTime?: string;
  isWorkingDay: boolean;
  isOnLeave?: boolean;
  leaveType?: string;
}

// Mock data
const mockStaff: Staff[] = [
  { id: '1', name: 'Dr. Ahmed Hassan', role: 'DOCTOR' },
  { id: '2', name: 'Dr. Sara Mohamed', role: 'DOCTOR' },
  { id: '3', name: 'Nurse Fatima', role: 'NURSE' },
  { id: '4', name: 'Receptionist Ali', role: 'RECEPTION' },
];

const generateMockSchedules = (weekStart: Date): ScheduleEntry[] => {
  const schedules: ScheduleEntry[] = [];
  const days = 7;

  mockStaff.forEach((staff) => {
    for (let i = 0; i < days; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0] ?? '';
      const dayOfWeek = date.getDay();

      // Weekend off
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

      // Random leave for some staff
      const isOnLeave = staff.id === '3' && i === 2;

      schedules.push({
        id: `${staff.id}-${dateStr}`,
        staffId: staff.id,
        staff,
        date: dateStr,
        startTime: isWeekend || isOnLeave ? undefined : '09:00',
        endTime: isWeekend || isOnLeave ? undefined : '17:00',
        isWorkingDay: !isWeekend && !isOnLeave,
        isOnLeave,
        leaveType: isOnLeave ? 'SICK' : undefined,
      });
    }
  });

  return schedules;
};

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
  const schedules = generateMockSchedules(currentWeek);

  const filteredSchedules = selectedStaff === 'all'
    ? schedules
    : schedules.filter(s => s.staffId === selectedStaff);

  const uniqueStaff = Array.from(new Set(filteredSchedules.map(s => s.staffId)))
    .map(id => mockStaff.find(s => s.id === id)!)
    .filter(Boolean);

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

  const stats = {
    totalStaff: mockStaff.length,
    workingToday: schedules.filter(s =>
      s.date === new Date().toISOString().split('T')[0] && s.isWorkingDay
    ).length,
    onLeave: schedules.filter(s =>
      s.date === new Date().toISOString().split('T')[0] && s.isOnLeave
    ).length,
    pendingRequests: 3,
  };

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
                <p className="text-2xl font-bold">{stats.totalStaff}</p>
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
                <p className="text-2xl font-bold">{stats.workingToday}</p>
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
                <p className="text-2xl font-bold">{stats.onLeave}</p>
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
                <p className="text-2xl font-bold">{stats.pendingRequests}</p>
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
                {mockStaff.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('scheduling.weekView') || 'Week View'}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                      const dateStr = day.toISOString().split('T')[0];
                      const schedule = filteredSchedules.find(
                        s => s.staffId === staff.id && s.date === dateStr
                      );
                      const isToday = day.toDateString() === new Date().toDateString();

                      return (
                        <td
                          key={day.toISOString()}
                          className={`border p-2 text-center ${isToday ? 'bg-primary/5' : ''}`}
                        >
                          {schedule?.isOnLeave ? (
                            <Badge variant="warning" className="text-xs">
                              {t(`scheduling.${schedule.leaveType?.toLowerCase()}`) || schedule.leaveType}
                            </Badge>
                          ) : schedule?.isWorkingDay ? (
                            <div className="space-y-1">
                              <Badge variant="success" className="text-xs">
                                {schedule.startTime} - {schedule.endTime}
                              </Badge>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {t('scheduling.dayOff') || 'Off'}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
