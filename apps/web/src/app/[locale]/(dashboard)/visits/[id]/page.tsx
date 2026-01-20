'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Edit,
  Calendar,
  User,
  Stethoscope,
  FileText,
  Pill,
  Printer,
  Clock,
} from 'lucide-react';

const mockVisit = {
  id: '1',
  date: '2024-01-18',
  time: '10:30',
  patient: {
    id: '1',
    name: 'أحمد محمد علي',
    fileNumber: 'P-2024-001',
    phone: '+964 750 123 4567',
    age: 39,
    gender: 'MALE',
  },
  doctor: {
    id: '1',
    name: 'د. سارة أحمد',
    specialty: 'طب أسنان عام',
  },
  appointment: {
    id: '1',
    service: 'فحص عام',
  },
  status: 'completed',
  chiefComplaint: 'ألم شديد في الضرس الأيمن السفلي منذ 3 أيام',
  history: 'المريض يعاني من آلام متقطعة في الضرس منذ أسبوعين، تفاقمت الأعراض في الأيام الثلاثة الأخيرة',
  examination: 'فحص سريري: تسوس عميق في الضرس رقم 46، التهاب اللثة المحيطة، حساسية للبرودة والحرارة',
  diagnosis: 'تسوس عميق مع التهاب لب السن (Acute Pulpitis)',
  treatmentPlan: 'علاج عصب + تلبيسة',
  treatmentNotes: 'تم إجراء علاج العصب للضرس رقم 46. تم تنظيف القنوات وحشوها. يحتاج المريض لجلسة متابعة لوضع التلبيسة.',
  prescriptions: [
    {
      id: '1',
      medication: 'Amoxicillin 500mg',
      dosage: 'حبة واحدة',
      frequency: 'كل 8 ساعات',
      duration: '7 أيام',
      instructions: 'بعد الأكل',
    },
    {
      id: '2',
      medication: 'Ibuprofen 400mg',
      dosage: 'حبة واحدة',
      frequency: 'عند الحاجة',
      duration: '5 أيام',
      instructions: 'بعد الأكل، عند الألم',
    },
  ],
  followUp: '2024-01-25',
  attachments: [
    { id: '1', name: 'أشعة سينية.jpg', type: 'image' },
    { id: '2', name: 'صورة قبل العلاج.jpg', type: 'image' },
  ],
  invoice: {
    id: '1',
    number: 'INV-2024-015',
    total: 250000,
    status: 'paid',
  },
  createdAt: '2024-01-18T10:30:00',
  updatedAt: '2024-01-18T11:45:00',
};

export default function VisitDetailPage() {
  const params = useParams();
  const t = useTranslations();
  const visit = mockVisit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/visits">
            <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {t('visits.visitDetails')}
          </h1>
          <p className="text-muted-foreground">
            {visit.date} - {visit.patient.name}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/visits/${params.id as string}/edit`}>
            <Edit className="me-2 h-4 w-4" />
            {t('common.edit')}
          </Link>
        </Button>
        <Button variant="outline">
          <Printer className="me-2 h-4 w-4" />
          {t('common.print')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Visit Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('visits.visitInfo')}</CardTitle>
                <Badge variant={visit.status === 'completed' ? 'success' : 'warning'}>
                  {visit.status === 'completed'
                    ? t('appointments.status.completed')
                    : t('visits.inProgress')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.date')}</p>
                    <p className="font-medium">{visit.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('common.time')}</p>
                    <p className="font-medium">{visit.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('patients.patientName')}</p>
                    <Link href={`/patients/${visit.patient.id}`} className="font-medium text-primary hover:underline">
                      {visit.patient.name}
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('appointments.selectDoctor')}</p>
                    <p className="font-medium">{visit.doctor.name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chief Complaint */}
          <Card>
            <CardHeader>
              <CardTitle>{t('visits.chiefComplaint')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{visit.chiefComplaint}</p>
            </CardContent>
          </Card>

          {/* History & Examination */}
          <Card>
            <CardHeader>
              <CardTitle>{t('visits.historyAndExamination')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t('visits.history')}</h4>
                <p className="text-muted-foreground">{visit.history}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">{t('visits.examination')}</h4>
                <p className="text-muted-foreground">{visit.examination}</p>
              </div>
            </CardContent>
          </Card>

          {/* Diagnosis & Treatment */}
          <Card>
            <CardHeader>
              <CardTitle>{t('visits.diagnosisAndTreatment')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">{t('visits.diagnosis')}</h4>
                <p className="text-muted-foreground">{visit.diagnosis}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">{t('visits.treatmentPlan')}</h4>
                <p className="text-muted-foreground">{visit.treatmentPlan}</p>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">{t('visits.treatmentNotes')}</h4>
                <p className="text-muted-foreground">{visit.treatmentNotes}</p>
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  {t('visits.prescription')}
                </CardTitle>
                <Button variant="outline" size="sm">
                  <Printer className="me-2 h-4 w-4" />
                  {t('visits.printPrescription')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {visit.prescriptions.map((rx, index) => (
                  <div key={rx.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{rx.medication}</p>
                        <p className="text-sm text-muted-foreground">
                          {rx.dosage} - {rx.frequency} - {rx.duration}
                        </p>
                        {rx.instructions && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {t('visits.instructions')}: {rx.instructions}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Patient Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t('patients.patientInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">{t('patients.fileNumber')}</p>
                <p className="font-medium">{visit.patient.fileNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('common.phone')}</p>
                <p className="font-medium" dir="ltr">{visit.patient.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('patients.age')}</p>
                <p className="font-medium">{visit.patient.age} {t('common.yearsOld')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('patients.gender')}</p>
                <p className="font-medium">
                  {visit.patient.gender === 'MALE' ? t('patients.male') : t('patients.female')}
                </p>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/patients/${visit.patient.id}`}>
                  {t('patients.viewProfile')}
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Follow Up */}
          {visit.followUp && (
            <Card>
              <CardHeader>
                <CardTitle>{t('visits.followUp')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{visit.followUp}</span>
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href={`/appointments/new?patientId=${visit.patient.id}`}>
                    {t('appointments.scheduleFollowUp')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Invoice */}
          {visit.invoice && (
            <Card>
              <CardHeader>
                <CardTitle>{t('finance.invoice')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.invoiceNumber')}</p>
                  <Link href={`/finance/invoices/${visit.invoice.id}`} className="font-medium text-primary hover:underline">
                    {visit.invoice.number}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('finance.total')}</p>
                  <p className="font-medium">{visit.invoice.total.toLocaleString()} IQD</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('common.status')}</p>
                  <Badge variant={visit.invoice.status === 'paid' ? 'success' : 'warning'}>
                    {t(`finance.status.${visit.invoice.status}`)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attachments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('common.attachments')}</CardTitle>
                <Button variant="ghost" size="sm">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {visit.attachments.length > 0 ? (
                <div className="space-y-2">
                  {visit.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-2 border rounded-md hover:bg-muted cursor-pointer"
                    >
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{attachment.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('common.noData')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
