import { Dialog } from '@base-ui/react/dialog'
import { useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlusIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createProduct, listCategories, listSubcategories, ProductsApiError, type Category, type ProductInput, type Subcategory } from '@/lib/products-api'
import { buildLinkWithRedirect } from '@/lib/redirect'

function ProductForm({ categories, subcategories, pending, error, onSubmit }: {
  categories: Category[]
  subcategories: Subcategory[]
  pending: boolean
  error: unknown
  onSubmit: (input: ProductInput) => void
}) {
  const { t } = useLingui()
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending || categoryId === null) return
    const data = new FormData(event.currentTarget)
    onSubmit({
      name: String(data.get('name')).trim(),
      sku: String(data.get('sku')).trim(),
      description: String(data.get('description')).trim() || null,
      categoryId,
      subcategoryId,
      price: Number(data.get('price')),
      stock: Number(data.get('stock')),
    })
  }

  return (
    <form onSubmit={submit} className="mt-5">
      <fieldset disabled={pending} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-name">{t`Name`}</Label>
          <Input id="product-name" name="name" required maxLength={255} pattern={'.*\\S.*'} autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-sku">{t`SKU`}</Label>
          <Input id="product-sku" name="sku" required maxLength={64} pattern={'.*\\S.*'} autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-description">{t`Description (optional)`}</Label>
          <textarea id="product-description" name="description" maxLength={2000} rows={3}
            className="w-full resize-y rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="product-category">{t`Category`}</Label>
            <Select value={categoryId === null ? null : String(categoryId)} disabled={pending}
              onValueChange={(value) => {
                setCategoryId(value ? Number(value) : null)
                setSubcategoryId(null)
              }}>
              <SelectTrigger id="product-category" className="w-full">
                <SelectValue>{categories.find((category) => category.id === categoryId)?.name ?? t`Select a category`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <Label htmlFor="product-subcategory">{t`Subcategory (optional)`}</Label>
            <Select value={subcategoryId === null ? '' : String(subcategoryId)} disabled={pending || categoryId === null}
              onValueChange={(value) => setSubcategoryId(value ? Number(value) : null)}>
              <SelectTrigger id="product-subcategory" className="w-full">
                <SelectValue>{subcategories.find((subcategory) => subcategory.id === subcategoryId)?.name ?? t`None`}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t`None`}</SelectItem>
                {subcategories.filter((subcategory) => subcategory.categoryId === categoryId).map((subcategory) =>
                  <SelectItem key={subcategory.id} value={String(subcategory.id)}>{subcategory.name}</SelectItem>,
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-price">{t`Price`}</Label>
            <Input id="product-price" name="price" type="number" min={0} max={99999999.99} step="0.01" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product-stock">{t`Stock`}</Label>
            <Input id="product-stock" name="stock" type="number" min={0} max={2147483647} step={1} defaultValue={0} required />
          </div>
        </div>
        {categories.length === 0 && <p role="alert" className="text-sm text-muted-foreground">{t`Create a category on the Categories page before adding products.`}</p>}
        {error ? <p role="alert" className="text-sm text-destructive">
          {error instanceof ProductsApiError && error.status === 409
            ? t`A product with this SKU already exists.`
            : error instanceof ProductsApiError && error.status === 400
              ? t`Check the product details and selected category, then try again.`
              : t`Could not create the product. Please try again.`}
        </p> : null}
        <div className="flex justify-end gap-2">
          <Dialog.Close render={<Button type="button" variant="outline" />}>{t`Cancel`}</Dialog.Close>
          <Button type="submit" disabled={pending || categoryId === null}>
            {pending ? t`Creating product…` : t`Create product`}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

export function CreateProductDialog() {
  const { t } = useLingui()
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const location = useLocation()
  const categories = useQuery({ queryKey: ['product-categories'], queryFn: listCategories, enabled: open, retry: false })
  const subcategories = useQuery({ queryKey: ['product-subcategories'], queryFn: () => listSubcategories(), enabled: open, retry: false })
  const create = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  if ([categories.error, subcategories.error, create.error].some((error) => error instanceof ProductsApiError && error.status === 401)) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => {
      if (create.isPending) return
      if (nextOpen) create.reset()
      setOpen(nextOpen)
    }}>
      <Dialog.Trigger render={<Button />}><PlusIcon aria-hidden="true" />{t`Create product`}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 text-foreground shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold">{t`Create product`}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">{t`Add a new product to your catalog.`}</Dialog.Description>
          {categories.isError || subcategories.isError ? (
            <div className="mt-4 flex flex-col items-start gap-3">
              <p role="alert" className="text-sm text-destructive">{t`Could not load categories. Please try again.`}</p>
              <Button variant="outline" onClick={() => {
                void categories.refetch()
                void subcategories.refetch()
              }}>{t`Try again`}</Button>
              <Dialog.Close render={<Button variant="outline" />}>{t`Cancel`}</Dialog.Close>
            </div>
          ) : categories.isPending || subcategories.isPending ? (
            <p role="status" className="mt-4 text-sm text-muted-foreground">{t`Loading categories…`}</p>
          ) : (
            <ProductForm categories={categories.data} subcategories={subcategories.data} pending={create.isPending}
              error={create.error} onSubmit={(input) => create.mutate(input)} />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
