import type { ProductsQuery } from '@/features/products/domain/catalog-types'

export const Service = {
  Users: 'users',
  Roles: 'roles',
  Permissions: 'permissions',
  Products: 'products',
  Categories: 'product-categories',
  Subcategories: 'product-subcategories',
  Allergens: 'allergens',
  Offers: 'offers',
  Discounts: 'discounts',
  Tables: 'tables',
  Zones: 'zones',
  Auth: 'auth',
  Exports: 'exports',
} as const

export type Service = typeof Service[keyof typeof Service]

export const HttpMethod = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
} as const

export type HttpMethod = typeof HttpMethod[keyof typeof HttpMethod]

export const queryKeys = {
  users: [Service.Users, HttpMethod.GET],
  roles: [Service.Roles, HttpMethod.GET],
  permissions: [Service.Permissions, HttpMethod.GET],
  products: [Service.Products, HttpMethod.GET],
  productList: (query: Omit<ProductsQuery, 'page' | 'pageSize'>) =>
    [Service.Products, HttpMethod.GET, query] as const,
  offerCatalog: [Service.Products, HttpMethod.GET, 'offer-catalog'],
  categories: [Service.Categories, HttpMethod.GET],
  subcategories: [Service.Subcategories, HttpMethod.GET],
  subcategoryList: (category: string) => [Service.Subcategories, HttpMethod.GET, { category }] as const,
  allergens: [Service.Allergens, HttpMethod.GET],
  offers: [Service.Offers, HttpMethod.GET],
  discounts: [Service.Discounts, HttpMethod.GET],
  tables: [Service.Tables, HttpMethod.GET],
  zones: [Service.Zones, HttpMethod.GET],
  currentUser: [Service.Auth, HttpMethod.GET, 'me'],
} as const

export const mutationKeys = {
  createUser: [Service.Users, HttpMethod.POST],
  updateUser: [Service.Users, HttpMethod.PUT],
  blockUser: [Service.Users, HttpMethod.PUT, 'block'],
  unblockUser: [Service.Users, HttpMethod.DELETE, 'block'],
  createRole: [Service.Roles, HttpMethod.POST],
  updateRole: [Service.Roles, HttpMethod.PUT],
  deleteRole: [Service.Roles, HttpMethod.DELETE],
  createPermission: [Service.Permissions, HttpMethod.POST],
  updatePermission: [Service.Permissions, HttpMethod.PUT],
  deletePermission: [Service.Permissions, HttpMethod.DELETE],
  createProduct: [Service.Products, HttpMethod.POST],
  updateProduct: [Service.Products, HttpMethod.PUT],
  archiveProduct: [Service.Products, HttpMethod.POST, 'archive'],
  createCategory: [Service.Categories, HttpMethod.POST],
  updateCategory: [Service.Categories, HttpMethod.PUT],
  createSubcategory: [Service.Subcategories, HttpMethod.POST],
  updateSubcategory: [Service.Subcategories, HttpMethod.PUT],
  createOffer: [Service.Offers, HttpMethod.POST],
  updateOffer: [Service.Offers, HttpMethod.PUT],
  createDiscount: [Service.Discounts, HttpMethod.POST],
  updateDiscount: [Service.Discounts, HttpMethod.PUT],
  resizeTables: [Service.Tables, HttpMethod.PUT, 'count'],
  saveTable: [Service.Tables, HttpMethod.PUT, 'table'],
  createZone: [Service.Zones, HttpMethod.POST],
  updateZone: [Service.Zones, HttpMethod.PUT],
  login: [Service.Auth, HttpMethod.POST, 'login'],
  register: [Service.Auth, HttpMethod.POST, 'register'],
  logout: [Service.Auth, HttpMethod.POST, 'logout'],
  downloadExcel: [Service.Exports, HttpMethod.POST, 'xlsx'],
} as const
