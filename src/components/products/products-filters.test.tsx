import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { emptyFilters } from '@/lib/product-filters'
import { ProductsFilters } from './products-filters'

describe('subcategory filter labels', () => {
  it('identifies the parent when subcategories from different categories have the same name', () => {
    i18n.activate('en')
    const render = (category: string) => renderToStaticMarkup(
      <I18nProvider i18n={i18n}>
        <ProductsFilters
          filters={{ ...emptyFilters, category, subcategory: '2' }}
          categories={[{ id: 1, name: 'Kitchen' }, { id: 3, name: 'Office' }]}
          subcategories={[{ id: 2, name: 'Mugs', categoryId: 1 }, { id: 4, name: 'Mugs', categoryId: 3 }]}
          onChange={() => {}}
        />
      </I18nProvider>,
    )
    expect(render('')).toContain('Mugs (Kitchen)')
    expect(render('1')).not.toContain('Mugs (Kitchen)')
  })
})
