export { getApiErrorMessage } from "@/lib/api/client"
export {
  warehouseKeys,
  useCreateWarehouse,
  useDeleteWarehouse,
  useWarehouse,
  useWarehouses,
  useUpdateWarehouse,
} from "./hooks/use-warehouses"
export { warehousesService } from "./services/warehouses.service"
export type {
  CreateWarehouseInput,
  DeleteWarehouseResponse,
  UpdateWarehouseInput,
  Warehouse,
  WarehousesListResponse,
} from "./types"
