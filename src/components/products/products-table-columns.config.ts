import type { I18n } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import type { SortableColumn } from '@/features/products/domain/catalog-types'

export function getProductColumnLabels(i18n: I18n): Record<SortableColumn, string> {
  return {
    name: i18n._(msg`Name`),
    sku: i18n._(msg`SKU`),
    category: i18n._(msg`Category`),
    subcategory: i18n._(msg`Subcategory`),
    price: i18n._(msg`Price`),
    created_at: i18n._(msg`Created`),
  }
}
