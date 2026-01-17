import { SetMetadata } from '@nestjs/common';

export interface AuditMetadata {
  action: string;
  entityType: string;
  // Optional: specify how to extract entityId from request
  entityIdParam?: string;
  // Optional: capture before state (useful for updates/deletes)
  captureBeforeState?: boolean;
}

export const AUDIT_KEY = 'audit_metadata';

export const Audit = (metadata: AuditMetadata) =>
  SetMetadata(AUDIT_KEY, metadata);
