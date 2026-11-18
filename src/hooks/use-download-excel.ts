import { useMutation } from '@tanstack/react-query'
import { downloadExcel, type ExcelTable } from '@/lib/exports-api'

export function useDownloadExcel() {
  return useMutation({
    mutationFn: ({ data, filename }: { data: ExcelTable; filename: string }) => downloadExcel(data, filename),
  })
}
