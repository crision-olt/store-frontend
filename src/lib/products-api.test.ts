import { createProductsApi, ProductsApiError } from './products-api'

const product = {
  id: 1,
  name: 'Blue Mug',
  nameEs: 'Taza azul',
  description: null,
  sku: 'MUG-1',
  categoryId: 1,
  categoryName: 'Kitchen',
  categoryNameEs: 'Cocina',
  subcategoryId: 2,
  subcategoryName: 'Mugs',
  subcategoryNameEs: 'Tazas',
  allergenIds: [],
  price: 9.99,
  created_at: '2026-01-01T00:00:00.000Z',
}
const page = { data: [product], total: 1, page: 2, pageSize: 10 }

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('products API', () => {
  it('archives a product with cookies and accepts an empty success response', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    const api = createProductsApi('https://api.example.com')
    await expect(api.archiveProduct(1)).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/products/1/archive', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }, body: '{}',
    })
    fetch.mockResolvedValueOnce(new Response(null, { status: 401 }))
    await expect(api.archiveProduct(1)).rejects.toMatchObject({ status: 401 })
  })

  it('updates the chosen product with cookies and validates the server response', async () => {
    const input = {
      name: 'New mug', nameEs: 'Taza nueva', sku: 'MUG-2', description: null,
      categoryId: 1, subcategoryId: null, price: 0, allergenIds: [7],
    }
    const updated = { ...product, ...input, subcategoryName: null }
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(updated)))
    vi.stubGlobal('fetch', fetch)
    const api = createProductsApi('https://api.example.com')
    await expect(api.updateProduct(1, input)).resolves.toEqual(updated)
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/products/1', {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    fetch.mockResolvedValueOnce(new Response(null, { status: 409 }))
    await expect(api.updateProduct(1, input)).rejects.toMatchObject({ status: 409 })
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 })))
    await expect(api.updateProduct(1, input)).rejects.toThrow()
  })

  it('creates a product with cookies and validates the returned product', async () => {
    const input = {
      name: 'Blue Mug', nameEs: 'Taza azul', sku: 'MUG-1', description: null,
      categoryId: 1, subcategoryId: 2, price: 9.99, allergenIds: [],
    }
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(product), { status: 201 }))
    vi.stubGlobal('fetch', fetch)
    const api = createProductsApi('https://api.example.com')

    await expect(api.createProduct(input)).resolves.toEqual(product)
    expect(fetch).toHaveBeenCalledWith('https://api.example.com/products', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    fetch.mockResolvedValueOnce(new Response(null, { status: 409 }))
    await expect(api.createProduct(input)).rejects.toMatchObject({ status: 409 })
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 })))
    await expect(api.createProduct(input)).rejects.toThrow()
  })

  it('sends only the defined filters as query params, with cookies', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(page)))
    vi.stubGlobal('fetch', fetch)

    await expect(
      createProductsApi('https://api.example.com').listProducts({
        search: 'mug & more',
        category: undefined,
        subcategory: '2',
        minPrice: 0,
        sortBy: 'price',
        sortOrder: 'asc',
        page: 2,
      }),
    ).resolves.toEqual(page)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/products?search=mug+%26+more&subcategory=2&minPrice=0&sortBy=price&sortOrder=asc&page=2',
      { credentials: 'include' },
    )
  })

  it('sends category and subcategory selections as repeated query params', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(page)))
    vi.stubGlobal('fetch', fetch)

    await createProductsApi('https://api.example.com').listProducts({
      category: ['1', '3'],
      subcategory: ['2', '4'],
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/products?category=1&category=3&subcategory=2&subcategory=4',
      { credentials: 'include' },
    )
  })

  it('requests the bare collection when there are no filters', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(page)))
    vi.stubGlobal('fetch', fetch)

    await createProductsApi('https://api.example.com').listProducts()

    expect(fetch.mock.calls[0][0]).toBe('https://api.example.com/products')
  })

  it('loads all matching products across API pages', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ ...product, id: index + 1 }))
    const lastProduct = { ...product, id: 101 }
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: firstPage, total: 101, page: 1, pageSize: 100 })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: [lastProduct], total: 101, page: 2, pageSize: 100 })))
    vi.stubGlobal('fetch', fetch)

    await expect(createProductsApi('https://api.example.com').listAllProducts({ search: 'mug', sortBy: 'name' }))
      .resolves.toEqual([...firstPage, lastProduct])
    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example.com/products?search=mug&sortBy=name&page=1&pageSize=100',
      'https://api.example.com/products?search=mug&sortBy=name&page=2&pageSize=100',
    ])
  })

  it('fails rather than returning incomplete results when an API page is unexpectedly empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [], total: 1, page: 1, pageSize: 100 })),
    ))

    await expect(createProductsApi('https://api.example.com').listAllProducts()).rejects.toThrow()
  })

  it('passes cancellation to every page request and surfaces later request failures', async () => {
    const firstPage = Array.from({ length: 100 }, (_, index) => ({ ...product, id: index + 1 }))
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: firstPage, total: 101, page: 1, pageSize: 100 })))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
    vi.stubGlobal('fetch', fetch)
    const { signal } = new AbortController()

    await expect(createProductsApi('https://api.example.com').listAllProducts({}, signal)).rejects.toMatchObject({
      name: 'ProductsApiError',
      status: 401,
    })
    expect(fetch.mock.calls.map(([, options]) => options)).toEqual([
      { credentials: 'include', signal },
      { credentials: 'include', signal },
    ])
  })

  it('exposes unsuccessful HTTP statuses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 401 })))

    await expect(createProductsApi('https://api.example.com').listProducts()).rejects.toMatchObject({
      name: 'ProductsApiError',
      status: 401,
    } satisfies Partial<ProductsApiError>)
  })

  it('rejects a response that does not match the products contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [{ id: 1 }] }))))

    await expect(createProductsApi('https://api.example.com').listProducts()).rejects.toThrow()
  })

  it('lists subcategories, optionally within a category', async () => {
    const fetch = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify([
      { id: 2, name: 'Mugs', nameEs: 'Tazas', categoryId: 1 },
    ]))))
    vi.stubGlobal('fetch', fetch)
    const api = createProductsApi('https://api.example.com')

    await expect(api.listSubcategories('1')).resolves.toEqual([{ id: 2, name: 'Mugs', nameEs: 'Tazas', categoryId: 1 }])
    await api.listSubcategories()

    expect(fetch.mock.calls.map(([url]) => url)).toEqual([
      'https://api.example.com/products/subcategories?category=1',
      'https://api.example.com/products/subcategories',
    ])
  })

  it('lists categories', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([
      { id: 1, name: 'Kitchen', nameEs: 'Cocina' },
    ]))))

    await expect(createProductsApi('https://api.example.com').listCategories())
      .resolves.toEqual([{ id: 1, name: 'Kitchen', nameEs: 'Cocina' }])
  })

  it('creates categories and subcategories using their IDs', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, name: 'Kitchen', nameEs: 'Cocina' }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, name: 'Mugs', nameEs: 'Tazas', categoryId: 1 }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1, name: 'Kitchen', nameEs: 'Cocina' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 2, name: 'Mugs', nameEs: 'Tazas', categoryId: 1 })))
    vi.stubGlobal('fetch', fetch)
    const api = createProductsApi('https://api.example.com')
    await expect(api.createCategory({ name: 'Kitchen', nameEs: 'Cocina' }))
      .resolves.toEqual({ id: 1, name: 'Kitchen', nameEs: 'Cocina' })
    await expect(api.createSubcategory({ name: 'Mugs', nameEs: 'Tazas', categoryId: 1 }))
      .resolves.toEqual({ id: 2, name: 'Mugs', nameEs: 'Tazas', categoryId: 1 })
    await expect(api.updateCategory(1, { name: 'Kitchen', nameEs: 'Cocina' }))
      .resolves.toEqual({ id: 1, name: 'Kitchen', nameEs: 'Cocina' })
    await expect(api.updateSubcategory(2, { name: 'Mugs', nameEs: 'Tazas' }))
      .resolves.toEqual({ id: 2, name: 'Mugs', nameEs: 'Tazas', categoryId: 1 })
    expect(fetch.mock.calls.slice(2).map(([url]) => url)).toEqual([
      'https://api.example.com/products/categories/1',
      'https://api.example.com/products/subcategories/2',
    ])
    expect(fetch).toHaveBeenNthCalledWith(2, 'https://api.example.com/products/subcategories', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Mugs', nameEs: 'Tazas', categoryId: 1 }),
    })
  })
})
