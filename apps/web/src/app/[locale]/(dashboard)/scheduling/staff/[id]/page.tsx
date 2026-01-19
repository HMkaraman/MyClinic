'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarOff,
  FileText,
} from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface ScheduleEntry {
  id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isWorkingDay: boolean;
  isOnLeave?: boolean;
  leaveType?: string;
  notes?: string;
}

interface TimeOffRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
}

// Mock data
const mockStaff: Record<string, Staff> = {
  '1': { id: '1', name: 'Dr. Ahmed Hassan', email: 'ahmed@clinic.com', role: 'DOCTOR' },
  '2': { id: '2', name: 'Dr. Sara Mohamed', email: 'sara@clinic.com', role: 'DOCTOR' },
  '3': { id: '3', name: 'Nurse Fatima', email: 'fatima@clinic.com', role: 'NURSE' },
  '4': { id: '4', name: 'Receptionist Ali', email: 'ali@clinic.com', role: 'RECEPTION' },
};

const mockTemplates = [
  { id: '1', name: 'Standard Week' },
  { id: '2', name: 'Morning Shift' },
  { id: '3', name: 'Evening Shift' },
];

const generateMockSchedules = (monthStart: Date): ScheduleEntry[] => {
  const schedules: ScheduleEntry[] = [];
  const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), i);
    const dateStr = date.toISOString().split('T')[0] ?? '';
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;

    // Random leave days
    const isOnLeave = i === 15 || i === 16;

    schedules.push({
      id: `schedule-${dateStr}`,
      date: dateStr,
      startTime: isWeekend || isOnLeave ? undefined : '09:00',
      endTime: isWeekend || isOnLeave ? undefined : '17:00',
      isWorkingDay: !isWeekend && !isOnLeave,
      isOnLeave,
      leaveType: isOnLeave ? 'VACATION' : undefined,
    });
  }

  return schedules;
};

const mockTimeOffHistory: TimeOffRequest[] = [
  {
    id: '1',
    type: 'VACATION',
    startDate: '2024-02-15',
    endDate: '2024-02-16',
    status: 'APPROVED',
    reason: 'Family event',
  },
  {
    id: '2',
    type: 'SICK',
    startDate: '2024-01-10',
    endDate: '2024-01-10',
    status: 'APPROVED',
    reason: 'Medical appointment',
  },
];

