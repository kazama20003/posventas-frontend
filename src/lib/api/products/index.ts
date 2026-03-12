export { getApiErrorMessage } from "@/lib/api/client"
export {
  productKeys,
  useCreateProduct,
  useDeleteProduct,
  useProduct,
  useProducts,
  useUpdateProduct,
} from "./hooks/use-products"
export { productsService } from "./services/products.service"
export type {
  CreateProductInput,
  DeleteProductResponse,
  Product,
  ProductCategory,
  ProductImage,
  ProductVariant,
  ProductTypeValue,
  ProductsListResponse,
  UnitOfMeasureValue,
  UpdateProductInput,
  VariantAttributeValue,
} from "./types"
export { PRODUCT_TYPE_VALUES, UNIT_OF_MEASURE_VALUES } from "./types"
