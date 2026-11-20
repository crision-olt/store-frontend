import { downloadExcel } from '@/lib/exports-api'
import type { ExcelExportRepository } from '@/features/exports/domain/excel-export-repository'

export class ExportsApiAdapter implements ExcelExportRepository {
  downloadExcel = downloadExcel
}
