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
import { SearchableList } from '@/components/ui/searchable-list';
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
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

// Error state type
interface FieldErrors {
  patientId?: string;
  doctorId?: string;
  serviceId?: string;
  date?: string;
  startTime?: string;
  branchId?: string;
}

export default function NewAppointmentPage() {
  const t = useTranslations();
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);

  // Branch state - auto-select first branch if available
  const userBranches = user?.branchIds ?? [];
  const [branchId, setBranchId] = React.useState(userBranches[0] ?? '');

  // Auto-update branchId if user changes (e.g., after login refresh)
  React.useEffect(() => {
    if (!branchId && userBranches.length > 0 && userBranches[0]) {
      setBranchId(userBranches[0]);
    }
  }, [userBranches, branchId]);

  // Form state
  const [patientId, setPatientId] = React.useState('');
  const [patientSearch, setPatientSearch] = React.useState('');
  const [doctorId, setDoctorId] = React.useState('');
  const [serviceId, setServiceId] = React.useState('');
  const [date, setDate] = React.useState('');
  const [startTime, setStartTime] = React.useState('');
  const [duration, setDuration] = React.useState(30);
  const [notes, setNotes] = React.useState('');

  // Field-level error state
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});

  const debouncedPatientSearch = useDebouncedValue(patientSearch, 300);

  // Fetch data
  const { data: doctorsData, isLoading: isLoadingDoctors } = useDoctors();
  const { data: servicesData, isLoading: isLoadingServices } = useActiveServices();
  const { data: patientsData, isLoading: isLoadingPatients, isError: isPatientSearchError } = useSearchPatients(debouncedPatientSearch);
  const { data: availableSlots, isLoading: isLoadingSlots, isError: isSlotsError } = useAvailableSlots({
    doctorId,
    date,
    durationMinutes: duration,
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

  // Validate form and return true if valid
  const validateForm = (): boolean => {
    const errors: FieldErrors = {};
    const missingFields: string[] = [];

    // Check required fields
    if (!patientId) {
      errors.patientId = 'errors.required';
      missingFields.push(t('appointments.selectPatient'));
    }
    if (!doctorId) {
      errors.doctorId = 'errors.required';
      missingFields.push(t('appointments.selectDoctor'));
    }
    if (!serviceId) {
      errors.serviceId = 'errors.required';
      missingFields.push(t('appointments.selectService'));
    }
    if (!date) {
      errors.date = 'errors.required';
      missingFields.push(t('common.date'));
    }
    if (!startTime) {
      errors.startTime = 'errors.required';
      missingFields.push(t('common.time'));
    }
    if (!branchId) {
      errors.branchId = 'errors.noBranchAssigned';
      missingFields.push(t('common.branch'));
    }

    setFieldErrors(errors);

    // Show toast if there are errors
    if (Object.keys(errors).length > 0) {
      toast({
        title: t('common.error'),
        description: (
          <div className="space-y-2">
            {missingFields.length > 0 && (
              <div>
                <p className="font-medium">{t('errors.missingRequiredFields')}:</p>
                <ul className="list-disc list-inside ms-2 mt-1">
                  {missingFields.map((field, index) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ),
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Convert date + startTime to ISO scheduledAt
      const scheduledAt = new Date(`${date}T${startTime}:00`).toISOString();

      await createAppointment.mutateAsync({
        patientId,
        doctorId,
        branchId,
        serviceId,
        scheduledAt,
        durationMinutes: duration,
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
              {/* Branch selector - only shown when user has multiple branches or no branches */}
              {userBranches.length === 0 && (
                <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                  <p className="text-sm text-destructive">{t('errors.noBranchAssigned')}</p>
                </div>
              )}
              {userBranches.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="branch">
                    {t('common.branch')} <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={branchId}
                    onValueChange={(value) => {
                      setBranchId(value);
                      if (fieldErrors.branchId) setFieldErrors(prev => ({ ...prev, branchId: undefined }));
                    }}
                  >
                    <SelectTrigger className={cn(fieldErrors.branchId && 'border-destructive')}>
                      <SelectValue placeholder={t('common.selectBranch')} />
                    </SelectTrigger>
                    <SelectContent>
                      {userBranches.map((id) => (
                        <SelectItem key={id} value={id}>
                          {id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.branchId && <p className="text-sm text-destructive">{t(fieldErrors.branchId)}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label>
                  {t('appointments.selectPatient')} <span className="text-destructive">*</span>
                </Label>
                <SearchableList
                  value={patientId}
                  onValueChange={(value) => {
                    setPatientId(value);
                    if (fieldErrors.patientId) setFieldErrors(prev => ({ ...prev, patientId: undefined }));
                  }}
                  searchValue={patientSearch}
                  onSearchChange={setPatientSearch}
                  items={patients}
                  isLoading={isLoadingPatients && debouncedPatientSearch.length >= 2}
                  isError={isPatientSearchError}
                  minSearchLength={2}
                  searchPlaceholder={t('patients.searchPlaceholder')}
                  searchHintText={t('patients.searchHint')}
                  noResultsText={t('patients.noPatientsFound')}
                  errorText={t('errors.serverError')}
                  getItemValue={(p) => p.id}
                  getItemKey={(p) => p.id}
                  renderItem={(p) => (
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground" dir="ltr">{p.phone}</p>
                    </div>
                  )}
                  error={!!fieldErrors.patientId}
                />
                {fieldErrors.patientId && <p className="text-sm text-destructive">{t(fieldErrors.patientId)}</p>}
              </div>
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
                <Label htmlFor="doctor">{t('appointments.selectDoctor')} <span className="text-destructive">*</span></Label>
                {isLoadingDoctors ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={doctorId}
                    onValueChange={(value) => {
                      setDoctorId(value);
                      if (fieldErrors.doctorId) setFieldErrors(prev => ({ ...prev, doctorId: undefined }));
                    }}
                  >
                    <SelectTrigger className={cn(fieldErrors.doctorId && 'border-destructive')}>
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
                {fieldErrors.doctorId && <p className="text-sm text-destructive">{t(fieldErrors.doctorId)}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">
                  {t('appointments.selectService')} <span className="text-destructive">*</span>
                </Label>
                {isLoadingServices ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={serviceId}
                    onValueChange={(value) => {
                      setServiceId(value);
                      if (fieldErrors.serviceId) setFieldErrors(prev => ({ ...prev, serviceId: undefined }));
                    }}
                  >
                    <SelectTrigger className={cn(fieldErrors.serviceId && 'border-destructive')}>
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
                {fieldErrors.serviceId && <p className="text-sm text-destructive">{t(fieldErrors.serviceId)}</p>}
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
                <Label htmlFor="date">{t('common.date')} <span className="text-destructive">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    if (fieldErrors.date) setFieldErrors(prev => ({ ...prev, date: undefined }));
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  error={!!fieldErrors.date}
                />
                {fieldErrors.date && <p className="text-sm text-destructive">{t(fieldErrors.date)}</p>}
              </div>

              <div className="space-y-2">
                <Label>{t('appointments.availableSlots')} <span className="text-destructive">*</span></Label>
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
                ) : isSlotsError ? (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">{t('errors.serverError')}</p>
                  </div>
                ) : availableSlots && availableSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots
                      .filter((slot) => slot.available)
                      .map((slot) => {
                        // Transform ISO date string to HH:MM format
                        const slotTime = new Date(slot.start).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        });
                        return (
                          <Button
                            key={slot.start}
                            type="button"
                            variant={startTime === slotTime ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              setStartTime(slotTime);
                              if (fieldErrors.startTime) setFieldErrors(prev => ({ ...prev, startTime: undefined }));
                            }}
                          >
                            <Clock className="me-1 h-3 w-3" />
                            {slotTime}
                          </Button>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('appointments.noAppointments')}
                  </p>
                )}
                {fieldErrors.startTime && <p className="text-sm text-destructive">{t(fieldErrors.startTime)}</p>}
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
