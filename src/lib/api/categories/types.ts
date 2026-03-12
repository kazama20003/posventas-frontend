export interface Category {
  id: string | number
  name: string
  parentId?: string | null
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface CreateCategoryInput {
  name: string
  parentId?: string | null
}

export interface UpdateCategoryInput {
  name?: string
  parentId?: string | null
}

export type CategoriesListResponse = Category[]

export interface DeleteCategoryResponse {
  ok?: boolean
  message?: string
  [key: string]: unknown
}
