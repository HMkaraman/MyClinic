import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import {
  invoicesApi,
  type Invoice,
  type InvoiceListParams,
  type InvoiceStatus,
  type Payment,
  type PaymentMethod,
  type CreateInvoiceDto,
  type AddPaymentDto,
} from '@/lib/invoices-api';

export function useInvoices(params: InvoiceListParams = {}) {
  return useQuery({
    queryKey: queryKeys.invoices.list(params),
    queryFn: () => invoicesApi.getInvoices(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: queryKeys.invoices.detail(id),
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: !!id,
  });
}

export function usePatientInvoices(
  patientId: string,
  params: Omit<InvoiceListParams, 'patientId'> = {}
) {
  return useQuery({
    queryKey: queryKeys.invoices.patientInvoices(patientId),
    queryFn: () => invoicesApi.getPatientInvoices(patientId, params),
    enabled: !!patientId,
  });
}

export function useFinanceStats() {
  return useQuery({
    queryKey: queryKeys.invoices.financeStats(),
    queryFn: () => invoicesApi.getFinanceStats(),
  });
}

export function useRecentInvoices(limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.invoices.recentInvoices(),
    queryFn: () => invoicesApi.getRecentInvoices(limit),
  });
}

export function useRecentPayments(limit: number = 5) {
  return useQuery({
    queryKey: queryKeys.invoices.recentPayments(),
    queryFn: () => invoicesApi.getRecentPayments(limit),
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceDto) => invoicesApi.createInvoice(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.financeStats(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.recentInvoices(),
      });
      if (variables.patientId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.invoices.patientInvoices(variables.patientId),
        });
      }
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateInvoiceDto>;
    }) => invoicesApi.updateInvoice(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.financeStats(),
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoicesApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.financeStats(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.recentInvoices(),
      });
    },
  });
}

export function useAddPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: AddPaymentDto }) =>
      invoicesApi.addPayment(invoiceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invoices.lists() });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.detail(variables.invoiceId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.financeStats(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.invoices.recentPayments(),
      });
    },
  });
}

export type {
  Invoice,
  InvoiceListParams,
  InvoiceStatus,
  Payment,
  PaymentMethod,
  CreateInvoiceDto,
  AddPaymentDto,
};
