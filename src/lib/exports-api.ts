import { resolveServiceUrl } from '@/lib/http'

export type ExcelCell = string | number | boolean | null
export type ExcelTable = { headers: string[]; rows: ExcelCell[][] }
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

export class ExportsApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`Excel export failed with HTTP ${status}`)
    this.name = 'ExportsApiError'
    this.status = status
  }
}

export function createExportsApi(serviceUrl: string) {
  return {
    async downloadExcel(table: ExcelTable, filename: string) {
      const params = new URLSearchParams({ filename })
      const response = await fetch(resolveServiceUrl(serviceUrl, `/exports/xlsx?${params}`), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers: table.headers, rows: table.rows }),
      })
      if (!response.ok) throw new ExportsApiError(response.status)
      if (response.headers.get('content-type')?.split(';')[0] !== XLSX_TYPE) {
        throw new Error('Excel export returned an unexpected content type')
      }
      const url = URL.createObjectURL(await response.blob())
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      try {
        link.click()
      } finally {
        link.remove()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    },
  }
}

export const { downloadExcel } = createExportsApi(import.meta.env.AUTH_SERVICE_URL)
