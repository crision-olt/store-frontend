import type { ExcelTable } from '@/features/exports/domain/excel-export'
import type { ExcelExportRepository } from '@/features/exports/domain/excel-export-repository'

export function createDownloadExcelUseCase(repository: ExcelExportRepository) {
  return (table: ExcelTable, filename: string) => repository.downloadExcel(table, filename)
}
