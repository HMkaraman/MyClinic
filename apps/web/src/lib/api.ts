const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem('auth-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.state?.accessToken || null;
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
    // Token persistence is handled by Zustand auth-store
  }

  getAccessToken() {
    return this.accessToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.accessToken || this.getStoredToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        message: 'An error occurred',
        statusCode: response.status,
      }));
      throw error;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth API
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  requires2FA?: boolean;
  tempToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    branchIds: string[];
    twoFactorEnabled: boolean;
  };
}

export interface Verify2FARequest {
  tempToken: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface Setup2FAResponse {
  qrCode: string;
  secret: string;
}

// Inventory Types
export interface InventoryCategory {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  parentId?: string;
  parent?: InventoryCategory;
  children?: InventoryCategory[];
  active: boolean;
  _count?: { items: number };
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  paymentTerms?: string;
  notes?: string;
  active: boolean;
  _count?: { items: number; purchaseOrders: number };
}

export interface InventoryItem {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  description?: string;
  categoryId?: string;
  category?: { id: string; name: string };
  supplierId?: string;
  supplier?: { id: string; name: string };
  unit: string;
  quantityInStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  costPrice?: number;
  sellingPrice?: number;
  expiryDate?: string;
  location?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  item?: InventoryItem;
  type: string;
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  unitCost?: number;
  reference?: string;
  notes?: string;
  createdById: string;
  createdBy?: { id: string; name: string };
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier?: Supplier;
  status: 'DRAFT' | 'APPROVED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  notes?: string;
  items?: PurchaseOrderItem[];
  createdAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  itemId: string;
  item?: InventoryItem;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  totalCost: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Inventory API
export const inventoryApi = {
  // Items
  getItems: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<InventoryItem>>(`/inventory/items${query}`);
  },
  getItem: (id: string) => api.get<InventoryItem>(`/inventory/items/${id}`),
  createItem: (data: Partial<InventoryItem>) => api.post<InventoryItem>('/inventory/items', data),
  updateItem: (id: string, data: Partial<InventoryItem>) => api.patch<InventoryItem>(`/inventory/items/${id}`, data),
  deleteItem: (id: string) => api.delete(`/inventory/items/${id}`),
  adjustStock: (id: string, data: { type: string; quantity: number; notes?: string }) =>
    api.post<InventoryItem>(`/inventory/items/${id}/adjust`, data),
  getMovements: (id: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<InventoryMovement>>(`/inventory/items/${id}/movements${query}`);
  },
  getLowStock: () => api.get<{ data: InventoryItem[] }>('/inventory/items?lowStock=true'),

  // Categories
  getCategories: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<InventoryCategory>>(`/inventory/categories${query}`);
  },
  getCategory: (id: string) => api.get<InventoryCategory>(`/inventory/categories/${id}`),
  createCategory: (data: Partial<InventoryCategory>) => api.post<InventoryCategory>('/inventory/categories', data),
  updateCategory: (id: string, data: Partial<InventoryCategory>) => api.patch<InventoryCategory>(`/inventory/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/inventory/categories/${id}`),

  // Suppliers
  getSuppliers: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<Supplier>>(`/inventory/suppliers${query}`);
  },
  getSupplier: (id: string) => api.get<Supplier>(`/inventory/suppliers/${id}`),
  createSupplier: (data: Partial<Supplier>) => api.post<Supplier>('/inventory/suppliers', data),
  updateSupplier: (id: string, data: Partial<Supplier>) => api.patch<Supplier>(`/inventory/suppliers/${id}`, data),
  deleteSupplier: (id: string) => api.delete(`/inventory/suppliers/${id}`),

  // Purchase Orders
  getPurchaseOrders: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<PurchaseOrder>>(`/inventory/purchase-orders${query}`);
  },
  getPurchaseOrder: (id: string) => api.get<PurchaseOrder>(`/inventory/purchase-orders/${id}`),
  createPurchaseOrder: (data: any) => api.post<PurchaseOrder>('/inventory/purchase-orders', data),
  updatePurchaseOrder: (id: string, data: any) => api.patch<PurchaseOrder>(`/inventory/purchase-orders/${id}`, data),
  approvePurchaseOrder: (id: string) => api.post<PurchaseOrder>(`/inventory/purchase-orders/${id}/approve`),
  receivePurchaseOrder: (id: string, data: any) => api.post<PurchaseOrder>(`/inventory/purchase-orders/${id}/receive`, data),
  cancelPurchaseOrder: (id: string) => api.post<PurchaseOrder>(`/inventory/purchase-orders/${id}/cancel`),
};

