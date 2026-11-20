import type { ExcelTable } from '@/features/exports/domain/excel-export'

export interface ExcelExportRepository {
  downloadExcel(table: ExcelTable, filename: string): Promise<void>
}
