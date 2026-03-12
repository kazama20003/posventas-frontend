import { apiClient } from "@/lib/api/client"
import type {
  CreateProductInput,
  DeleteProductResponse,
  Product,
  ProductsListResponse,
  UpdateProductInput,
} from "../types"

const PRODUCTS_ENDPOINTS = {
  list: "/products",
  byId: (id: string | number) => `/products/${id}`,
} as const

export const productsService = {
  create: async (payload: CreateProductInput) => {
    const { data } = await apiClient.post<Product>(PRODUCTS_ENDPOINTS.list, payload)
    return data
  },

  list: async () => {
    const { data } = await apiClient.get<ProductsListResponse>(PRODUCTS_ENDPOINTS.list)
    return data
  },

  getById: async (id: string | number) => {
    const { data } = await apiClient.get<Product>(PRODUCTS_ENDPOINTS.byId(id))
    return data
  },

  update: async (id: string | number, payload: UpdateProductInput) => {
    const { data } = await apiClient.patch<Product>(PRODUCTS_ENDPOINTS.byId(id), payload)
    return data
  },

  remove: async (id: string | number) => {
    const { data } = await apiClient.delete<DeleteProductResponse>(PRODUCTS_ENDPOINTS.byId(id))
    return data
  },
}
