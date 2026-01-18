'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Plus,
  Stethoscope,
  Receipt,
  AlertTriangle,
  Pill,
  Activity,
} from 'lucide-react';

interface PatientDetailPageProps {
  params: { id: string };
}

const mockPatient = {
  id: '1',
  fileNumber: 'P-2024-001',
  name: 'أحمد محمد علي',
  phone: '+964 750 123 4567',
  email: 'ahmed@email.com',
  gender: 'MALE',
  dateOfBirth: '1985-03-15',
  address: 'بغداد، الكرادة، شارع 52',
  bloodType: 'A+',
  status: 'active',
  createdAt: '2023-06-15',
  medicalSummary: {
    allergies: ['Penicillin', 'Aspirin'],
    chronicDiseases: ['Diabetes Type 2', 'Hypertension'],
    currentMedications: ['Metformin 500mg', 'Lisinopril 10mg'],
    notes: 'Patient requires special attention for dental procedures due to blood thinners.',
  },
};

const mockVisits = [
  {
    id: '1',
    date: '2024-01-15',
    doctor: 'د. سارة أحمد',
    diagnosis: 'فحص دوري',
    status: 'completed',
  },
  {
    id: '2',
    date: '2024-01-02',
    doctor: 'د. محمد علي',
    diagnosis: 'تنظيف الأسنان',
    status: 'completed',
  },
  {
    id: '3',
    date: '2023-12-10',
    doctor: 'د. سارة أحمد',
    diagnosis: 'ألم في الضرس',
    status: 'completed',
  },
];

const mockAppointments = [
  {
    id: '1',
    date: '2024-01-25',
    time: '10:00',
    doctor: 'د. سارة أحمد',
    service: 'متابعة',
    status: 'confirmed',
  },
];

const mockInvoices = [
  {
    id: '1',
    number: 'INV-2024-001',
    date: '2024-01-15',
    total: 150000,
    paid: 150000,
    status: 'paid',
  },
  {
    id: '2',
    number: 'INV-2024-002',
    date: '2024-01-02',
    total: 75000,
    paid: 50000,
    status: 'partial',
  },
];

export default function PatientDetailPage({ params }: PatientDetailPageProps) {
  const t = useTranslations();
  const patient = mockPatient;

  const initials = patient.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2);

  const age = patient.dateOfBirth
    ? new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/patients">
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
          <p className="text-muted-foreground">{patient.fileNumber}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/patients/${params.id}/edit`}>
            <Edit className="me-2 h-4 w-4" />
            {t('common.edit')}
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/appointments/new?patientId=${params.id}`}>
            <Plus className="me-2 h-4 w-4" />
            {t('appointments.newAppointment')}
          </Link>
        </Button>
      </div>

      {/* Patient Overview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Patient Info Card */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold">{patient.name}</h2>
              <p className="text-muted-foreground">
                {age} {t('common.yearsOld') || 'years old'} •{' '}
                {patient.gender === 'MALE' ? t('patients.male') : t('patients.female')}
              </p>
              <Badge
                variant={patient.status === 'active' ? 'success' : 'secondary'}
                className="mt-2"
              >
                {patient.status === 'active' ? t('common.active') || 'Active' : t('common.inactive') || 'Inactive'}
              </Badge>
            </div>

            <Separator className="my-6" />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span dir="ltr">{patient.phone}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{patient.dateOfBirth}</span>
              </div>
              {patient.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.address}</span>
                </div>
              )}
              {patient.bloodType && (
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>{t('patients.bloodType')}: {patient.bloodType}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Medical Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('patients.medicalHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Allergies */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <h4 className="font-medium">{t('patients.allergies')}</h4>
                </div>
                {patient.medicalSummary.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalSummary.allergies.map((allergy, i) => (
                      <Badge key={i} variant="destructive">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
                )}
              </div>

              {/* Chronic Diseases */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="h-4 w-4 text-yellow-500" />
                  <h4 className="font-medium">{t('patients.chronicDiseases')}</h4>
                </div>
                {patient.medicalSummary.chronicDiseases.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalSummary.chronicDiseases.map((disease, i) => (
                      <Badge key={i} variant="warning">
                        {disease}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
                )}
              </div>

              {/* Current Medications */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="h-4 w-4 text-blue-500" />
                  <h4 className="font-medium">{t('patients.currentMedications')}</h4>
                </div>
                {patient.medicalSummary.currentMedications.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalSummary.currentMedications.map((med, i) => (
                      <Badge key={i} variant="info">
                        {med}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">{t('common.noData')}</p>
                )}
              </div>

              {/* Notes */}
              {patient.medicalSummary.notes && (
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-2">{t('common.notes')}</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {patient.medicalSummary.notes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for History */}
      <Card>
        <Tabs defaultValue="visits">
          <CardHeader>
            <TabsList>
              <TabsTrigger value="visits" className="gap-2">
                <Stethoscope className="h-4 w-4" />
                {t('visits.title')}
              </TabsTrigger>
              <TabsTrigger value="appointments" className="gap-2">
                <Calendar className="h-4 w-4" />
                {t('appointments.title')}
              </TabsTrigger>
              <TabsTrigger value="invoices" className="gap-2">
                <Receipt className="h-4 w-4" />
                {t('finance.invoices')}
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            {/* Visits Tab */}
            <TabsContent value="visits">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('appointments.selectDoctor')}</TableHead>
                    <TableHead>{t('visits.diagnosis')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                    <TableHead>{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVisits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>{visit.date}</TableCell>
                      <TableCell>{visit.doctor}</TableCell>
                      <TableCell>{visit.diagnosis}</TableCell>
                      <TableCell>
                        <Badge variant="success">
                          {t('appointments.status.completed')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/visits/${visit.id}`}>
                            {t('common.view') || 'View'}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Appointments Tab */}
            <TabsContent value="appointments">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('common.time')}</TableHead>
                    <TableHead>{t('appointments.selectDoctor')}</TableHead>
                    <TableHead>{t('appointments.selectService')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>{apt.date}</TableCell>
                      <TableCell>{apt.time}</TableCell>
                      <TableCell>{apt.doctor}</TableCell>
                      <TableCell>{apt.service}</TableCell>
                      <TableCell>
                        <Badge variant="success">
                          {t('appointments.status.confirmed')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('finance.invoiceNumber')}</TableHead>
                    <TableHead>{t('common.date')}</TableHead>
                    <TableHead>{t('finance.total')}</TableHead>
                    <TableHead>{t('finance.paidAmount')}</TableHead>
                    <TableHead>{t('common.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <Link
                          href={`/finance/invoices/${invoice.id}`}
                          className="text-primary hover:underline"
                        >
                          {invoice.number}
                        </Link>
                      </TableCell>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell>{invoice.total.toLocaleString()} IQD</TableCell>
                      <TableCell>{invoice.paid.toLocaleString()} IQD</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === 'paid'
                              ? 'success'
                              : invoice.status === 'partial'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {t(`finance.status.${invoice.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
