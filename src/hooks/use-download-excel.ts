import { useMutation } from '@tanstack/react-query'
import { downloadExcelUseCase } from '@/features/exports/download-excel'
import type { ExcelTable } from '@/features/exports/domain/excel-export'

export function useDownloadExcel() {
  return useMutation({
    mutationFn: ({ data, filename }: { data: ExcelTable; filename: string }) => downloadExcelUseCase(data, filename),
  })
}
