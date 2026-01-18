'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  status: 'new' | 'confirmed' | 'arrived' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    patientName: 'أحمد محمد',
    patientPhone: '+964 750 123 4567',
    doctorName: 'د. سارة أحمد',
    service: 'فحص عام',
    date: '2024-01-18',
    time: '09:00',
    duration: 30,
    status: 'confirmed',
  },
  {
    id: '2',
    patientName: 'فاطمة حسين',
    patientPhone: '+964 750 234 5678',
    doctorName: 'د. محمد علي',
    service: 'تنظيف أسنان',
    date: '2024-01-18',
    time: '09:30',
    duration: 45,
    status: 'arrived',
  },
  {
    id: '3',
    patientName: 'محمود سعيد',
    patientPhone: '+964 750 345 6789',
    doctorName: 'د. سارة أحمد',
    service: 'استشارة',
    date: '2024-01-18',
    time: '10:00',
    duration: 30,
    status: 'new',
  },
  {
    id: '4',
    patientName: 'نور الهدى',
    patientPhone: '+964 750 456 7890',
    doctorName: 'د. أحمد خالد',
    service: 'حشوة',
    date: '2024-01-18',
    time: '10:30',
    duration: 60,
    status: 'confirmed',
  },
  {
    id: '5',
    patientName: 'علي كريم',
    patientPhone: '+964 750 567 8901',
    doctorName: 'د. محمد علي',
    service: 'خلع ضرس',
    date: '2024-01-18',
    time: '11:30',
    duration: 30,
    status: 'completed',
  },
  {
    id: '6',
    patientName: 'سارة محمد',
    patientPhone: '+964 750 678 9012',
    doctorName: 'د. سارة أحمد',
    service: 'متابعة',
    date: '2024-01-17',
    time: '14:00',
    duration: 30,
    status: 'no_show',
  },
];

const statusConfig = {
  new: { variant: 'secondary' as const, label: 'status.new' },
  confirmed: { variant: 'success' as const, label: 'status.confirmed' },
  arrived: { variant: 'info' as const, label: 'status.arrived' },
  in_progress: { variant: 'warning' as const, label: 'status.inProgress' },
  completed: { variant: 'success' as const, label: 'status.completed' },
  no_show: { variant: 'destructive' as const, label: 'status.noShow' },
  cancelled: { variant: 'destructive' as const, label: 'status.cancelled' },
};

export default function AppointmentsPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [dateFilter, setDateFilter] = React.useState<string>('today');
  const [viewMode, setViewMode] = React.useState<'list' | 'calendar'>('list');

  const filteredAppointments = mockAppointments.filter((apt) => {
    const matchesSearch =
      apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.patientPhone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' && apt.date === '2024-01-18') ||
      (dateFilter === 'yesterday' && apt.date === '2024-01-17') ||
      (dateFilter === 'week' && true); // In real app, would check if within current week
    return matchesSearch && matchesStatus && matchesDate;
  });

  const todayStats = {
    total: mockAppointments.filter((a) => a.date === '2024-01-18').length,
    confirmed: mockAppointments.filter(
      (a) => a.date === '2024-01-18' && a.status === 'confirmed'
    ).length,
    completed: mockAppointments.filter(
      (a) => a.date === '2024-01-18' && a.status === 'completed'
    ).length,
    waiting: mockAppointments.filter(
      (a) => a.date === '2024-01-18' && a.status === 'arrived'
    ).length,
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
            {t('appointments.todayAppointments')}: {todayStats.total}
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
                <p className="text-2xl font-bold">{todayStats.total}</p>
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
                <p className="text-2xl font-bold">{todayStats.completed}</p>
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
                <p className="text-2xl font-bold">{todayStats.waiting}</p>
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
                <p className="text-2xl font-bold">{todayStats.confirmed}</p>
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

      {/* Appointments List */}
      {viewMode === 'list' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('appointments.title')}</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
                <span className="text-sm">18 يناير 2024</span>
                <Button variant="outline" size="sm">
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                  const config = statusConfig[apt.status];
                  return (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">{apt.time}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apt.patientName}</p>
                          <p className="text-sm text-muted-foreground" dir="ltr">
                            {apt.patientPhone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{apt.doctorName}</TableCell>
                      <TableCell>{apt.service}</TableCell>
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
                            {apt.status === 'confirmed' && (
                              <DropdownMenuItem>
                                <CheckCircle className="me-2 h-4 w-4" />
                                {t('appointments.confirmArrival')}
                              </DropdownMenuItem>
                            )}
                            {apt.status === 'arrived' && (
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
