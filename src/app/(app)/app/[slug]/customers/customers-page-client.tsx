"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  ArrowUpRight,
  Download,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  Users,
  Wallet,
} from "lucide-react"

import {
  getApiErrorMessage,
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/lib/api/customers"
import type {
  CreateCustomerInput,
  Customer,
  CustomerAddress,
  UpdateCustomerInput,
} from "@/lib/api/customers"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

type CustomersPageClientProps = {
  slug: string
}

type CustomerFormValues = {
  name: string
  email: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

type CustomerFormErrors = Partial<Record<keyof CustomerFormValues, string>>

const defaultFormValues: CustomerFormValues = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeOptional(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function getPrimaryAddress(customer: Customer) {
  return customer.addresses?.[0]
}

function formatAddress(address?: CustomerAddress | null) {
  if (!address) return "Sin direccion registrada"

  const segments = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean)

  return segments.length > 0 ? segments.join(", ") : "Sin direccion registrada"
}

function getCustomerFormValues(customer: Customer): CustomerFormValues {
  const address = getPrimaryAddress(customer)

  return {
    name: String(customer.name ?? ""),
    email: String(customer.email ?? ""),
    phone: String(customer.phone ?? ""),
    addressLine1: String(address?.line1 ?? ""),
    addressLine2: String(address?.line2 ?? ""),
    city: String(address?.city ?? ""),
    state: String(address?.state ?? ""),
    postalCode: String(address?.postalCode ?? ""),
    country: String(address?.country ?? ""),
  }
}

function buildAddresses(values: CustomerFormValues) {
  const line1 = values.addressLine1.trim()
  if (!line1) return undefined

  return [
    {
      line1,
      line2: normalizeOptional(values.addressLine2),
      city: normalizeOptional(values.city),
      state: normalizeOptional(values.state),
      postalCode: normalizeOptional(values.postalCode),
      country: normalizeOptional(values.country),
    },
  ]
}

function validateCustomer(values: CustomerFormValues) {
  const errors: CustomerFormErrors = {}
  const name = values.name.trim()
  const email = values.email.trim()
  const phone = values.phone.trim()
  const line1 = values.addressLine1.trim()
  const line2 = values.addressLine2.trim()
  const city = values.city.trim()
  const state = values.state.trim()
  const postalCode = values.postalCode.trim()
  const country = values.country.trim()

  if (name.length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres."
  } else if (name.length > 160) {
    errors.name = "El nombre no puede superar 160 caracteres."
  }

  if (email.length > 0 && !emailPattern.test(email)) {
    errors.email = "Ingresa un correo valido."
  } else if (email.length > 160) {
    errors.email = "El correo no puede superar 160 caracteres."
  }

  if (phone.length > 20) {
    errors.phone = "El telefono no puede superar 20 caracteres."
  }

  if (line1.length > 0 && line1.length < 2) {
    errors.addressLine1 = "La direccion principal debe tener al menos 2 caracteres."
  } else if (line1.length > 180) {
    errors.addressLine1 = "La direccion principal no puede superar 180 caracteres."
  }

  if (line2.length > 180) {
    errors.addressLine2 = "La direccion secundaria no puede superar 180 caracteres."
  }

  if (city.length > 120) {
    errors.city = "La ciudad no puede superar 120 caracteres."
  }

  if (state.length > 120) {
    errors.state = "El estado no puede superar 120 caracteres."
  }

  if (postalCode.length > 20) {
    errors.postalCode = "El codigo postal no puede superar 20 caracteres."
  }

  if (country.length > 120) {
    errors.country = "El pais no puede superar 120 caracteres."
  }

  return errors
}

function toCreatePayload(values: CustomerFormValues): CreateCustomerInput {
  return {
    name: values.name.trim(),
    email: normalizeOptional(values.email),
    phone: normalizeOptional(values.phone),
    addresses: buildAddresses(values),
  }
}

function toUpdatePayload(values: CustomerFormValues): UpdateCustomerInput {
  return {
    name: values.name.trim(),
    email: normalizeOptional(values.email),
    phone: normalizeOptional(values.phone),
    addresses: buildAddresses(values),
  }
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  iconClass,
  hintClass,
}: {
  label: string
  value: string
  hint: string
  icon: ReactNode
  iconClass: string
  hintClass?: string
}) {
  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/95 dark:from-card/80 dark:to-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className={`text-xs font-medium ${hintClass ?? "text-muted-foreground"}`}>{hint}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${iconClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  title,
  description,
  onCreate,
}: {
  title: string
  description: string
  onCreate?: () => void
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-6 py-12 text-center">
      <Users className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onCreate ? (
        <Button className="mt-4 gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Crear primer cliente
        </Button>
      ) : null}
    </div>
  )
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{title}</p>
            <span className="text-sm font-semibold text-foreground">{value}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function CustomersPageClient({ slug }: CustomersPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formValues, setFormValues] = useState<CustomerFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<CustomerFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const customersQuery = useCustomers()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const customers = useMemo(() => customersQuery.data ?? [], [customersQuery.data])
  const filteredCustomers = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return customers

    return customers.filter((customer) => {
      const primaryAddress = getPrimaryAddress(customer)
      return [
        customer.name,
        customer.email,
        customer.phone,
        primaryAddress?.line1,
        primaryAddress?.city,
        primaryAddress?.state,
        primaryAddress?.country,
      ].some((value) => String(value ?? "").toLowerCase().includes(normalized))
    })
  }, [customers, search])

  const customersWithEmail = customers.filter((customer) =>
    Boolean(String(customer.email ?? "").trim())
  ).length
  const customersWithPhone = customers.filter((customer) =>
    Boolean(String(customer.phone ?? "").trim())
  ).length
  const customersWithAddress = customers.filter((customer) =>
    Boolean(getPrimaryAddress(customer)?.line1?.trim())
  ).length
  const averageAddresses =
    customers.length > 0
      ? customers.reduce((sum, customer) => sum + (customer.addresses?.length ?? 0), 0) /
        customers.length
      : 0
  const recentCustomers = useMemo(
    () =>
      [...customers]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 3),
    [customers]
  )

  function resetForm() {
    setEditingCustomer(null)
    setFormValues(defaultFormValues)
    setFormErrors({})
    setActionError(null)
  }

  function handleSheetOpenChange(nextOpen: boolean) {
    setSheetOpen(nextOpen)
    if (!nextOpen) resetForm()
  }

  function openCreateSheet() {
    resetForm()
    setSheetOpen(true)
  }

  function openEditSheet(customer: Customer) {
    setEditingCustomer(customer)
    setFormValues(getCustomerFormValues(customer))
    setFormErrors({})
    setActionError(null)
    setSheetOpen(true)
  }

  function handleFieldChange<K extends keyof CustomerFormValues>(
    field: K,
    value: CustomerFormValues[K]
  ) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateCustomer(formValues)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      if (editingCustomer) {
        await updateCustomer.mutateAsync({
          id: editingCustomer.id,
          payload: toUpdatePayload(formValues),
        })
      } else {
        await createCustomer.mutateAsync(toCreatePayload(formValues))
      }

      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar el cliente."))
    }
  }

  async function handleDelete(customer: Customer) {
    if (!window.confirm(`Eliminar el cliente "${customer.name}"?`)) return

    try {
      await deleteCustomer.mutateAsync(customer.id)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo eliminar el cliente."))
    }
  }

  const isSubmitting = createCustomer.isPending || updateCustomer.isPending

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Modulo de clientes
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Clientes y fidelizacion
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Administra la base de clientes de{" "}
                <span className="font-semibold text-foreground">{slug}</span>, centraliza
                datos de contacto y mantien limpio el padron comercial.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void customersQuery.refetch()}
              disabled={customersQuery.isFetching}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="outline" className="gap-2" disabled>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nuevo cliente
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Clientes registrados"
          value={String(customers.length)}
          hint={`${filteredCustomers.length} visibles con el filtro actual`}
          icon={<Users className="h-5 w-5 text-primary" />}
          iconClass="bg-primary/10"
        />
        <MetricCard
          label="Con correo"
          value={String(customersWithEmail)}
          hint={`${customers.length > 0 ? Math.round((customersWithEmail / customers.length) * 100) : 0}% de cobertura`}
          icon={<Mail className="h-5 w-5 text-blue-700 dark:text-blue-300" />}
          iconClass="bg-blue-100 dark:bg-blue-950/30"
          hintClass="text-blue-600 dark:text-blue-400"
        />
        <MetricCard
          label="Con telefono"
          value={String(customersWithPhone)}
          hint="Contactables para seguimiento comercial"
          icon={<Wallet className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />}
          iconClass="bg-emerald-100 dark:bg-emerald-950/30"
          hintClass="text-emerald-600 dark:text-emerald-400"
        />
        <MetricCard
          label="Con direccion"
          value={String(customersWithAddress)}
          hint={`${averageAddresses.toFixed(1)} direcciones promedio por cliente`}
          icon={<ArrowUpRight className="h-5 w-5 text-amber-700 dark:text-amber-300" />}
          iconClass="bg-amber-100 dark:bg-amber-950/30"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Base de clientes</CardTitle>
                <CardDescription>
                  Alta, edicion y consulta de clientes del tenant actual.
                </CardDescription>
              </div>

              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre, correo, telefono o direccion"
                  className="pl-9"
                />
              </div>
            </div>
            <Separator />
          </CardHeader>

          <CardContent className="pt-0">
            {actionError ? (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            {customersQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 rounded-xl" />
                ))}
              </div>
            ) : customersQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {getApiErrorMessage(customersQuery.error, "No se pudo cargar la lista de clientes.")}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <EmptyState
                title="No hay clientes para mostrar"
                description={
                  customers.length === 0
                    ? "Crea el primer cliente para empezar a registrar ventas y seguimiento."
                    : "Ajusta la busqueda para encontrar un cliente existente."
                }
                onCreate={customers.length === 0 ? openCreateSheet : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-3 font-medium">Cliente</th>
                      <th className="px-2 py-3 font-medium">Contacto</th>
                      <th className="px-2 py-3 font-medium">Direccion</th>
                      <th className="px-2 py-3 font-medium">Direcciones</th>
                      <th className="px-2 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => {
                      const primaryAddress = getPrimaryAddress(customer)

                      return (
                        <tr
                          key={String(customer.id)}
                          className="border-b border-border/50 last:border-0"
                        >
                          <td className="px-2 py-4">
                            <div className="flex items-start gap-3">
                              <Avatar>
                                <AvatarFallback className="font-semibold">
                                  {getInitials(customer.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">{customer.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ID {String(customer.id)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-4">
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <p className="inline-flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                {customer.email || "Sin correo"}
                              </p>
                              <p className="inline-flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5" />
                                {customer.phone || "Sin telefono"}
                              </p>
                            </div>
                          </td>
                          <td className="px-2 py-4 text-muted-foreground">
                            <span className="inline-flex items-start gap-1.5">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span>{formatAddress(primaryAddress)}</span>
                            </span>
                          </td>
                          <td className="px-2 py-4 font-medium">
                            {customer.addresses?.length ?? 0}
                          </td>
                          <td className="px-2 py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => openEditSheet(customer)}
                              >
                                <Pencil className="h-4 w-4" />
                                Editar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                                onClick={() => void handleDelete(customer)}
                                disabled={deleteCustomer.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <SummaryCard
            title="Con correo"
            value={String(customersWithEmail)}
            description="Clientes listos para comunicacion por email."
          />
          <SummaryCard
            title="Con direccion"
            value={String(customersWithAddress)}
            description="Registros con direccion principal cargada."
          />
          <Card>
            <CardHeader>
              <CardTitle>Recientes</CardTitle>
              <CardDescription>Ultimos clientes creados o actualizados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentCustomers.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">
                  Aun no existen clientes registrados.
                </div>
              ) : (
                recentCustomers.map((customer) => (
                  <div
                    key={`recent-${String(customer.id)}`}
                    className="rounded-lg border border-border/70 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{customer.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {customer.email || customer.phone || "Sin datos de contacto"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {customer.addresses?.length ?? 0} dir.
                      </span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingCustomer ? "Editar cliente" : "Nuevo cliente"}</SheetTitle>
            <SheetDescription>
              {editingCustomer
                ? "Actualiza datos de contacto y direccion principal del cliente."
                : "Registra un nuevo cliente dentro del tenant actual."}
            </SheetDescription>
          </SheetHeader>

          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <Field label="Nombre" htmlFor="customer-name" error={formErrors.name}>
              <Input
                id="customer-name"
                value={formValues.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
                placeholder="Ej. Maria Torres"
                maxLength={160}
                aria-invalid={Boolean(formErrors.name)}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Correo"
                htmlFor="customer-email"
                error={formErrors.email}
                hint="Opcional. Hasta 160 caracteres."
              >
                <Input
                  id="customer-email"
                  type="email"
                  value={formValues.email}
                  onChange={(event) => handleFieldChange("email", event.target.value)}
                  placeholder="cliente@correo.com"
                  maxLength={160}
                  aria-invalid={Boolean(formErrors.email)}
                />
              </Field>

              <Field
                label="Telefono"
                htmlFor="customer-phone"
                error={formErrors.phone}
                hint="Opcional. Hasta 20 caracteres."
              >
                <Input
                  id="customer-phone"
                  type="tel"
                  value={formValues.phone}
                  onChange={(event) => handleFieldChange("phone", event.target.value)}
                  placeholder="999888777"
                  maxLength={20}
                  aria-invalid={Boolean(formErrors.phone)}
                />
              </Field>
            </div>

            <Separator />

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Direccion principal</p>
              <p className="text-xs text-muted-foreground">
                Si completas `line1`, se enviara una direccion dentro de `addresses`.
              </p>
            </div>

            <Field
              label="Direccion"
              htmlFor="customer-address-line1"
              error={formErrors.addressLine1}
            >
              <Input
                id="customer-address-line1"
                value={formValues.addressLine1}
                onChange={(event) => handleFieldChange("addressLine1", event.target.value)}
                placeholder="Av. Principal 123"
                maxLength={180}
                aria-invalid={Boolean(formErrors.addressLine1)}
              />
            </Field>

            <Field
              label="Complemento"
              htmlFor="customer-address-line2"
              error={formErrors.addressLine2}
              hint="Opcional. Piso, referencia o interior."
            >
              <Input
                id="customer-address-line2"
                value={formValues.addressLine2}
                onChange={(event) => handleFieldChange("addressLine2", event.target.value)}
                placeholder="Oficina 402"
                maxLength={180}
                aria-invalid={Boolean(formErrors.addressLine2)}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Ciudad" htmlFor="customer-city" error={formErrors.city}>
                <Input
                  id="customer-city"
                  value={formValues.city}
                  onChange={(event) => handleFieldChange("city", event.target.value)}
                  placeholder="Lima"
                  maxLength={120}
                  aria-invalid={Boolean(formErrors.city)}
                />
              </Field>

              <Field label="Estado" htmlFor="customer-state" error={formErrors.state}>
                <Input
                  id="customer-state"
                  value={formValues.state}
                  onChange={(event) => handleFieldChange("state", event.target.value)}
                  placeholder="Lima"
                  maxLength={120}
                  aria-invalid={Boolean(formErrors.state)}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Codigo postal"
                htmlFor="customer-postal-code"
                error={formErrors.postalCode}
              >
                <Input
                  id="customer-postal-code"
                  value={formValues.postalCode}
                  onChange={(event) => handleFieldChange("postalCode", event.target.value)}
                  placeholder="15001"
                  maxLength={20}
                  aria-invalid={Boolean(formErrors.postalCode)}
                />
              </Field>

              <Field label="Pais" htmlFor="customer-country" error={formErrors.country}>
                <Input
                  id="customer-country"
                  value={formValues.country}
                  onChange={(event) => handleFieldChange("country", event.target.value)}
                  placeholder="Peru"
                  maxLength={120}
                  aria-invalid={Boolean(formErrors.country)}
                />
              </Field>
            </div>

            {actionError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {actionError}
              </div>
            ) : null}

            <SheetFooter className="border-t px-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSheetOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : editingCustomer ? "Guardar cambios" : "Crear cliente"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
}
