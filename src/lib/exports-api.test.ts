// @vitest-environment jsdom
import { createExportsApi, ExportsApiError } from './exports-api'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Excel downloads', () => {
  it('posts headers before rows with cookies and releases the temporary download URL', async () => {
    vi.useFakeTimers()
    const blob = new Blob(['PK workbook'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const fetch = vi.fn().mockResolvedValue(new Response(blob, { headers: { 'Content-Type': blob.type } }))
    const createObjectURL = vi.fn().mockReturnValue('blob:excel-export')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createObjectURL
      static revokeObjectURL = revokeObjectURL
    })
    let download: HTMLAnchorElement | undefined
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      download = this
      expect(document.body.contains(this)).toBe(true)
    })
    const table = { headers: ['Product', 'Price'], rows: [['Mug', 12.5]] }
    await createExportsApi('https://api.example.com').downloadExcel(table, 'Products_123.xlsx')
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      'https://api.example.com/exports/xlsx?filename=Products_123.xlsx',
      {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(table),
      },
    )
    expect(download?.download).toBe('Products_123.xlsx')
    expect(download?.href).toBe('blob:excel-export')
    expect(download?.isConnected).toBe(false)
    expect(createObjectURL).toHaveBeenCalledOnce()
    await vi.runAllTimersAsync()
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:excel-export')
  })

  it('never downloads HTTP errors, unexpected content or interrupted responses', async () => {
    const createObjectURL = vi.fn()
    vi.stubGlobal('URL', class extends URL {
      static createObjectURL = createObjectURL
    })
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const api = createExportsApi('https://api.example.com')
    fetch.mockResolvedValueOnce(new Response('{}', { status: 401 }))
    await expect(api.downloadExcel({ headers: [], rows: [] }, 'Products_123.xlsx'))
      .rejects.toEqual(new ExportsApiError(401))
    fetch.mockResolvedValueOnce(new Response('<html>Error</html>', { headers: { 'Content-Type': 'text/html' } }))
    await expect(api.downloadExcel({ headers: [], rows: [] }, 'Products_123.xlsx')).rejects.toThrow()
    fetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      blob: vi.fn().mockRejectedValue(new Error('Download interrupted')),
    })
    await expect(api.downloadExcel({ headers: [], rows: [] }, 'Products_123.xlsx'))
      .rejects.toThrow('Download interrupted')
    expect(createObjectURL).not.toHaveBeenCalled()
  })
})
