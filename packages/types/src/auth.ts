/**
 * Authentication and Authorization types
 */

import type { Timestamps, TenantEntity } from './common';

// ===========================================
// Roles
// ===========================================
export const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  RECEPTION: 'RECEPTION',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  ACCOUNTANT: 'ACCOUNTANT',
  SUPPORT: 'SUPPORT',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Roles that require 2FA
export const SENSITIVE_ROLES: Role[] = ['ADMIN', 'MANAGER'];

// ===========================================
// Permissions
// ===========================================
export const PERMISSIONS = {
  // Patients
  PATIENT_VIEW: 'patient:view',
  PATIENT_CREATE: 'patient:create',
  PATIENT_UPDATE: 'patient:update',
  PATIENT_DELETE: 'patient:delete',
  PATIENT_MEDICAL_VIEW: 'patient:medical:view',
  PATIENT_MEDICAL_UPDATE: 'patient:medical:update',

  // Appointments
  APPOINTMENT_VIEW: 'appointment:view',
  APPOINTMENT_CREATE: 'appointment:create',
  APPOINTMENT_UPDATE: 'appointment:update',
  APPOINTMENT_DELETE: 'appointment:delete',

  // Visits
  VISIT_VIEW: 'visit:view',
  VISIT_CREATE: 'visit:create',
  VISIT_UPDATE: 'visit:update',

  // Finance
  INVOICE_VIEW: 'invoice:view',
  INVOICE_CREATE: 'invoice:create',
  INVOICE_UPDATE: 'invoice:update',
  PAYMENT_CREATE: 'payment:create',
  EXPENSE_VIEW: 'expense:view',
  EXPENSE_CREATE: 'expense:create',
  REPORT_VIEW: 'report:view',

  // Inbox
  CONVERSATION_VIEW: 'conversation:view',
  CONVERSATION_ASSIGN: 'conversation:assign',
  CONVERSATION_TAG: 'conversation:tag',
  MESSAGE_SEND: 'message:send',

  // CRM
  LEAD_VIEW: 'lead:view',
  LEAD_CREATE: 'lead:create',
  LEAD_UPDATE: 'lead:update',
  TASK_VIEW: 'task:view',
  TASK_CREATE: 'task:create',
  TASK_UPDATE: 'task:update',

  // Users
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',

  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',

  // Audit
  AUDIT_VIEW: 'audit:view',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ===========================================
// Role Permissions Mapping
// ===========================================
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: Object.values(PERMISSIONS),
  MANAGER: [
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.PATIENT_MEDICAL_VIEW,
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_DELETE,
    PERMISSIONS.VISIT_VIEW,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_CREATE,
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.CONVERSATION_VIEW,
    PERMISSIONS.CONVERSATION_ASSIGN,
    PERMISSIONS.CONVERSATION_TAG,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.LEAD_CREATE,
    PERMISSIONS.LEAD_UPDATE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
  ],
  RECEPTION: [
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.PATIENT_UPDATE,
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.CONVERSATION_VIEW,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
  ],
  DOCTOR: [
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_MEDICAL_VIEW,
    PERMISSIONS.PATIENT_MEDICAL_UPDATE,
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.VISIT_VIEW,
    PERMISSIONS.VISIT_CREATE,
    PERMISSIONS.VISIT_UPDATE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
  ],
  NURSE: [
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_MEDICAL_VIEW,
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.VISIT_VIEW,
    PERMISSIONS.VISIT_CREATE,
    PERMISSIONS.TASK_VIEW,
  ],
  ACCOUNTANT: [
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.INVOICE_VIEW,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.EXPENSE_VIEW,
    PERMISSIONS.EXPENSE_CREATE,
    PERMISSIONS.REPORT_VIEW,
  ],
  SUPPORT: [
    PERMISSIONS.PATIENT_VIEW,
    PERMISSIONS.PATIENT_CREATE,
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.CONVERSATION_VIEW,
    PERMISSIONS.CONVERSATION_ASSIGN,
    PERMISSIONS.CONVERSATION_TAG,
    PERMISSIONS.MESSAGE_SEND,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.LEAD_CREATE,
    PERMISSIONS.LEAD_UPDATE,
    PERMISSIONS.TASK_VIEW,
    PERMISSIONS.TASK_CREATE,
    PERMISSIONS.TASK_UPDATE,
  ],
};

// ===========================================
// User
// ===========================================
export interface User extends Timestamps, TenantEntity {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: Role;
  branchIds: string[];
  twoFactorEnabled: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  language: 'ar' | 'en' | 'ckb' | 'kmr';
  lastLoginAt?: Date;
}

export interface UserSession {
  userId: string;
  tenantId: string;
  role: Role;
  branchIds: string[];
  permissions: Permission[];
}

// ===========================================
// JWT Tokens
// ===========================================
export interface JwtPayload {
  sub: string; // userId
  tenantId: string;
  role: Role;
  branchIds: string[];
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ===========================================
// Login
// ===========================================
export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
}

export interface LoginResponse {
  user: Omit<User, 'passwordHash'>;
  tokens: TokenPair;
  requires2FA?: boolean;
}
