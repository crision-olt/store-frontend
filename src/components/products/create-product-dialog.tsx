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
import { AllergensApiError, listAllergens, type Allergen } from '@/lib/allergens-api'
import { createProduct, updateProduct, listCategories, listSubcategories, ProductsApiError, type Category, type Product, type ProductInput, type Subcategory } from '@/lib/products-api'
import { buildLinkWithRedirect } from '@/lib/redirect'

function ProductForm({ categories, subcategories, allergens, initial, editing, pending, error, onSubmit }: {
  categories: Category[]
  subcategories: Subcategory[]
  allergens: Allergen[]
  initial: ProductInput | undefined
  editing: boolean
  pending: boolean
  error: unknown
  onSubmit: (input: ProductInput) => void
}) {
  const { t, i18n } = useLingui()
  const [categoryId, setCategoryId] = useState<number | null>(initial?.categoryId ?? null)
  const [subcategoryId, setSubcategoryId] = useState<number | null>(initial?.subcategoryId ?? null)
  const [allergenIds, setAllergenIds] = useState(initial?.allergenIds ?? [])
  const allergenName = (allergen: Allergen) => i18n.locale === 'es' ? allergen.nameEs : allergen.name

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
      allergenIds,
    })
  }

  return (
    <form onSubmit={submit} className="mt-5">
      <fieldset disabled={pending} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-name">{t`Name`}</Label>
          <Input id="product-name" name="name" defaultValue={initial?.name} required maxLength={255} pattern={'.*\\S.*'} autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-sku">{t`SKU`}</Label>
          <Input id="product-sku" name="sku" defaultValue={initial?.sku} required maxLength={64} pattern={'.*\\S.*'} autoComplete="off" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-description">{t`Description (optional)`}</Label>
          <textarea id="product-description" name="description" defaultValue={initial?.description ?? ''} maxLength={2000} rows={3}
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
            <Input id="product-price" name="price" type="number" defaultValue={initial?.price} min={0} max={99999999.99} step="0.01" required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="product-allergens">{t`Allergens (optional)`}</Label>
          <Select multiple value={allergenIds.map(String)} disabled={pending || allergens.length === 0}
            onValueChange={(values) => setAllergenIds(values.map(Number))}>
            <SelectTrigger id="product-allergens" className="w-full">
              <SelectValue>{t`Select allergens`}</SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {allergens.map((allergen) => <SelectItem key={allergen.id} value={String(allergen.id)}>
                {allergenName(allergen)}
              </SelectItem>)}
            </SelectContent>
          </Select>
          {allergenIds.length > 0 && (
            <ul role="list" className="flex flex-wrap gap-1.5 text-xs">
              {allergens.filter(({ id }) => allergenIds.includes(id)).map((allergen) => (
                <li key={allergen.id} className="rounded-md bg-muted px-2 py-1">{allergenName(allergen)}</li>
              ))}
            </ul>
          )}
        </div>
        {categories.length === 0 && <p role="alert" className="text-sm text-muted-foreground">{t`Create a category on the Categories page before adding products.`}</p>}
        {error ? <p role="alert" className="text-sm text-destructive">
          {error instanceof ProductsApiError && error.status === 409
            ? t`A product with this SKU already exists.`
            : error instanceof ProductsApiError && error.status === 400
              ? t`Check the product details, category, and allergens, then try again.`
              : editing && error instanceof ProductsApiError && error.status === 404
                ? t`This product no longer exists.`
                : editing ? t`Could not save the product. Please try again.` : t`Could not create the product. Please try again.`}
        </p> : null}
        <div className="flex justify-end gap-2">
          <Dialog.Close render={<Button type="button" variant="outline" />}>{t`Cancel`}</Dialog.Close>
          <Button type="submit" disabled={pending || categoryId === null}>
            {editing ? pending ? t`Saving…` : t`Save` : pending ? t`Creating product…` : t`Create product`}
          </Button>
        </div>
      </fieldset>
    </form>
  )
}

function ProductDialog({ product, onClose }: { product?: Product; onClose?: () => void }) {
  const { t } = useLingui()
  const [open, setOpen] = useState(product !== undefined)
  const queryClient = useQueryClient()
  const location = useLocation()
  const categories = useQuery({ queryKey: ['product-categories'], queryFn: listCategories, enabled: open, retry: false })
  const subcategories = useQuery({ queryKey: ['product-subcategories'], queryFn: () => listSubcategories(), enabled: open, retry: false })
  const allergens = useQuery({ queryKey: ['allergens'], queryFn: ({ signal }) => listAllergens(signal), enabled: open, retry: false })
  const save = useMutation({
    mutationKey: [product ? 'update-product' : 'create-product'],
    mutationFn: (input: ProductInput) => product ? updateProduct(product.id, input) : createProduct(input),
    onMutate: () => { if (!product) setOpen(false) },
    onSuccess: () => {
      if (product) {
        setOpen(false)
        onClose?.()
      }
    },
    onError: () => setOpen(true),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  })

  if ([categories.error, subcategories.error, allergens.error, save.error].some((error) =>
    (error instanceof ProductsApiError || error instanceof AllergensApiError) && error.status === 401,
  )) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => {
      if (save.isPending) return
      if (nextOpen) save.reset()
      setOpen(nextOpen)
      if (!nextOpen) onClose?.()
    }}>
      {!product && <Dialog.Trigger aria-disabled={save.isPending} aria-busy={save.isPending}
        render={<Button className="aria-disabled:opacity-50" />}>
        <PlusIcon aria-hidden="true" />{save.isPending ? t`Creating product…` : t`Create product`}
      </Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-background p-6 text-foreground shadow-lg outline-none">
          <Dialog.Title className="text-lg font-semibold">{product ? t`Edit product` : t`Create product`}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">{product ? t`Update the product details.` : t`Add a new product to your catalog.`}</Dialog.Description>
          {categories.isError || subcategories.isError || allergens.isError ? (
            <div className="mt-4 flex flex-col items-start gap-3">
              <p role="alert" className="text-sm text-destructive">{allergens.isError
                ? t`Could not load allergens.`
                : t`Could not load categories. Please try again.`}</p>
              <Button variant="outline" onClick={() => {
                void categories.refetch()
                void subcategories.refetch()
                void allergens.refetch()
              }}>{t`Try again`}</Button>
              <Dialog.Close render={<Button variant="outline" />}>{t`Cancel`}</Dialog.Close>
            </div>
          ) : categories.isPending || subcategories.isPending || allergens.isPending ? (
            <p role="status" className="mt-4 text-sm text-muted-foreground">{t`Loading product options…`}</p>
          ) : (
            <ProductForm categories={categories.data} subcategories={subcategories.data} allergens={allergens.data} initial={save.variables ?? product}
              editing={product !== undefined} pending={save.isPending} error={save.error} onSubmit={(input) => save.mutate(input)} />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function CreateProductDialog() {
  return <ProductDialog />
}

export function EditProductDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  return <ProductDialog product={product} onClose={onClose} />
}
