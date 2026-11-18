import {
  columnFiltersToProductFilters,
  emptyFilters,
  hasInvalidPriceRange,
  toProductsQuery,
} from './product-filters'

describe('product filters', () => {
  it('maps empty filters to an unfiltered query', () => {
    expect(toProductsQuery(emptyFilters)).toEqual({
      search: undefined,
      category: undefined,
      subcategory: undefined,
      minPrice: undefined,
      maxPrice: undefined,
    })
  })

  it('maps filled filters to API params', () => {
    expect(
      toProductsQuery({
        search: '  mug ',
        category: ['1'],
        subcategory: ['2'],
        minPrice: '0',
        maxPrice: '19.5',
      }),
    ).toEqual({
      search: 'mug',
      category: ['1'],
      subcategory: ['2'],
      minPrice: 0,
      maxPrice: 19.5,
    })
  })

  it('maps table column filters to product query filters', () => {
    expect(
      columnFiltersToProductFilters([
        { id: 'name', value: '  mug ' },
        { id: 'category', value: ['1', '3'] },
        { id: 'subcategory', value: ['2', '4'] },
        { id: 'price', value: { minPrice: '5', maxPrice: '20' } },
      ]),
    ).toEqual({
      search: '  mug ',
      category: ['1', '3'],
      subcategory: ['2', '4'],
      minPrice: '5',
      maxPrice: '20',
    })
  })

  it.each([
    [{ minPrice: '10', maxPrice: '5' }, true],
    [{ minPrice: '-1' }, true],
    [{ maxPrice: 'abc' }, true],
    [{ minPrice: '5', maxPrice: '5' }, false],
    [{ minPrice: '5' }, false],
  ])('detects invalid price ranges: %j', (prices, invalid) => {
    expect(hasInvalidPriceRange({ ...emptyFilters, ...prices })).toBe(invalid)
  })
})
