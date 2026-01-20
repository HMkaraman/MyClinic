import type { PatientListParams } from '@/lib/patients-api';
import type { AppointmentListParams } from '@/lib/appointments-api';
import type { VisitListParams } from '@/lib/visits-api';
import type { InvoiceListParams } from '@/lib/invoices-api';
import type { UserListParams } from '@/lib/users-api';
import type { ServiceListParams } from '@/lib/services-api';

export const queryKeys = {
  // Patients
  patients: {
    all: ['patients'] as const,
    lists: () => [...queryKeys.patients.all, 'list'] as const,
    list: (params: PatientListParams) =>
      [...queryKeys.patients.lists(), params] as const,
    details: () => [...queryKeys.patients.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.patients.details(), id] as const,
  },

  // Appointments
  appointments: {
    all: ['appointments'] as const,
    lists: () => [...queryKeys.appointments.all, 'list'] as const,
    list: (params: AppointmentListParams) =>
      [...queryKeys.appointments.lists(), params] as const,
    details: () => [...queryKeys.appointments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.appointments.details(), id] as const,
    todayStats: () => [...queryKeys.appointments.all, 'todayStats'] as const,
    availableSlots: (doctorId: string, date: string) =>
      [...queryKeys.appointments.all, 'availableSlots', doctorId, date] as const,
  },

  // Visits
  visits: {
    all: ['visits'] as const,
    lists: () => [...queryKeys.visits.all, 'list'] as const,
    list: (params: VisitListParams) =>
      [...queryKeys.visits.lists(), params] as const,
    details: () => [...queryKeys.visits.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.visits.details(), id] as const,
    patientVisits: (patientId: string) =>
      [...queryKeys.visits.all, 'patient', patientId] as const,
    todayStats: () => [...queryKeys.visits.all, 'todayStats'] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (params: InvoiceListParams) =>
      [...queryKeys.invoices.lists(), params] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
    patientInvoices: (patientId: string) =>
      [...queryKeys.invoices.all, 'patient', patientId] as const,
    financeStats: () => [...queryKeys.invoices.all, 'financeStats'] as const,
    recentInvoices: () => [...queryKeys.invoices.all, 'recent'] as const,
    recentPayments: () => [...queryKeys.invoices.all, 'recentPayments'] as const,
  },

  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: UserListParams) =>
      [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    doctors: () => [...queryKeys.users.all, 'doctors'] as const,
  },

  // Services
  services: {
    all: ['services'] as const,
    lists: () => [...queryKeys.services.all, 'list'] as const,
    list: (params: ServiceListParams) =>
      [...queryKeys.services.lists(), params] as const,
    details: () => [...queryKeys.services.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.services.details(), id] as const,
    active: () => [...queryKeys.services.all, 'active'] as const,
  },

  // Inventory (using existing inventoryApi)
  inventory: {
    all: ['inventory'] as const,
    items: {
      all: () => [...queryKeys.inventory.all, 'items'] as const,
      lists: () => [...queryKeys.inventory.items.all(), 'list'] as const,
      list: (params: Record<string, string>) =>
        [...queryKeys.inventory.items.lists(), params] as const,
      details: () => [...queryKeys.inventory.items.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.inventory.items.details(), id] as const,
      lowStock: () => [...queryKeys.inventory.items.all(), 'lowStock'] as const,
    },
    categories: {
      all: () => [...queryKeys.inventory.all, 'categories'] as const,
      lists: () => [...queryKeys.inventory.categories.all(), 'list'] as const,
      list: (params?: Record<string, string>) =>
        [...queryKeys.inventory.categories.lists(), params] as const,
    },
    suppliers: {
      all: () => [...queryKeys.inventory.all, 'suppliers'] as const,
      lists: () => [...queryKeys.inventory.suppliers.all(), 'list'] as const,
      list: (params?: Record<string, string>) =>
        [...queryKeys.inventory.suppliers.lists(), params] as const,
    },
    purchaseOrders: {
      all: () => [...queryKeys.inventory.all, 'purchaseOrders'] as const,
      lists: () => [...queryKeys.inventory.purchaseOrders.all(), 'list'] as const,
      list: (params?: Record<string, string>) =>
        [...queryKeys.inventory.purchaseOrders.lists(), params] as const,
    },
  },

  // Scheduling (using existing schedulingApi)
  scheduling: {
    all: ['scheduling'] as const,
    templates: {
      all: () => [...queryKeys.scheduling.all, 'templates'] as const,
      lists: () => [...queryKeys.scheduling.templates.all(), 'list'] as const,
      list: (params?: Record<string, string>) =>
        [...queryKeys.scheduling.templates.lists(), params] as const,
    },
    schedules: {
      all: () => [...queryKeys.scheduling.all, 'schedules'] as const,
      lists: () => [...queryKeys.scheduling.schedules.all(), 'list'] as const,
      list: (params?: Record<string, string>) =>
        [...queryKeys.scheduling.schedules.lists(), params] as const,
    },
    timeOff: {
      all: () => [...queryKeys.scheduling.all, 'timeOff'] as const,
      lists: () => [...queryKeys.scheduling.timeOff.all(), 'list'] as const,
      list: (params?: Record<string, string>) =>
        [...queryKeys.scheduling.timeOff.lists(), params] as const,
    },
    availability: (params: Record<string, string>) =>
      [...queryKeys.scheduling.all, 'availability', params] as const,
  },

  // Analytics (using existing analyticsApi)
  analytics: {
    all: ['analytics'] as const,
    dashboard: (params?: Record<string, string>) =>
      [...queryKeys.analytics.all, 'dashboard', params] as const,
    revenue: (params?: Record<string, string>) =>
      [...queryKeys.analytics.all, 'revenue', params] as const,
    patients: (params?: Record<string, string>) =>
      [...queryKeys.analytics.all, 'patients', params] as const,
    appointments: (params?: Record<string, string>) =>
      [...queryKeys.analytics.all, 'appointments', params] as const,
  },
};
