import { createCreateProductUseCase } from './create-product'
import type { ProductInput } from '@/features/products/domain/product'

const input: ProductInput = {
  name: ' Blue Mug ',
  nameEs: ' Taza azul ',
  sku: ' MUG-1 ',
  description: '  A blue mug  ',
  categoryId: 1,
  subcategoryId: null,
  price: 9.99,
  allergenIds: [3, 7],
}

it('normalizes product text before saving through the repository', async () => {
  const savedProduct = { id: 23 }
  const repository = { createProduct: vi.fn().mockResolvedValue(savedProduct) }
  const createProduct = createCreateProductUseCase(repository)

  await expect(createProduct(input)).resolves.toBe(savedProduct)

  expect(repository.createProduct).toHaveBeenCalledExactlyOnceWith({
    ...input,
    name: 'Blue Mug',
    nameEs: 'Taza azul',
    sku: 'MUG-1',
    description: 'A blue mug',
  })
})

it('converts an empty description to null and propagates repository failures', async () => {
  const failure = new Error('save failed')
  const repository = { createProduct: vi.fn().mockRejectedValue(failure) }
  const createProduct = createCreateProductUseCase(repository)

  await expect(createProduct({ ...input, description: '   ' })).rejects.toBe(failure)
  expect(repository.createProduct).toHaveBeenCalledExactlyOnceWith({
    ...input,
    name: 'Blue Mug',
    nameEs: 'Taza azul',
    sku: 'MUG-1',
    description: null,
  })
})