// Scheduling Types
export type TimeOffType = 'VACATION' | 'SICK' | 'PERSONAL' | 'OTHER';
export type TimeOffStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface ScheduleTemplate {
  id: string;
  name: string;
  description?: string;
  slots: ScheduleTemplateSlot[];
  createdAt: string;
}

export interface ScheduleTemplateSlot {
  id: string;
  templateId: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface WorkSchedule {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  branchId?: string;
  branch?: {
    id: string;
    name: string;
  };
  date: string;
  startTime?: string;
  endTime?: string;
  isWorkingDay: boolean;
  notes?: string;
  createdAt: string;
}

export interface TimeOffRequest {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  type: TimeOffType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: TimeOffStatus;
  approvedById?: string;
  approvedBy?: {
    id: string;
    name: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface StaffAvailability {
  userId: string;
  user: {
    id: string;
    name: string;
    role: string;
  };
  date: string;
  isAvailable: boolean;
  schedule?: WorkSchedule;
  timeOff?: TimeOffRequest;
}

// Scheduling API
export const schedulingApi = {
  // Schedule Templates
  getTemplates: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<ScheduleTemplate>>(`/scheduling/templates${query}`);
  },
  getTemplate: (id: string) => api.get<ScheduleTemplate>(`/scheduling/templates/${id}`),
  createTemplate: (data: Partial<ScheduleTemplate>) => api.post<ScheduleTemplate>('/scheduling/templates', data),
  updateTemplate: (id: string, data: Partial<ScheduleTemplate>) => api.patch<ScheduleTemplate>(`/scheduling/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/scheduling/templates/${id}`),

  // Work Schedules
  getSchedules: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<WorkSchedule>>(`/scheduling/schedules${query}`);
  },
  getSchedule: (id: string) => api.get<WorkSchedule>(`/scheduling/schedules/${id}`),
  createSchedule: (data: Partial<WorkSchedule>) => api.post<WorkSchedule>('/scheduling/schedules', data),
  updateSchedule: (id: string, data: Partial<WorkSchedule>) => api.patch<WorkSchedule>(`/scheduling/schedules/${id}`, data),
  deleteSchedule: (id: string) => api.delete(`/scheduling/schedules/${id}`),
  applyTemplate: (data: { templateId: string; userId: string; startDate: string; endDate: string }) =>
    api.post<{ created: number }>('/scheduling/schedules/apply-template', data),
  bulkCreate: (data: Partial<WorkSchedule>[]) =>
    api.post<{ created: number }>('/scheduling/schedules/bulk', data),

  // Time Off Requests
  getTimeOffRequests: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<TimeOffRequest>>(`/scheduling/time-off${query}`);
  },
  getTimeOffRequest: (id: string) => api.get<TimeOffRequest>(`/scheduling/time-off/${id}`),
  createTimeOffRequest: (data: Partial<TimeOffRequest>) => api.post<TimeOffRequest>('/scheduling/time-off', data),
  updateTimeOffRequest: (id: string, data: Partial<TimeOffRequest>) => api.patch<TimeOffRequest>(`/scheduling/time-off/${id}`, data),
  approveTimeOffRequest: (id: string) => api.post<TimeOffRequest>(`/scheduling/time-off/${id}/approve`),
  rejectTimeOffRequest: (id: string, reason?: string) => api.post<TimeOffRequest>(`/scheduling/time-off/${id}/reject`, { reason }),
  cancelTimeOffRequest: (id: string) => api.post<TimeOffRequest>(`/scheduling/time-off/${id}/cancel`),

