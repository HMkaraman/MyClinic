import { Injectable } from '@nestjs/common';
import { SequenceType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SequencesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Atomically gets and increments the next value for a sequence.
   * Uses INSERT ... ON CONFLICT DO UPDATE for atomic increment (upsert pattern).
   */
  async getNextValue(
    tenantId: string,
    type: SequenceType,
    year?: number,
    month?: number,
  ): Promise<number> {
    // Use raw SQL for atomic increment with upsert
    const result = await this.prisma.$queryRaw<{ value: number }[]>`
      INSERT INTO "tenant_sequences" ("id", "tenant_id", "type", "year", "month", "value", "updated_at")
      VALUES (
        gen_random_uuid()::text,
        ${tenantId},
        ${type}::"SequenceType",
        ${year ?? null}::int,
        ${month ?? null}::int,
        1,
        NOW()
      )
      ON CONFLICT ("tenant_id", "type", "year", "month")
      DO UPDATE SET
        "value" = "tenant_sequences"."value" + 1,
        "updated_at" = NOW()
      RETURNING "value"
    `;

    return result[0].value;
  }

  /**
   * Generates a unique patient file number.
   * Format: P-YYYYMMDD-XXXXX (e.g., P-20260118-00001)
   */
  async generatePatientFileNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Get next sequence value for this tenant
    const sequence = await this.getNextValue(
      tenantId,
      SequenceType.PATIENT_FILE_NUMBER,
    );

    // Format date parts
    const dateStr =
      year.toString() +
      month.toString().padStart(2, '0') +
      day.toString().padStart(2, '0');

    // Format sequence with leading zeros
    const sequenceStr = sequence.toString().padStart(5, '0');

    return `P-${dateStr}-${sequenceStr}`;
  }

  /**
   * Generates a unique invoice number.
   * Format: INV-YYYYMM-XXXXX (e.g., INV-202601-00001)
   * Sequence resets each month.
   */
  async generateInvoiceNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Get next sequence value for this tenant and month
    const sequence = await this.getNextValue(
      tenantId,
      SequenceType.INVOICE_NUMBER,
      year,
      month,
    );

    // Format year-month
    const yearMonthStr = year.toString() + month.toString().padStart(2, '0');

    // Format sequence with leading zeros
    const sequenceStr = sequence.toString().padStart(5, '0');

    return `INV-${yearMonthStr}-${sequenceStr}`;
  }

  /**
   * Gets the current value of a sequence without incrementing it.
   * Useful for checking sequence state.
   */
  async getCurrentValue(
    tenantId: string,
    type: SequenceType,
    year?: number | null,
    month?: number | null,
  ): Promise<number> {
    const sequence = await this.prisma.tenantSequence.findUnique({
      where: {
        tenantId_type_year_month: {
          tenantId,
          type,
          year: year as number ?? null,
          month: month as number ?? null,
        },
      },
    });

    return sequence?.value ?? 0;
  }

  /**
   * Resets a sequence to a specific value.
   * Use with caution - mainly for testing or data migration.
   */
  async resetSequence(
    tenantId: string,
    type: SequenceType,
    value: number,
    year?: number | null,
    month?: number | null,
  ): Promise<void> {
    await this.prisma.tenantSequence.upsert({
      where: {
        tenantId_type_year_month: {
          tenantId,
          type,
          year: year as number ?? null,
          month: month as number ?? null,
        },
      },
      update: {
        value,
      },
      create: {
        tenantId,
        type,
        year: year ?? null,
        month: month ?? null,
        value,
      },
    });
  }
}