export default function StaffSchedulePage() {
  const params = useParams();
  const t = useTranslations();
  const staffId = params.id as string;
  const staff = mockStaff[staffId];

  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [schedules, setSchedules] = React.useState<ScheduleEntry[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [isApplyTemplateOpen, setIsApplyTemplateOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<ScheduleEntry | null>(null);
  const [templateForm, setTemplateForm] = React.useState({
    templateId: '',
    startDate: '',
    endDate: '',
  });

  React.useEffect(() => {
    setSchedules(generateMockSchedules(currentMonth));
  }, [currentMonth]);

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-muted-foreground">{t('errors.notFound') || 'Staff not found'}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/scheduling">
            <ArrowLeft className="me-2 h-4 w-4" />
            {t('common.back') || 'Back'}
          </Link>
        </Button>
      </div>
    );
  }

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const handleEditSchedule = (schedule: ScheduleEntry) => {
    setSelectedDate(schedule);
    setIsEditDialogOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!selectedDate) return;
    setSchedules(
      schedules.map((s) =>
        s.id === selectedDate.id ? selectedDate : s
      )
    );
    setIsEditDialogOpen(false);
  };

  const handleApplyTemplate = () => {
    console.log('Applying template:', templateForm);
    setIsApplyTemplateOpen(false);
    setTemplateForm({ templateId: '', startDate: '', endDate: '' });
  };

  // Calendar rendering
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const weeks: (ScheduleEntry | null)[][] = [];
  let currentWeek: (ScheduleEntry | null)[] = [];

  // Fill in empty days at the start
  for (let i = 0; i < firstDayOfMonth; i++) {
    currentWeek.push(null);
  }

  // Fill in the days
  for (let day = 1; day <= daysInMonth; day++) {
    const schedule = schedules.find((s) => {
      const scheduleDay = new Date(s.date).getDate();
      return scheduleDay === day;
    });
    currentWeek.push(schedule || null);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill in empty days at the end
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const stats = {
    workingDays: schedules.filter((s) => s.isWorkingDay).length,
    daysOff: schedules.filter((s) => !s.isWorkingDay && !s.isOnLeave).length,
    leaveDays: schedules.filter((s) => s.isOnLeave).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/scheduling">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback>{staff.name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{staff.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Badge variant="secondary">
                {t(`roles.${staff.role.toLowerCase()}`) || staff.role}
              </Badge>
              <span className="text-sm">{staff.email}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isApplyTemplateOpen} onOpenChange={setIsApplyTemplateOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="me-2 h-4 w-4" />
                {t('scheduling.applyTemplate') || 'Apply Template'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('scheduling.applyTemplate') || 'Apply Template'}</DialogTitle>
                <DialogDescription>
                  {t('scheduling.applyTemplateDescription') ||
                    'Apply a schedule template to a date range'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>{t('scheduling.template') || 'Template'}</Label>
                  <Select
                    value={templateForm.templateId}
                    onValueChange={(value) =>
                      setTemplateForm({ ...templateForm, templateId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('scheduling.selectTemplate') || 'Select template'} />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>{t('scheduling.startDate') || 'Start Date'}</Label>
                    <Input
                      type="date"
                      value={templateForm.startDate}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, startDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('scheduling.endDate') || 'End Date'}</Label>
                    <Input
                      type="date"
                      value={templateForm.endDate}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, endDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsApplyTemplateOpen(false)}>
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button
                  onClick={handleApplyTemplate}
                  disabled={!templateForm.templateId || !templateForm.startDate || !templateForm.endDate}
                >
                  {t('common.apply') || 'Apply'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <Clock className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('scheduling.workingDays') || 'Working Days'}</p>
                <p className="text-2xl font-bold">{stats.workingDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-muted p-3">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('scheduling.daysOff') || 'Days Off'}</p>
                <p className="text-2xl font-bold">{stats.daysOff}</p>
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
                <p className="text-sm text-muted-foreground">{t('scheduling.leaveDays') || 'Leave Days'}</p>
                <p className="text-2xl font-bold">{stats.leaveDays}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList>
          <TabsTrigger value="calendar">
            <Calendar className="me-2 h-4 w-4" />
            {t('scheduling.calendar') || 'Calendar'}
          </TabsTrigger>
          <TabsTrigger value="time-off">
            <CalendarOff className="me-2 h-4 w-4" />
            {t('scheduling.timeOff') || 'Time Off History'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={goToCurrentMonth}>
                    {t('common.today') || 'Today'}
                  </Button>
                  <Button variant="outline" size="icon" onClick={goToNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <th key={day} className="border p-2 bg-muted text-center font-medium">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week, weekIndex) => (
                      <tr key={weekIndex}>
                        {week.map((schedule, dayIndex) => {
                          const isToday =
                            schedule &&
                            new Date(schedule.date).toDateString() === new Date().toDateString();

                          return (
                            <td
                              key={dayIndex}
                              className={`border p-2 h-24 align-top ${
                                isToday ? 'bg-primary/5' : ''
                              } ${!schedule ? 'bg-muted/30' : ''}`}
                            >
                              {schedule && (
                                <div
                                  className="cursor-pointer hover:bg-muted/50 rounded p-1 h-full"
                                  onClick={() => handleEditSchedule(schedule)}
                                >
                                  <div className="font-medium text-sm">
                                    {new Date(schedule.date).getDate()}
                                  </div>
                                  <div className="mt-1">
                                    {schedule.isOnLeave ? (
                                      <Badge variant="warning" className="text-xs">
                                        {t(`scheduling.${schedule.leaveType?.toLowerCase()}`) ||
                                          schedule.leaveType}
                                      </Badge>
                                    ) : schedule.isWorkingDay ? (
                                      <div className="text-xs text-muted-foreground">
                                        {schedule.startTime} - {schedule.endTime}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        {t('scheduling.dayOff') || 'Off'}
                                      </span>
                                    )}
                                  </div>
                                </div>
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
        </TabsContent>

        <TabsContent value="time-off" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('scheduling.timeOffHistory') || 'Time Off History'}</CardTitle>
              <CardDescription>
                {t('scheduling.timeOffHistoryDescription') || 'Past and upcoming time off requests'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('scheduling.type') || 'Type'}</TableHead>
                    <TableHead>{t('scheduling.startDate') || 'Start'}</TableHead>
                    <TableHead>{t('scheduling.endDate') || 'End'}</TableHead>
                    <TableHead>{t('scheduling.reason') || 'Reason'}</TableHead>
                    <TableHead>{t('common.status') || 'Status'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTimeOffHistory.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Badge variant="secondary">
                          {t(`scheduling.${request.type.toLowerCase()}`) || request.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{request.startDate}</TableCell>
                      <TableCell>{request.endDate}</TableCell>
                      <TableCell>{request.reason || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            request.status === 'APPROVED'
                              ? 'success'
                              : request.status === 'REJECTED'
                              ? 'destructive'
                              : 'warning'
                          }
                        >
                          {t(`scheduling.status.${request.status.toLowerCase()}`) || request.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Schedule Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('scheduling.editSchedule') || 'Edit Schedule'}</DialogTitle>
            <DialogDescription>
              {selectedDate?.date}
            </DialogDescription>
          </DialogHeader>
          {selectedDate && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isWorkingDay"
                  checked={selectedDate.isWorkingDay}
                  onCheckedChange={(checked) =>
                    setSelectedDate({ ...selectedDate, isWorkingDay: !!checked })
                  }
                />
                <Label htmlFor="isWorkingDay">{t('scheduling.workingDay') || 'Working Day'}</Label>
              </div>
              {selectedDate.isWorkingDay && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>{t('scheduling.startTime') || 'Start Time'}</Label>
                    <Input
                      type="time"
                      value={selectedDate.startTime || '09:00'}
                      onChange={(e) =>
                        setSelectedDate({ ...selectedDate, startTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t('scheduling.endTime') || 'End Time'}</Label>
                    <Input
                      type="time"
                      value={selectedDate.endTime || '17:00'}
                      onChange={(e) =>
                        setSelectedDate({ ...selectedDate, endTime: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button onClick={handleSaveSchedule}>
              {t('common.save') || 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
