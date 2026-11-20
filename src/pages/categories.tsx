import { useLingui } from '@lingui/react/macro'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { RequireAuth } from '@/components/auth/require-auth'
import { StoreLayout } from '@/components/store-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  createCategoryUseCase, createSubcategoryUseCase, listCategoriesUseCase, listSubcategoriesUseCase,
  updateCategoryUseCase, updateSubcategoryUseCase,
} from '@/features/products/catalog'
import { getProductErrorStatus } from '@/features/products/application/error-status'
import type { Category, Subcategory } from '@/features/products/domain/catalog-types'
import { localizedName } from '@/lib/localized-name'
import { buildLinkWithRedirect } from '@/lib/redirect'

function CategoriesContent() {
  const { t, i18n } = useLingui()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [categoryName, setCategoryName] = useState('')
  const [categoryNameEs, setCategoryNameEs] = useState('')
  const [subcategoryName, setSubcategoryName] = useState('')
  const [subcategoryNameEs, setSubcategoryNameEs] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [editingCategory, setEditingCategory] = useState<Category>()
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [editingCategoryNameEs, setEditingCategoryNameEs] = useState('')
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory>()
  const [editingSubcategoryName, setEditingSubcategoryName] = useState('')
  const [editingSubcategoryNameEs, setEditingSubcategoryNameEs] = useState('')
  const categories = useQuery({ queryKey: ['product-categories'], queryFn: listCategoriesUseCase, retry: false })
  const subcategories = useQuery({ queryKey: ['product-subcategories'], queryFn: () => listSubcategoriesUseCase(), retry: false })
  const categoryMutation = useMutation({
    mutationFn: () => createCategoryUseCase({ name: categoryName.trim(), nameEs: categoryNameEs.trim() }),
    onSuccess: async () => {
      setCategoryName('')
      setCategoryNameEs('')
      await queryClient.invalidateQueries({ queryKey: ['product-categories'] })
    },
  })
  const subcategoryMutation = useMutation({
    mutationFn: () => createSubcategoryUseCase({
      name: subcategoryName.trim(), nameEs: subcategoryNameEs.trim(), categoryId: Number(categoryId),
    }),
    onSuccess: async () => {
      setSubcategoryName('')
      setSubcategoryNameEs('')
      await queryClient.invalidateQueries({ queryKey: ['product-subcategories'] })
    },
  })
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, name, nameEs }: { id: number; name: string; nameEs: string }) =>
      updateCategoryUseCase(id, { name, nameEs }),
    onSuccess: async () => {
      setEditingCategory(undefined)
      await queryClient.invalidateQueries({ queryKey: ['product-categories'] })
    },
  })
  const updateSubcategoryMutation = useMutation({
    mutationFn: (input: { id: number; name: string; nameEs: string }) =>
      updateSubcategoryUseCase(input.id, input),
    onSuccess: async () => {
      setEditingSubcategory(undefined)
      await queryClient.invalidateQueries({ queryKey: ['product-subcategories'] })
    },
  })

  const errors = [
    categories.error, subcategories.error, categoryMutation.error, subcategoryMutation.error,
    updateCategoryMutation.error, updateSubcategoryMutation.error,
  ]
  if (errors.some((error) => getProductErrorStatus(error) === 401)) {
    return <Navigate to={buildLinkWithRedirect('/login', location.pathname + location.search)} replace />
  }

  const submitCategory = (event: FormEvent) => {
    event.preventDefault()
    if (categoryName.trim() && categoryNameEs.trim()) categoryMutation.mutate()
  }
  const submitSubcategory = (event: FormEvent) => {
    event.preventDefault()
    if (subcategoryName.trim() && subcategoryNameEs.trim() && categoryId) subcategoryMutation.mutate()
  }
  const submitCategoryUpdate = (event: FormEvent) => {
    event.preventDefault()
    if (editingCategory && editingCategoryName.trim() && editingCategoryNameEs.trim()) {
      updateCategoryMutation.mutate({
        id: editingCategory.id, name: editingCategoryName.trim(), nameEs: editingCategoryNameEs.trim(),
      })
    }
  }
  const submitSubcategoryUpdate = (event: FormEvent) => {
    event.preventDefault()
    if (editingSubcategory && editingSubcategoryName.trim() && editingSubcategoryNameEs.trim()) {
      updateSubcategoryMutation.mutate({
        id: editingSubcategory.id, name: editingSubcategoryName.trim(),
        nameEs: editingSubcategoryNameEs.trim(),
      })
    }
  }
  const selectedCategory = categories.data?.find((category) => String(category.id) === categoryId)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t`Manage categories`}</h1>
          <p className="text-sm text-muted-foreground">{t`Create categories and assign subcategories to them.`}</p>
        </div>
        {(categories.isError || subcategories.isError) && (
          <p role="alert" className="text-sm text-destructive">{t`Could not load categories. Please try again.`}</p>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{t`Create category`}</CardTitle></CardHeader>
            <CardContent>
              <form className="flex flex-col gap-3" onSubmit={submitCategory}>
                <Label htmlFor="category-name">{t`Category name (English)`}</Label>
                <Input id="category-name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} maxLength={100} required />
                <Label htmlFor="category-name-es">{t`Category name (Spanish)`}</Label>
                <Input id="category-name-es" value={categoryNameEs} onChange={(event) => setCategoryNameEs(event.target.value)} maxLength={100} required />
                {categoryMutation.isError && <p role="alert" className="text-sm text-destructive">
                  {getProductErrorStatus(categoryMutation.error) === 409
                    ? t`This category already exists.` : t`Could not create category. Please try again.`}
                </p>}
                <Button type="submit" disabled={!categoryName.trim() || !categoryNameEs.trim() || categoryMutation.isPending}>{t`Create category`}</Button>
              </form>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t`Create subcategory`}</CardTitle></CardHeader>
            <CardContent>
              <form className="flex flex-col gap-3" onSubmit={submitSubcategory}>
                <Label htmlFor="subcategory-category">{t`Category`}</Label>
                <Select value={categoryId || null} onValueChange={(value) => setCategoryId(value ?? '')}>
                  <SelectTrigger id="subcategory-category" className="w-full">
                    <SelectValue>{selectedCategory
                      ? localizedName(selectedCategory.name, selectedCategory.nameEs, i18n.locale)
                      : t`Select a category`}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {categories.data?.map((category) => <SelectItem key={category.id} value={String(category.id)}>
                      {localizedName(category.name, category.nameEs, i18n.locale)}
                    </SelectItem>)}
                  </SelectContent>
                </Select>
                <Label htmlFor="subcategory-name">{t`Subcategory name (English)`}</Label>
                <Input id="subcategory-name" value={subcategoryName} onChange={(event) => setSubcategoryName(event.target.value)} maxLength={100} required />
                <Label htmlFor="subcategory-name-es">{t`Subcategory name (Spanish)`}</Label>
                <Input id="subcategory-name-es" value={subcategoryNameEs} onChange={(event) => setSubcategoryNameEs(event.target.value)} maxLength={100} required />
                {subcategoryMutation.isError && <p role="alert" className="text-sm text-destructive">
                  {getProductErrorStatus(subcategoryMutation.error) === 409
                    ? t`This subcategory already exists in the selected category.` : t`Could not create subcategory. Please try again.`}
                </p>}
                <Button type="submit" disabled={!subcategoryName.trim() || !subcategoryNameEs.trim() || !categoryId || subcategoryMutation.isPending}>{t`Create subcategory`}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>{t`Categories`}</CardTitle></CardHeader>
          <CardContent>
            {categories.isPending ? <p>{t`Loading categories…`}</p> : categories.data?.length === 0 ? (
              <p className="text-muted-foreground">{t`No categories yet.`}</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {categories.data?.map((category) => (
                  <li key={category.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{localizedName(category.name, category.nameEs, i18n.locale)}</p>
                    <Button type="button" size="sm" variant="outline" onClick={() => {
                      setEditingCategory(category)
                      setEditingCategoryName(category.name)
                      setEditingCategoryNameEs(category.nameEs ?? '')
                      updateCategoryMutation.reset()
                    }}>{t`Edit`}</Button>
                  </div>
                  {editingCategory?.id === category.id && (
                    <form className="my-3 flex flex-col gap-2" onSubmit={submitCategoryUpdate}>
                      <Label htmlFor={`edit-category-name-${category.id}`}>{t`Category name (English)`}</Label>
                      <Input id={`edit-category-name-${category.id}`} value={editingCategoryName}
                        onChange={(event) => setEditingCategoryName(event.target.value)} maxLength={100} required />
                      <Label htmlFor={`edit-category-name-es-${category.id}`}>{t`Category name (Spanish)`}</Label>
                      <Input id={`edit-category-name-es-${category.id}`} value={editingCategoryNameEs}
                        onChange={(event) => setEditingCategoryNameEs(event.target.value)} maxLength={100} required />
                      {updateCategoryMutation.isError && <p role="alert" className="text-sm text-destructive">{t`Could not update category. Please try again.`}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" disabled={!editingCategoryName.trim() || !editingCategoryNameEs.trim() || updateCategoryMutation.isPending}>{t`Save`}</Button>
                        <Button type="button" variant="outline" onClick={() => setEditingCategory(undefined)}>{t`Cancel`}</Button>
                      </div>
                    </form>
                  )}
                  <ul className="mt-2 flex flex-col gap-2 pl-4 text-sm text-muted-foreground">
                    {subcategories.data?.filter((item) => item.categoryId === category.id).map((item) => (
                      <li key={item.id}>
                        <div className="flex items-center justify-between gap-3">
                          <span>{localizedName(item.name, item.nameEs, i18n.locale)}</span>
                          <Button type="button" size="sm" variant="outline" onClick={() => {
                            setEditingSubcategory(item)
                            setEditingSubcategoryName(item.name)
                            setEditingSubcategoryNameEs(item.nameEs ?? '')
                            updateSubcategoryMutation.reset()
                          }}>{t`Edit`}</Button>
                        </div>
                        {editingSubcategory?.id === item.id && (
                          <form className="my-3 flex flex-col gap-2" onSubmit={submitSubcategoryUpdate}>
                            <Label htmlFor={`edit-subcategory-name-${item.id}`}>{t`Subcategory name (English)`}</Label>
                            <Input id={`edit-subcategory-name-${item.id}`} value={editingSubcategoryName}
                              onChange={(event) => setEditingSubcategoryName(event.target.value)} maxLength={100} required />
                            <Label htmlFor={`edit-subcategory-name-es-${item.id}`}>{t`Subcategory name (Spanish)`}</Label>
                            <Input id={`edit-subcategory-name-es-${item.id}`} value={editingSubcategoryNameEs}
                              onChange={(event) => setEditingSubcategoryNameEs(event.target.value)} maxLength={100} required />
                            {updateSubcategoryMutation.isError && <p role="alert" className="text-sm text-destructive">{t`Could not update subcategory. Please try again.`}</p>}
                            <div className="flex gap-2">
                              <Button type="submit" disabled={!editingSubcategoryName.trim() || !editingSubcategoryNameEs.trim() || updateSubcategoryMutation.isPending}>{t`Save`}</Button>
                              <Button type="button" variant="outline" onClick={() => setEditingSubcategory(undefined)}>{t`Cancel`}</Button>
                            </div>
                          </form>
                        )}
                      </li>
                    ))}
                    {subcategories.data?.every((item) => item.categoryId !== category.id) && <li>{t`No subcategories yet.`}</li>}
                  </ul>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
    </div>
  )
}

export function CategoriesPage() {
  return (
    <RequireAuth>
      <StoreLayout><CategoriesContent /></StoreLayout>
    </RequireAuth>
  )
}
