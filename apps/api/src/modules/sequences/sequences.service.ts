import { Injectable } from '@nestjs/common';
import { Prisma, SequenceType } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SequencesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Atomically gets and increments the next value for a sequence.
   * Uses UPDATE first, then INSERT if no row exists.
   * This handles NULL values in year/month correctly (ON CONFLICT doesn't work with NULLs).
   */
  async getNextValue(
    tenantId: string,
    type: SequenceType,
    year?: number,
    month?: number,
  ): Promise<number> {
    const yearVal = year ?? null;
    const monthVal = month ?? null;
    // Use Prisma.raw for enum to avoid parameter casting issues
    const typeSql = Prisma.raw(`'${type}'::"SequenceType"`);

    // Try to update existing sequence first using IS NOT DISTINCT FROM for NULL comparison
    const updateResult = await this.prisma.$queryRaw<{ value: number }[]>`
      UPDATE "tenant_sequences"
      SET "value" = "value" + 1, "updated_at" = NOW()
      WHERE "tenant_id" = ${tenantId}
        AND "type" = ${typeSql}
        AND "year" IS NOT DISTINCT FROM ${yearVal}::int
        AND "month" IS NOT DISTINCT FROM ${monthVal}::int
      RETURNING "value"
    `;

    if (updateResult.length > 0) {
      return updateResult[0].value;
    }

    // If no row exists, insert a new one
    try {
      const insertResult = await this.prisma.$queryRaw<{ value: number }[]>`
        INSERT INTO "tenant_sequences" ("id", "tenant_id", "type", "year", "month", "value", "updated_at")
        VALUES (
          gen_random_uuid()::text,
          ${tenantId},
          ${typeSql},
          ${yearVal}::int,
          ${monthVal}::int,
          1,
          NOW()
        )
        RETURNING "value"
      `;
      return insertResult[0].value;
    } catch (error: unknown) {
      // Handle race condition: if insert fails due to unique constraint, retry update
      if (error instanceof Error && error.message.includes('unique constraint')) {
        const retryResult = await this.prisma.$queryRaw<{ value: number }[]>`
          UPDATE "tenant_sequences"
          SET "value" = "value" + 1, "updated_at" = NOW()
          WHERE "tenant_id" = ${tenantId}
            AND "type" = ${typeSql}
            AND "year" IS NOT DISTINCT FROM ${yearVal}::int
            AND "month" IS NOT DISTINCT FROM ${monthVal}::int
          RETURNING "value"
        `;
        if (retryResult.length > 0) {
          return retryResult[0].value;
        }
      }
      throw error;
    }
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
   * Generates a unique purchase order number.
   * Format: PO-YYYYMM-XXXXX (e.g., PO-202601-00001)
   * Sequence resets each month.
   */
  async generatePurchaseOrderNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Get next sequence value for this tenant and month
    const sequence = await this.getNextValue(
      tenantId,
      SequenceType.PURCHASE_ORDER_NUMBER,
      year,
      month,
    );

    // Format year-month
    const yearMonthStr = year.toString() + month.toString().padStart(2, '0');

    // Format sequence with leading zeros
    const sequenceStr = sequence.toString().padStart(5, '0');

    return `PO-${yearMonthStr}-${sequenceStr}`;
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
