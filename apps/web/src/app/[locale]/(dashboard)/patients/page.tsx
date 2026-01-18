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
  Phone,
  Calendar,
  FileText,
} from 'lucide-react';

interface Patient {
  id: string;
  fileNumber: string;
  name: string;
  phone: string;
  email?: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth?: string;
  lastVisit?: string;
  totalVisits: number;
  status: 'active' | 'inactive';
}

const mockPatients: Patient[] = [
  {
    id: '1',
    fileNumber: 'P-2024-001',
    name: 'أحمد محمد علي',
    phone: '+964 750 123 4567',
    email: 'ahmed@email.com',
    gender: 'MALE',
    dateOfBirth: '1985-03-15',
    lastVisit: '2024-01-15',
    totalVisits: 12,
    status: 'active',
  },
  {
    id: '2',
    fileNumber: 'P-2024-002',
    name: 'فاطمة حسين',
    phone: '+964 750 234 5678',
    gender: 'FEMALE',
    dateOfBirth: '1990-07-22',
    lastVisit: '2024-01-10',
    totalVisits: 5,
    status: 'active',
  },
  {
    id: '3',
    fileNumber: 'P-2024-003',
    name: 'محمود سعيد',
    phone: '+964 750 345 6789',
    email: 'mahmoud@email.com',
    gender: 'MALE',
    dateOfBirth: '1978-11-30',
    lastVisit: '2023-12-20',
    totalVisits: 8,
    status: 'active',
  },
  {
    id: '4',
    fileNumber: 'P-2024-004',
    name: 'نور الهدى',
    phone: '+964 750 456 7890',
    gender: 'FEMALE',
    dateOfBirth: '1995-05-10',
    lastVisit: '2024-01-12',
    totalVisits: 3,
    status: 'active',
  },
  {
    id: '5',
    fileNumber: 'P-2024-005',
    name: 'علي كريم',
    phone: '+964 750 567 8901',
    gender: 'MALE',
    dateOfBirth: '1982-09-08',
    totalVisits: 0,
    status: 'inactive',
  },
];

export default function PatientsPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const filteredPatients = mockPatients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.phone.includes(searchQuery) ||
      patient.fileNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || patient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('patients.title')}
          </h1>
          <p className="text-muted-foreground">
            {filteredPatients.length} {t('patients.title').toLowerCase()}
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">
            <Plus className="me-2 h-4 w-4" />
            {t('patients.newPatient')}
          </Link>
        </Button>
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all') || 'All'}</SelectItem>
                <SelectItem value="active">{t('common.active') || 'Active'}</SelectItem>
                <SelectItem value="inactive">{t('common.inactive') || 'Inactive'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('patients.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('patients.fileNumber')}</TableHead>
                <TableHead>{t('patients.patientName')}</TableHead>
                <TableHead>{t('common.phone')}</TableHead>
                <TableHead>{t('patients.gender')}</TableHead>
                <TableHead>{t('common.date')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="w-[70px]">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/patients/${patient.id}`}
                      className="text-primary hover:underline"
                    >
                      {patient.fileNumber}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{patient.name}</p>
                      {patient.email && (
                        <p className="text-sm text-muted-foreground">
                          {patient.email}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell dir="ltr">{patient.phone}</TableCell>
                  <TableCell>
                    {patient.gender === 'MALE'
                      ? t('patients.male')
                      : t('patients.female')}
                  </TableCell>
                  <TableCell>
                    {patient.lastVisit ? (
                      <div className="text-sm">
                        <p>{patient.lastVisit}</p>
                        <p className="text-muted-foreground">
                          {patient.totalVisits} {t('visits.title').toLowerCase()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={patient.status === 'active' ? 'success' : 'secondary'}
                    >
                      {patient.status === 'active' ? t('common.active') || 'Active' : t('common.inactive') || 'Inactive'}
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
                          <Link href={`/patients/${patient.id}`}>
                            <Eye className="me-2 h-4 w-4" />
                            {t('common.view') || 'View'}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/patients/${patient.id}/edit`}>
                            <Edit className="me-2 h-4 w-4" />
                            {t('common.edit')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Phone className="me-2 h-4 w-4" />
                          {t('common.call') || 'Call'}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/appointments/new?patientId=${patient.id}`}>
                            <Calendar className="me-2 h-4 w-4" />
                            {t('appointments.newAppointment')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/new?patientId=${patient.id}`}>
                            <FileText className="me-2 h-4 w-4" />
                            {t('finance.newInvoice')}
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
