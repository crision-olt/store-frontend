import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StoreLayout } from './store-layout'

function renderLayout(path: string) {
  i18n.activate('en')
  const queryClient = new QueryClient()
  return renderToStaticMarkup(
    <I18nProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/products" element={<StoreLayout><div>Products content</div></StoreLayout>} />
            <Route path="/categories" element={<StoreLayout><div>Categories content</div></StoreLayout>} />
            <Route path="/allergens" element={<StoreLayout><div>Allergens content</div></StoreLayout>} />
            <Route path="/users" element={<StoreLayout><div>Users content</div></StoreLayout>} />
            <Route path="/access" element={<StoreLayout><div>Access content</div></StoreLayout>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </I18nProvider>,
  )
}

describe('store navigation', () => {
  it.each([
    ['/products', 'Products content'],
    ['/categories', 'Categories content'],
    ['/allergens', 'Allergens content'],
    ['/users', 'Users content'],
    ['/access', 'Access content'],
  ])('links to the pages and marks %s as current', (path, content) => {
    const markup = renderLayout(path)

    expect(markup).toContain('href="/products"')
    expect(markup).toContain('href="/categories"')
    expect(markup).toContain('href="/allergens"')
    expect(markup).toContain('href="/users"')
    expect(markup).toContain('href="/access"')
    expect(markup.indexOf('href="/users"')).toBeLessThan(markup.indexOf('href="/access"'))
    expect(markup).toMatch(new RegExp(`aria-current="page"[^>]*href="${path}"`))
    expect(markup).toContain(content)
    expect(markup).toContain('Sign out')
    expect(markup).not.toContain('Switch to light mode')
    expect(markup).not.toContain('Switch to dark mode')
  })
})
