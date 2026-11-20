import { useMutation } from '@tanstack/react-query'
import { downloadExcelUseCase } from '@/features/exports/download-excel'
import type { ExcelTable } from '@/features/exports/domain/excel-export'
import { mutationKeys } from '@/lib/query-keys'

export function useDownloadExcel() {
  return useMutation({
    mutationKey: mutationKeys.downloadExcel,
    mutationFn: ({ data, filename }: { data: ExcelTable; filename: string }) => downloadExcelUseCase(data, filename),
  })
}
