import { Gender, PatientSource } from '@prisma/client';

export interface PatientFactoryOptions {
  id?: string;
  tenantId?: string;
  branchId?: string;
  fileNumber?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  dateOfBirth?: Date | null;
  gender?: Gender | null;
  address?: string | null;
  medicalSummary?: Record<string, unknown> | null;
  source?: PatientSource;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export function createPatient(options: PatientFactoryOptions = {}) {
  const now = new Date();
  return {
    id: options.id ?? 'test-patient-id',
    tenantId: options.tenantId ?? 'test-tenant-id',
    branchId: options.branchId ?? 'test-branch-id',
    fileNumber: options.fileNumber ?? 'P-20260118-00001',
    name: options.name ?? 'Test Patient',
    phone: options.phone ?? '+1234567890',
    email: options.email ?? 'patient@example.com',
    dateOfBirth: options.dateOfBirth ?? new Date('1990-01-01'),
    gender: options.gender ?? Gender.MALE,
    address: options.address ?? '123 Test Street',
    medicalSummary: options.medicalSummary ?? null,
    source: options.source ?? PatientSource.WALK_IN,
    createdAt: options.createdAt ?? now,
    updatedAt: options.updatedAt ?? now,
    deletedAt: options.deletedAt ?? null,
    branch: {
      id: options.branchId ?? 'test-branch-id',
      name: 'Test Branch',
    },
  };
}

export function createMalePatient(options: PatientFactoryOptions = {}) {
  return createPatient({ ...options, gender: Gender.MALE });
}

export function createFemalePatient(options: PatientFactoryOptions = {}) {
  return createPatient({ ...options, gender: Gender.FEMALE });
}

export function createDeletedPatient(options: PatientFactoryOptions = {}) {
  return createPatient({ ...options, deletedAt: new Date() });
}

export function createPatientWithMedicalHistory(options: PatientFactoryOptions = {}) {
  return createPatient({
    ...options,
    medicalSummary: {
      allergies: ['Penicillin'],
      chronicConditions: ['Diabetes Type 2'],
      currentMedications: ['Metformin 500mg'],
      bloodType: 'O+',
    },
  });
}
