import { apiClient } from "@/lib/api/client"
import type {
  CategoriesListResponse,
  Category,
  CreateCategoryInput,
  DeleteCategoryResponse,
  UpdateCategoryInput,
} from "../types"

const CATEGORIES_ENDPOINTS = {
  list: "/categories",
  byId: (id: string | number) => `/categories/${id}`,
} as const

export const categoriesService = {
  create: async (payload: CreateCategoryInput) => {
    const { data } = await apiClient.post<Category>(CATEGORIES_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<CategoriesListResponse>(CATEGORIES_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<Category>(CATEGORIES_ENDPOINTS.byId(id))
    return data
  },

  update: async (id: string | number, payload: UpdateCategoryInput) => {
    const { data } = await apiClient.patch<Category>(CATEGORIES_ENDPOINTS.byId(id), payload)
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteCategoryResponse>(CATEGORIES_ENDPOINTS.byId(id))
    return data
  },
}
