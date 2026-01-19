import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import {
  inventoryApi,
  type InventoryItem,
  type InventoryCategory,
  type Supplier,
  type PurchaseOrder,
} from '@/lib/api';

export function useInventoryItems(params: Record<string, string> = {}) {
  return useQuery({
    queryKey: queryKeys.inventory.items.list(params),
    queryFn: () => inventoryApi.getItems(params),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: queryKeys.inventory.items.detail(id),
    queryFn: () => inventoryApi.getItem(id),
    enabled: !!id,
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: queryKeys.inventory.items.lowStock(),
    queryFn: () => inventoryApi.getLowStock(),
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<InventoryItem>) => inventoryApi.createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.items.lists(),
      });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InventoryItem> }) =>
      inventoryApi.updateItem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.items.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.items.detail(variables.id),
      });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.items.lists(),
      });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { type: string; quantity: number; notes?: string };
    }) => inventoryApi.adjustStock(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.items.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.items.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.items.lowStock(),
      });
    },
  });
}

// Categories
export function useInventoryCategories(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.inventory.categories.list(params),
    queryFn: () => inventoryApi.getCategories(params),
  });
}

export function useCreateInventoryCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<InventoryCategory>) =>
      inventoryApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.categories.lists(),
      });
    },
  });
}

// Suppliers
export function useSuppliers(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.inventory.suppliers.list(params),
    queryFn: () => inventoryApi.getSuppliers(params),
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Supplier>) => inventoryApi.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.suppliers.lists(),
      });
    },
  });
}

// Purchase Orders
export function usePurchaseOrders(params?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.inventory.purchaseOrders.list(params),
    queryFn: () => inventoryApi.getPurchaseOrders(params),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: [...queryKeys.inventory.purchaseOrders.all(), id],
    queryFn: () => inventoryApi.getPurchaseOrder(id),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => inventoryApi.createPurchaseOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.inventory.purchaseOrders.lists(),
      });
    },
  });
}

export type { InventoryItem, InventoryCategory, Supplier, PurchaseOrder };
