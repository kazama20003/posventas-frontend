export const PRODUCT_TYPE_VALUES = ["PHYSICAL", "SERVICE"] as const
export const UNIT_OF_MEASURE_VALUES = [
  "UNIT",
  "KG",
  "G",
  "L",
  "ML",
  "M",
  "CM",
  "BOX",
  "PACK",
  "DOZEN",
] as const

export type ProductTypeValue = (typeof PRODUCT_TYPE_VALUES)[number]
export type UnitOfMeasureValue = (typeof UNIT_OF_MEASURE_VALUES)[number]

export interface ProductCategory {
  id: string | number
  name?: string
  parentId?: string | null
  [key: string]: unknown
}

export interface ProductImage {
  key: string
  url: string
}

export type VariantAttributeValue = string | number | boolean | null

export interface ProductVariant {
  id?: string
  sku: string
  barcode?: string | null
  unitOfMeasure?: UnitOfMeasureValue | null
  attributes?: Record<string, VariantAttributeValue> | null
  cost?: number | null
  [key: string]: unknown
}

export interface Product {
  id: string | number
  name: string
  description?: string | null
  categoryId?: string | null
  category?: ProductCategory | null
  images?: ProductImage[]
  variants?: ProductVariant[]
  salePrice?: number
  isActive?: boolean
  brand?: string | null
  trackStock?: boolean
  taxRate?: number
  minStock?: number
  productType?: ProductTypeValue | (string & {})
  visibleInPos?: boolean
  deletedAt?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreateProductInput {
  name: string
  description?: string | null
  categoryId?: string | null
  images?: ProductImage[]
  variants?: ProductVariant[]
  salePrice: number
  isActive?: boolean
  brand?: string | null
  trackStock?: boolean
  taxRate: number
  minStock?: number
  productType?: ProductTypeValue
  visibleInPos?: boolean
}

export interface UpdateProductInput {
  name?: string
  description?: string | null
  categoryId?: string | null
  images?: ProductImage[]
  variants?: ProductVariant[]
  salePrice?: number
  isActive?: boolean
  brand?: string | null
  trackStock?: boolean
  taxRate?: number
  minStock?: number
  productType?: ProductTypeValue
  visibleInPos?: boolean
}

export type ProductsListResponse = Product[]

export interface DeleteProductResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
