export { getApiErrorMessage } from "@/lib/api/client"
export {
  customerKeys,
  useCreateCustomer,
  useCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "./hooks/use-customers"
export { customersService } from "./services/customers.service"
export type {
  CreateCustomerInput,
  Customer,
  CustomerAddress,
  CustomersListResponse,
  DeleteCustomerResponse,
  UpdateCustomerInput,
} from "./types"
