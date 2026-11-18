import { useLingui } from '@lingui/react/macro'
import { DownloadIcon } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import type { ProductTableRow } from '@/components/products/products-table-columns'
import { getProductColumnLabels } from '@/components/products/products-table-columns.config'
import type { DataTable } from '@/components/table/features'
import { Button } from '@/components/ui/button'
import { useDownloadExcel } from '@/hooks/use-download-excel'
import { ExportsApiError, type ExcelCell } from '@/lib/exports-api'
import { buildLinkWithRedirect } from '@/lib/redirect'

export function DownloadProductsButton({ table, disabled }: { table: DataTable<ProductTableRow>; disabled: boolean }) {
  const { t, i18n } = useLingui()
  const location = useLocation()
  const download = useDownloadExcel()

  if (download.error instanceof ExportsApiError && download.error.status === 401) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  const rows = table.getRowModel().rows
  const handleDownload = () => {
    const labels = Object.entries(getProductColumnLabels(i18n))
    const columns = [
      ...table.getStartVisibleLeafColumns(),
      ...table.getCenterVisibleLeafColumns(),
      ...table.getEndVisibleLeafColumns(),
    ].flatMap((column) => {
      const label = labels.find(([id]) => id === column.id)?.[1]
      return label === undefined ? [] : [{ column, label }]
    })
    download.mutate({
      data: {
        headers: columns.map(({ label }) => label),
        rows: rows.filter((row) => !row.original.isPending)
          .map((row) => columns.map(({ column }) => row.getValue<ExcelCell>(column.id))),
      },
      filename: `Products_${Date.now()}.xlsx`,
    })
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button type="button" variant="outline" size="sm"
        disabled={disabled || !rows.some((row) => !row.original.isPending) || download.isPending}
        aria-busy={download.isPending} onClick={handleDownload}>
        <DownloadIcon className="size-4" aria-hidden="true" />
        {download.isPending ? t`Preparing Excel…` : t`Download Excel`}
      </Button>
      {download.isError && <p role="alert" className="max-w-xs text-sm text-destructive">
        {t`Could not download Excel. Please try again.`}
      </p>}
    </div>
  )
}
