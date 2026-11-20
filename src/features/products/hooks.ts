import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EndpointMutationOptions, EndpointQueryOptions } from '@/hooks/endpoint-options'
import {
  archiveProductUseCase,
  createCategoryUseCase,
  createSubcategoryUseCase,
  listAllProductsUseCase,
  listCategoriesUseCase,
  listSubcategoriesUseCase,
  updateCategoryUseCase,
  updateProductUseCase,
  updateSubcategoryUseCase,
} from '@/features/products/catalog'
import { createProductUseCase } from '@/features/products/create-product'
import type { ProductsQuery } from '@/features/products/domain/catalog-types'
import type { ProductInput } from '@/features/products/domain/product'
import { mutationKeys, queryKeys } from '@/lib/query-keys'

type ProductListData = Awaited<ReturnType<typeof listAllProductsUseCase>>
type CategoryInput = Parameters<typeof createCategoryUseCase>[0]
type SubcategoryInput = Parameters<typeof createSubcategoryUseCase>[0]
type UpdateCategoryInput = { id: number } & CategoryInput
type UpdateSubcategoryInput = { id: number; name: string; nameEs: string }

export function useProducts(
  query: Omit<ProductsQuery, 'page' | 'pageSize'>,
  options?: EndpointQueryOptions<ProductListData>,
) {
  return useQuery({
    ...options,
    queryKey: queryKeys.productList(query),
    queryFn: ({ signal }) => listAllProductsUseCase(query, signal),
  })
}

export function useCategories(options?: EndpointQueryOptions<Awaited<ReturnType<typeof listCategoriesUseCase>>>) {
  return useQuery({
    ...options,
    queryKey: queryKeys.categories,
    queryFn: listCategoriesUseCase,
  })
}

export function useSubcategories(
  category?: string,
  options?: EndpointQueryOptions<Awaited<ReturnType<typeof listSubcategoriesUseCase>>>,
) {
  return useQuery({
    ...options,
    queryKey: category === undefined ? queryKeys.subcategories : queryKeys.subcategoryList(category),
    queryFn: () => listSubcategoriesUseCase(category),
  })
}

export function useSaveProduct(
  productId: number | undefined,
  options?: EndpointMutationOptions<Awaited<ReturnType<typeof createProductUseCase>>, ProductInput>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: productId === undefined ? mutationKeys.createProduct : mutationKeys.updateProduct,
    mutationFn: (input: ProductInput) =>
      productId === undefined ? createProductUseCase(input) : updateProductUseCase(productId, input),
    onSettled: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products })
      await options?.onSettled?.(...args)
    },
  })
}

export function useArchiveProduct(
  productId: number,
  options?: EndpointMutationOptions<Awaited<ReturnType<typeof archiveProductUseCase>>>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: mutationKeys.archiveProduct,
    mutationFn: () => archiveProductUseCase(productId),
    onSuccess: async (...args) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products })
      await options?.onSuccess?.(...args)
    },
  })
}

export function useCreateCategory(
  options?: EndpointMutationOptions<Awaited<ReturnType<typeof createCategoryUseCase>>, CategoryInput>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: mutationKeys.createCategory,
    mutationFn: createCategoryUseCase,
    onSuccess: async (...args) => {
      await options?.onSuccess?.(...args)
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })
}

export function useUpdateCategory(
  options?: EndpointMutationOptions<Awaited<ReturnType<typeof updateCategoryUseCase>>, UpdateCategoryInput>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: mutationKeys.updateCategory,
    mutationFn: ({ id, ...input }: UpdateCategoryInput) => updateCategoryUseCase(id, input),
    onSuccess: async (...args) => {
      await options?.onSuccess?.(...args)
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories })
    },
  })
}

export function useCreateSubcategory(
  options?: EndpointMutationOptions<Awaited<ReturnType<typeof createSubcategoryUseCase>>, SubcategoryInput>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: mutationKeys.createSubcategory,
    mutationFn: createSubcategoryUseCase,
    onSuccess: async (...args) => {
      await options?.onSuccess?.(...args)
      await queryClient.invalidateQueries({ queryKey: queryKeys.subcategories })
    },
  })
}

export function useUpdateSubcategory(
  options?: EndpointMutationOptions<Awaited<ReturnType<typeof updateSubcategoryUseCase>>, UpdateSubcategoryInput>,
) {
  const queryClient = useQueryClient()
  return useMutation({
    ...options,
    mutationKey: mutationKeys.updateSubcategory,
    mutationFn: ({ id, ...input }: UpdateSubcategoryInput) => updateSubcategoryUseCase(id, input),
    onSuccess: async (...args) => {
      await options?.onSuccess?.(...args)
      await queryClient.invalidateQueries({ queryKey: queryKeys.subcategories })
    },
  })
}
