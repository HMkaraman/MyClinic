import { BadRequestException } from '@nestjs/common';

/**
 * Validates that the sortBy parameter is in the allowed fields list.
 * This prevents SQL/NoSQL injection through dynamic orderBy clauses.
 */
export function validateSortBy<T extends string>(
  sortBy: string | undefined,
  allowedFields: readonly T[],
  defaultField: T,
): T {
  if (!sortBy) {
    return defaultField;
  }

  if (!allowedFields.includes(sortBy as T)) {
    throw new BadRequestException(
      `Invalid sortBy field: '${sortBy}'. Allowed fields: ${allowedFields.join(', ')}`,
    );
  }

  return sortBy as T;
}
