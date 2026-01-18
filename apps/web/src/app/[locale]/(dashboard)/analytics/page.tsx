'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { format, subDays } from 'date-fns';
import { BarChart3 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AnalyticsFilters,
  AnalyticsKpiCards,
  RevenueChart,
  PatientDemographics,
  AppointmentMetrics,
  ServicePerformance,
  StaffProductivity,
  LeadFunnel,
  ExportButton,
} from '@/components/analytics';
import {
  useDashboard,
  useRevenue,
  usePatients,
  useAppointments,
  useServices,
  useStaff,
  useLeads,
} from '@/hooks/use-analytics';
import type { Granularity, QueryAnalyticsParams } from '@/lib/analytics-api';
import { useAuthStore } from '@/stores/auth-store';

type TabValue = 'overview' | 'revenue' | 'patients' | 'appointments' | 'services' | 'staff' | 'leads';

const ROLE_TAB_ACCESS: Record<string, TabValue[]> = {
  ADMIN: ['overview', 'revenue', 'patients', 'appointments', 'services', 'staff', 'leads'],
  MANAGER: ['overview', 'revenue', 'patients', 'appointments', 'services', 'staff', 'leads'],
  ACCOUNTANT: ['revenue'],
  RECEPTION: ['appointments'],
  SUPPORT: ['leads'],
  DOCTOR: [],
  NURSE: [],
};

export default function AnalyticsPage() {
  const t = useTranslations('analytics');
  const { user } = useAuthStore();

  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  const params: QueryAnalyticsParams = useMemo(
    () => ({
      dateFrom,
      dateTo,
      granularity,
    }),
    [dateFrom, dateTo, granularity]
  );

  // Determine accessible tabs based on user role
  const accessibleTabs = useMemo(() => {
    if (!user?.role) return ['overview'];
    return ROLE_TAB_ACCESS[user.role] || [];
  }, [user?.role]);

  // Fetch data based on active tab
  const { data: dashboardData, isLoading: dashboardLoading } = useDashboard(
    activeTab === 'overview' ? params : {}
  );
  const { data: revenueData, isLoading: revenueLoading } = useRevenue(
    activeTab === 'revenue' || activeTab === 'overview' ? params : {}
  );
  const { data: patientsData, isLoading: patientsLoading } = usePatients(
    activeTab === 'patients' ? params : {}
  );
  const { data: appointmentsData, isLoading: appointmentsLoading } = useAppointments(
    activeTab === 'appointments' ? params : {}
  );
  const { data: servicesData, isLoading: servicesLoading } = useServices(
    activeTab === 'services' ? params : {}
  );
  const { data: staffData, isLoading: staffLoading } = useStaff(
    activeTab === 'staff' ? params : {}
  );
  const { data: leadsData, isLoading: leadsLoading } = useLeads(
    activeTab === 'leads' ? params : {}
  );

  const handleDateChange = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const handleGranularityChange = (newGranularity: Granularity) => {
    setGranularity(newGranularity);
  };

  // Get report type for export based on active tab
  const getReportType = () => {
    switch (activeTab) {
      case 'overview':
        return 'dashboard';
      default:
        return activeTab;
    }
  };

  // If user has no access to any tabs
  if (accessibleTabs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <BarChart3 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">{t('noAccess.title')}</h2>
        <p className="text-muted-foreground">{t('noAccess.message')}</p>
      </div>
    );
  }

  // Set default tab to first accessible tab if current is not accessible
  if (!accessibleTabs.includes(activeTab)) {
    setActiveTab(accessibleTabs[0] as TabValue);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-4">
          <AnalyticsFilters
            dateFrom={dateFrom}
            dateTo={dateTo}
            granularity={granularity}
            onDateChange={handleDateChange}
            onGranularityChange={handleGranularityChange}
          />
          <ExportButton reportType={getReportType()} params={params} />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {accessibleTabs.includes('overview') && (
            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          )}
          {accessibleTabs.includes('revenue') && (
            <TabsTrigger value="revenue">{t('tabs.revenue')}</TabsTrigger>
          )}
          {accessibleTabs.includes('patients') && (
            <TabsTrigger value="patients">{t('tabs.patients')}</TabsTrigger>
          )}
          {accessibleTabs.includes('appointments') && (
            <TabsTrigger value="appointments">{t('tabs.appointments')}</TabsTrigger>
          )}
          {accessibleTabs.includes('services') && (
            <TabsTrigger value="services">{t('tabs.services')}</TabsTrigger>
          )}
          {accessibleTabs.includes('staff') && (
            <TabsTrigger value="staff">{t('tabs.staff')}</TabsTrigger>
          )}
          {accessibleTabs.includes('leads') && (
            <TabsTrigger value="leads">{t('tabs.leads')}</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        {accessibleTabs.includes('overview') && (
          <TabsContent value="overview" className="space-y-6">
            <AnalyticsKpiCards data={dashboardData} isLoading={dashboardLoading} />
            <RevenueChart data={revenueData} isLoading={revenueLoading} />
          </TabsContent>
        )}

        {/* Revenue Tab */}
        {accessibleTabs.includes('revenue') && (
          <TabsContent value="revenue" className="space-y-6">
            <RevenueChart data={revenueData} isLoading={revenueLoading} />
          </TabsContent>
        )}

        {/* Patients Tab */}
        {accessibleTabs.includes('patients') && (
          <TabsContent value="patients" className="space-y-6">
            <PatientDemographics data={patientsData} isLoading={patientsLoading} />
          </TabsContent>
        )}

        {/* Appointments Tab */}
        {accessibleTabs.includes('appointments') && (
          <TabsContent value="appointments" className="space-y-6">
            <AppointmentMetrics data={appointmentsData} isLoading={appointmentsLoading} />
          </TabsContent>
        )}

        {/* Services Tab */}
        {accessibleTabs.includes('services') && (
          <TabsContent value="services" className="space-y-6">
            <ServicePerformance data={servicesData} isLoading={servicesLoading} />
          </TabsContent>
        )}

        {/* Staff Tab */}
        {accessibleTabs.includes('staff') && (
          <TabsContent value="staff" className="space-y-6">
            <StaffProductivity data={staffData} isLoading={staffLoading} />
          </TabsContent>
        )}

        {/* Leads Tab */}
        {accessibleTabs.includes('leads') && (
          <TabsContent value="leads" className="space-y-6">
            <LeadFunnel data={leadsData} isLoading={leadsLoading} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
