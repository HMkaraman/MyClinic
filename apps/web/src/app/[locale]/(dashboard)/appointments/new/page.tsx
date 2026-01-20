'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSearchPatients } from '@/hooks/use-patients';
import { useDoctors } from '@/hooks/use-doctors';
import { useActiveServices } from '@/hooks/use-services';
import { useAvailableSlots, useCreateAppointment } from '@/hooks/use-appointments';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

export default function NewAppointmentPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();

  // Form state
  const [patientId, setPatientId] = React.useState('');
  const [patientSearch, setPatientSearch] = React.useState('');
  const [doctorId, setDoctorId] = React.useState('');
  const [serviceId, setServiceId] = React.useState('');
  const [date, setDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [duration, setDuration] = React.useState(30);
  const [notes, setNotes] = React.useState('');

  const debouncedPatientSearch = useDebouncedValue(patientSearch, 300);

  // Fetch data
  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctors();
  const { data: servicesData, isLoading: isLoadingServices } = useActiveServices();
  const { data: patientsData, isLoading: isLoadingPatients } = useSearchPatients(debouncedPatientSearch);
  const { data: availableSlots, isLoading: isLoadingSlots } = useAvailableSlots({
    doctorId,
    date,
    duration,
  });

  const createAppointment = useCreateAppointment();

  const doctors = doctorsData?.data ?? [];
  const services = React.useMemo(() => servicesData?.data ?? [], [servicesData?.data]);
  const patients = patientsData?.data ?? [];

  // Auto-fill duration when service is selected
  React.useEffect(() => {
    if (serviceId) {
      const service = services.find((s) => s.id === serviceId);
      if (service) {
        setDuration(service.durationMinutes);
      }
    }
  }, [serviceId, services]);

  // Get selected patient name for display
  const selectedPatient = patients.find((p) => p.id === patientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId || !doctorId || !date || !startTime || !duration) {
      toast({
        title: t('common.error'),
        description: t('errors.required'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAppointment.mutateAsync({
        patientId,
        doctorId,
        serviceId: serviceId || undefined,
        date,
        startTime,
        duration,
        notes: notes || undefined,
      });

      toast({
        title: t('common.success'),
        description: t('common.success'),
      });

      router.push('/appointments');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error?.message || t('errors.serverError'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/appointments">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('appointments.newAppointment')}
            </h1>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={createAppointment.isPending}>
          {createAppointment.isPending ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="me-2 h-4 w-4" />
          )}
          {t('common.save')}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Patient Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('appointments.selectPatient')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patient-search">{t('common.search')}</Label>
                <Input
                  id="patient-search"
                  placeholder={t('patients.searchPlaceholder')}
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                />
              </div>
              {isLoadingPatients && debouncedPatientSearch.length >= 2 && (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
              {patients.length > 0 && (
                <div className="space-y-2">
                  <Label>{t('patients.patientName')}</Label>
                  <Select value={patientId} onValueChange={setPatientId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('appointments.selectPatient')} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name} - {patient.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {selectedPatient && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="font-medium">{selectedPatient.name}</p>
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {selectedPatient.phone}
                  </p>
                  {selectedPatient.fileNumber && (
                    <p className="text-sm text-muted-foreground">
                      {t('patients.fileNumber')}: {selectedPatient.fileNumber}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Doctor & Service Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('appointments.selectDoctor')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctor">{t('appointments.selectDoctor')}</Label>
                {isLoadingDoctors ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('appointments.selectDoctor')} />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">{t('appointments.selectService')}</Label>
                {isLoadingServices ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={serviceId} onValueChange={setServiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('appointments.selectService')} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name} ({service.durationMinutes} {t('appointments.minutes')})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Date & Time Selection */}
          <Card>
            <CardHeader>
              <CardTitle>{t('appointments.selectDate')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t('common.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('appointments.availableSlots')}</Label>
                {!doctorId || !date ? (
                  <p className="text-sm text-muted-foreground">
                    {t('appointments.selectDoctor')} & {t('appointments.selectDate')}
                  </p>
                ) : isLoadingSlots ? (
                  <div className="grid grid-cols-4 gap-2">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-10" />
                    ))}
                  </div>
                ) : availableSlots && availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots
                      .filter((slot) => slot.available)
                      .map((slot) => (
                        <Button
                          key={slot.startTime}
                          type="button"
                          variant={startTime === slot.startTime ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setStartTime(slot.startTime)}
                        >
                          <Clock className="me-1 h-3 w-3" />
                          {slot.startTime}
                        </Button>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('appointments.noAppointments')}
                  </p>
                )}
              </div>

              {startTime && (
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="text-sm">
                    {t('appointments.selectTime')}: <strong>{startTime}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Duration & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>{t('appointments.duration')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="duration">
                  {t('appointments.duration')} ({t('appointments.minutes')})
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min={5}
                  max={480}
                  step={5}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10) || 30)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('common.notes')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('common.notes')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Save Button */}
        <div className="md:hidden">
          <Button
            type="submit"
            className="w-full"
            disabled={createAppointment.isPending}
          >
            {createAppointment.isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="me-2 h-4 w-4" />
            )}
            {t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
