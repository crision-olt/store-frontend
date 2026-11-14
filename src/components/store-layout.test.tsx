import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ThemeContext } from '@/providers/theme-context'
import { StoreLayout } from './store-layout'

function renderLayout(path: string) {
  i18n.activate('en')
  const queryClient = new QueryClient()
  return renderToStaticMarkup(
    <I18nProvider i18n={i18n}>
      <ThemeContext.Provider value={{ theme: 'dark', toggleTheme: () => {} }}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/products" element={<StoreLayout><div>Products content</div></StoreLayout>} />
              <Route path="/categories" element={<StoreLayout><div>Categories content</div></StoreLayout>} />
              <Route path="/access" element={<StoreLayout><div>Access content</div></StoreLayout>} />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      </ThemeContext.Provider>
    </I18nProvider>,
  )
}

describe('store navigation', () => {
  it.each([
    ['/products', 'Products content'],
    ['/categories', 'Categories content'],
    ['/access', 'Access content'],
  ])('links to the pages and marks %s as current', (path, content) => {
    const markup = renderLayout(path)

    expect(markup).toContain('href="/products"')
    expect(markup).toContain('href="/categories"')
    expect(markup).toContain('href="/access"')
    expect(markup).toMatch(new RegExp(`aria-current="page"[^>]*href="${path}"`))
    expect(markup).toContain(content)
    expect(markup).toContain('Sign out')
  })
})