  // Availability
  getAvailability: (params: { date?: string; startDate?: string; endDate?: string; userId?: string }) => {
    const query = '?' + new URLSearchParams(params as Record<string, string>).toString();
    return api.get<StaffAvailability[]>(`/scheduling/availability${query}`);
  },
  checkDoctorAvailability: (doctorId: string, date: string, startTime: string, endTime: string) =>
    api.get<{ available: boolean; reason?: string }>(
      `/scheduling/availability/doctor/${doctorId}?date=${date}&startTime=${startTime}&endTime=${endTime}`
    ),
};

// Integration Types
export type IntegrationProvider = 'TWILIO' | 'TWILIO_WHATSAPP' | 'STRIPE' | 'TAP' | 'HYPERPAY';
export type IntegrationType = 'SMS' | 'WHATSAPP' | 'PAYMENT';
export type IntegrationLogStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface IntegrationConfig {
  id: string;
  provider: IntegrationProvider;
  type: IntegrationType;
  isEnabled: boolean;
  isDefault: boolean;
  settings: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationLog {
  id: string;
  configId: string;
  config?: IntegrationConfig;
  action: string;
  status: IntegrationLogStatus;
  request?: Record<string, any>;
  response?: Record<string, any>;
  errorMessage?: string;
  createdAt: string;
}

export interface IntegrationTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
}

// Integrations API
export const integrationsApi = {
  // Configs
  getConfigs: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<{ data: IntegrationConfig[] }>(`/integrations/config${query}`);
  },
  getConfig: (id: string) => api.get<IntegrationConfig>(`/integrations/config/${id}`),
  createConfig: (data: Partial<IntegrationConfig>) =>
    api.post<IntegrationConfig>('/integrations/config', data),
  updateConfig: (id: string, data: Partial<IntegrationConfig>) =>
    api.patch<IntegrationConfig>(`/integrations/config/${id}`, data),
  deleteConfig: (id: string) => api.delete(`/integrations/config/${id}`),
  testConfig: (id: string) =>
    api.post<IntegrationTestResult>(`/integrations/config/${id}/test`),
  setDefault: (id: string) =>
    api.post<IntegrationConfig>(`/integrations/config/${id}/set-default`),

  // Logs
  getLogs: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get<PaginatedResponse<IntegrationLog>>(`/integrations/logs${query}`);
  },

  // SMS
  sendSMS: (data: { to: string; message: string }) =>
    api.post<{ success: boolean; messageId?: string }>('/integrations/sms/send', data),

  // WhatsApp
  sendWhatsApp: (data: { to: string; message: string; templateId?: string }) =>
    api.post<{ success: boolean; messageId?: string }>('/integrations/whatsapp/send', data),

  // Reminders
  getReminderSettings: () =>
    api.get<{ enabled: boolean; hoursBefore: number[]; smsEnabled: boolean; whatsappEnabled: boolean }>(
      '/integrations/reminders/settings'
    ),
  updateReminderSettings: (data: any) =>
    api.patch('/integrations/reminders/settings', data),
};

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  verify2FA: (data: Verify2FARequest) => api.post<LoginResponse>('/auth/2fa/verify-login', data),
  refreshToken: (data: RefreshTokenRequest) => api.post<LoginResponse>('/auth/refresh', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get<LoginResponse['user']>('/auth/me'),

  // 2FA Setup methods for ADMIN/MANAGER role enforcement
  setup2FA: async (setupToken: string): Promise<Setup2FAResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/2fa/setup-required`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${setupToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Failed to setup 2FA',
        statusCode: response.status,
      }));
      throw error;
    }

    return response.json();
  },

  verify2FASetup: async (setupToken: string, code: string): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/2fa/verify-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${setupToken}`,
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'Invalid verification code',
        statusCode: response.status,
      }));
      throw error;
    }

    return response.json();
  },
};
