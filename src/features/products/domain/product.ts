export type Product = {
  id: number
  name: string
  nameEs: string | null
  description: string | null
  sku: string
  categoryId: number
  categoryName: string
  categoryNameEs: string | null
  subcategoryId: number | null
  subcategoryName: string | null
  subcategoryNameEs: string | null
  price: number
  allergenIds: number[]
  created_at: string
}

export type ProductInput = Pick<
  Product,
  'name' | 'description' | 'sku' | 'categoryId' | 'subcategoryId' | 'price' | 'allergenIds'
> & { nameEs: string }
