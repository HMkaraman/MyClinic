/**
 * Patient and Medical Records types
 */

import type { Timestamps, SoftDelete, TenantEntity, BranchEntity } from './common';

// ===========================================
// Patient
// ===========================================
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type PatientSource =
  | 'WALK_IN'
  | 'REFERRAL'
  | 'WEBSITE'
  | 'WHATSAPP'
  | 'SOCIAL_MEDIA'
  | 'PHONE'
  | 'OTHER';

export interface MedicalSummary {
  allergies?: string[];
  chronicDiseases?: string[];
  currentMedications?: string[];
  bloodType?: string;
  notes?: string;
}

export interface Patient extends Timestamps, SoftDelete, TenantEntity, BranchEntity {
  id: string;
  fileNumber: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  address?: string;
  medicalSummary?: MedicalSummary;
  source: PatientSource;
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  address?: string;
  source?: PatientSource;
}

export interface UpdatePatientInput extends Partial<CreatePatientInput> {
  medicalSummary?: MedicalSummary;
}

// ===========================================
// Visit
// ===========================================
export interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface Visit extends Timestamps, BranchEntity {
  id: string;
  patientId: string;
  appointmentId?: string;
  doctorId: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentNotes?: string;
  prescriptions?: Prescription[];
}

export interface CreateVisitInput {
  patientId: string;
  appointmentId?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  treatmentNotes?: string;
  prescriptions?: Prescription[];
}

// ===========================================
// Attachment
// ===========================================
export type AttachmentEntityType =
  | 'PATIENT'
  | 'VISIT'
  | 'APPOINTMENT'
  | 'INVOICE'
  | 'CONVERSATION'
  | 'COMMENT';

export interface Attachment extends Timestamps {
  id: string;
  entityType: AttachmentEntityType;
  entityId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
}
