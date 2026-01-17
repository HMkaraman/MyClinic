/**
 * Common types used across the application
 */

// ===========================================
// Pagination
// ===========================================
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

// ===========================================
// API Response
// ===========================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ===========================================
// Timestamps
// ===========================================
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDelete {
  deletedAt: Date | null;
}

// ===========================================
// Multi-tenant
// ===========================================
export interface TenantEntity {
  tenantId: string;
}

export interface BranchEntity {
  branchId: string;
}

// ===========================================
// Audit
// ===========================================
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT';

export interface AuditContext {
  userId: string;
  userRole: string;
  tenantId: string;
  branchId?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

// ===========================================
// Languages
// ===========================================
export type SupportedLanguage = 'ar' | 'en' | 'ckb' | 'kmr';

export const RTL_LANGUAGES: SupportedLanguage[] = ['ar', 'ckb'];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  ar: 'العربية',
  en: 'English',
  ckb: 'کوردی سۆرانی',
  kmr: 'Kurmancî',
};
