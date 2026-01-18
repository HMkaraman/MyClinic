'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { analyticsApi } from '@/lib/analytics-api';
import type { QueryAnalyticsParams } from '@/lib/analytics-api';

interface ExportButtonProps {
  reportType: string;
  params: QueryAnalyticsParams;
  disabled?: boolean;
}

export function ExportButton({ reportType, params, disabled }: ExportButtonProps) {
  const t = useTranslations('analytics');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      const data = await analyticsApi.exportReport(reportType, params, format);
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `${reportType}-report-${dateStr}`;

      if (format === 'csv') {
        exportAsCSV(data, filename);
      } else if (format === 'excel') {
        exportAsExcel(data, filename);
      } else if (format === 'pdf') {
        // PDF export would require a PDF library like pdfmake
        // For now, we'll show an alert
        alert('PDF export is not yet implemented. Please use CSV or Excel.');
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = (data: unknown, filename: string) => {
    const csvContent = convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${filename}.csv`);
  };

  const exportAsExcel = (data: unknown, filename: string) => {
    const worksheet = XLSX.utils.json_to_sheet(flattenData(data));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, reportType);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const convertToCSV = (data: unknown): string => {
    const flatData = flattenData(data);
    if (flatData.length === 0) return '';

    const firstItem = flatData[0];
    if (!firstItem) return '';
    const headers = Object.keys(firstItem);
    const rows = flatData.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  };

  const flattenData = (data: unknown): Record<string, unknown>[] => {
    if (Array.isArray(data)) {
      return data.map((item) => flattenObject(item));
    }
    if (typeof data === 'object' && data !== null) {
      // Handle objects with nested arrays (like trend data)
      const obj = data as Record<string, unknown>;

      // Check if there's a trend or similar array
      for (const key of ['trend', 'services', 'staff', 'stages', 'byStatus', 'bySource']) {
        if (Array.isArray(obj[key])) {
          return (obj[key] as unknown[]).map((item) => flattenObject(item));
        }
      }

      return [flattenObject(obj)];
    }
    return [];
  };

  const flattenObject = (obj: unknown, prefix = ''): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    if (typeof obj !== 'object' || obj === null) {
      return result;
    }

    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const newKey = prefix ? `${prefix}_${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value, newKey));
      } else if (!Array.isArray(value)) {
        result[newKey] = value;
      }
    }

    return result;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || isExporting}>
          <Download className="me-2 h-4 w-4" />
          {isExporting ? t('export.exporting') : t('export.export')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="me-2 h-4 w-4" />
          {t('export.csv')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="me-2 h-4 w-4" />
          {t('export.excel')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled>
          <File className="me-2 h-4 w-4" />
          {t('export.pdf')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
