import { createDownloadExcelUseCase } from '@/features/exports/application/download-excel'
import { ExportsApiAdapter } from '@/features/exports/infrastructure/exports-api-adapter'

export const downloadExcelUseCase = createDownloadExcelUseCase(new ExportsApiAdapter())
