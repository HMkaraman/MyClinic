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
} from 'lucide-react';

interface Visit {
  id: string;
  patientName: string;
  patientFileNumber: string;
  doctorName: string;
  date: string;
  chiefComplaint: string;
  diagnosis: string;
  status: 'in_progress' | 'completed';
}

const mockVisits: Visit[] = [
  {
    id: '1',
    patientName: 'أحمد محمد علي',
    patientFileNumber: 'P-2024-001',
    doctorName: 'د. سارة أحمد',
    date: '2024-01-18',
    chiefComplaint: 'ألم في الأسنان',
    diagnosis: 'تسوس عميق',
    status: 'completed',
  },
  {
    id: '2',
    patientName: 'فاطمة حسين',
    patientFileNumber: 'P-2024-002',
    doctorName: 'د. محمد علي',
    date: '2024-01-18',
    chiefComplaint: 'فحص دوري',
    diagnosis: 'سليم',
    status: 'in_progress',
  },
  {
    id: '3',
    patientName: 'محمود سعيد',
    patientFileNumber: 'P-2024-003',
    doctorName: 'د. سارة أحمد',
    date: '2024-01-17',
    chiefComplaint: 'تنظيف أسنان',
    diagnosis: 'تراكم جير',
    status: 'completed',
  },
  {
    id: '4',
    patientName: 'نور الهدى',
    patientFileNumber: 'P-2024-004',
    doctorName: 'د. أحمد خالد',
    date: '2024-01-17',
    chiefComplaint: 'حشوة سقطت',
    diagnosis: 'حشوة تحتاج استبدال',
    status: 'completed',
  },
  {
    id: '5',
    patientName: 'علي كريم',
    patientFileNumber: 'P-2024-005',
    doctorName: 'د. محمد علي',
    date: '2024-01-16',
    chiefComplaint: 'ألم في اللثة',
    diagnosis: 'التهاب لثة',
    status: 'completed',
  },
];

export default function VisitsPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredVisits = mockVisits.filter((visit) => {
    const matchesSearch =
      visit.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.patientFileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      visit.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || visit.status === statusFilter;
    const matchesDate =
      dateFilter === 'all' ||
      (dateFilter === 'today' && visit.date === '2024-01-18') ||
      (dateFilter === 'yesterday' && visit.date === '2024-01-17');
    return matchesSearch && matchesStatus && matchesDate;
  });

  const todayCount = mockVisits.filter((v) => v.date === '2024-01-18').length;
  const inProgressCount = mockVisits.filter((v) => v.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('visits.title')}
          </h1>
          <p className="text-muted-foreground">
            {t('visits.todayVisits')}: {todayCount} • {t('visits.inProgress')}: {inProgressCount}
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
                <p className="text-2xl font-bold">{todayCount}</p>
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
                <p className="text-2xl font-bold">{inProgressCount}</p>
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
                <p className="text-2xl font-bold">{mockVisits.length}</p>
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

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('visits.title')}</CardTitle>
        </CardHeader>
        <CardContent>
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
                      <p className="font-medium">{visit.patientName}</p>
                      <p className="text-sm text-muted-foreground">
                        {visit.patientFileNumber}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{visit.doctorName}</TableCell>
                  <TableCell>{visit.chiefComplaint}</TableCell>
                  <TableCell>{visit.diagnosis}</TableCell>
                  <TableCell>
                    <Badge
                      variant={visit.status === 'completed' ? 'success' : 'warning'}
                    >
                      {visit.status === 'completed'
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
        </CardContent>
      </Card>
    </div>
  );
}
