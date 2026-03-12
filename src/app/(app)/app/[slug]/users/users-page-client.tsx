"use client"

import { useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  BadgeCheck,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  Store,
  Trash2,
  UserCog,
  UserRound,
} from "lucide-react"

import {
  getApiErrorMessage,
  USER_ROLE_VALUES,
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/lib/api/users"
import type { CreateUserInput, UpdateUserInput, User, UserRoleValue } from "@/lib/api/users"
import { useStores } from "@/lib/api/stores"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

type UsersPageClientProps = { slug: string }
type UserFormValues = {
  email: string
  password: string
  displayName: string
  ruc: string
  phone: string
  role: UserRoleValue
  isActive: boolean
  storeIds: string[]
}
type UserFormErrors = Partial<Record<"email" | "password" | "displayName" | "ruc" | "phone", string>>

const defaultFormValues: UserFormValues = {
  email: "",
  password: "",
  displayName: "",
  ruc: "",
  phone: "",
  role: "SELLER",
  isActive: true,
  storeIds: [],
}

function normalizeOptional(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function getUserRole(user: User): string {
  if (typeof user.role === "string" && user.role.length > 0) return user.role
  const role = user.roles?.[0]?.name
  return typeof role === "string" && role.length > 0 ? role : "SELLER"
}

function getUserName(user: User) {
  const name = typeof user.displayName === "string" ? user.displayName.trim() : ""
  return name.length > 0 ? name : user.email
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function roleBadgeClass(role: string) {
  if (role === "OWNER") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
  if (role === "ADMIN") return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"
  if (role === "CASHIER") return "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/30 dark:text-violet-300"
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
}

function statusBadgeClass(isActive: boolean) {
  return isActive
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
    : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
}

function validateUser(values: UserFormValues, isEdit: boolean) {
  const errors: UserFormErrors = {}
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const email = values.email.trim()
  const password = values.password.trim()

  if (!emailPattern.test(email)) errors.email = "Ingresa un correo valido."
  if ((!isEdit || password.length > 0) && password.length < 6) errors.password = "La clave debe tener al menos 6 caracteres."
  if (password.length > 72) errors.password = "La clave no puede superar 72 caracteres."
  if (values.displayName.trim().length > 120) errors.displayName = "El nombre no puede superar 120 caracteres."
  if (values.ruc.trim().length > 0 && !/^\d{11}$/.test(values.ruc.trim())) errors.ruc = "El RUC debe tener 11 digitos."
  if (values.phone.trim().length > 20) errors.phone = "El telefono no puede superar 20 caracteres."

  return errors
}

function toCreatePayload(values: UserFormValues): CreateUserInput {
  return {
    email: values.email.trim(),
    password: values.password.trim(),
    displayName: normalizeOptional(values.displayName),
    ruc: normalizeOptional(values.ruc),
    phone: normalizeOptional(values.phone),
    role: values.role,
    storeIds: values.storeIds,
    isActive: values.isActive,
  }
}

function toUpdatePayload(values: UserFormValues): UpdateUserInput {
  return {
    email: values.email.trim(),
    password: normalizeOptional(values.password),
    displayName: normalizeOptional(values.displayName),
    ruc: normalizeOptional(values.ruc),
    phone: normalizeOptional(values.phone),
    role: values.role,
    storeIds: values.storeIds,
    isActive: values.isActive,
  }
}

export function UsersPageClient({ slug }: UsersPageClientProps) {
  const [search, setSearch] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formValues, setFormValues] = useState<UserFormValues>(defaultFormValues)
  const [formErrors, setFormErrors] = useState<UserFormErrors>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const usersQuery = useUsers()
  const storesQuery = useStores()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const stores = useMemo(() => storesQuery.data ?? [], [storesQuery.data])
  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return users
    return users.filter((user) => {
      const role = getUserRole(user)
      const storeNames = (user.stores ?? []).map((store) => store.name ?? store.code ?? "")
      return [user.email, user.displayName, user.phone, role, ...storeNames].some((value) =>
        String(value ?? "").toLowerCase().includes(normalized)
      )
    })
  }, [search, users])

  const activeUsers = users.filter((user) => user.isActive !== false).length
  const adminUsers = users.filter((user) => ["OWNER", "ADMIN"].includes(getUserRole(user))).length
  const usersWithStores = users.filter((user) => (user.stores?.length ?? user.storeIds?.length ?? 0) > 0).length
  const recentUsers = useMemo(
    () =>
      [...users]
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 3),
    [users]
  )

  function resetForm() {
    setEditingUser(null)
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

  function openEditSheet(user: User) {
    setEditingUser(user)
    setFormValues({
      email: String(user.email ?? ""),
      password: "",
      displayName: String(user.displayName ?? ""),
      ruc: String(user.ruc ?? ""),
      phone: String(user.phone ?? ""),
      role: getUserRole(user) as UserRoleValue,
      isActive: user.isActive !== false,
      storeIds: (user.stores ?? []).map((store) => String(store.id)),
    })
    setFormErrors({})
    setActionError(null)
    setSheetOpen(true)
  }

  function handleFieldChange<K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }))
    setFormErrors((current) => ({ ...current, [field]: undefined }))
    setActionError(null)
  }

  function handleStoreToggle(storeId: string, checked: boolean) {
    setFormValues((current) => ({
      ...current,
      storeIds: checked
        ? [...new Set([...current.storeIds, storeId])]
        : current.storeIds.filter((id) => id !== storeId),
    }))
    setActionError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const errors = validateUser(formValues, Boolean(editingUser))
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      if (editingUser) {
        await updateUser.mutateAsync({ id: editingUser.id, payload: toUpdatePayload(formValues) })
      } else {
        await createUser.mutateAsync(toCreatePayload(formValues))
      }
      handleSheetOpenChange(false)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo guardar el usuario."))
    }
  }

  async function handleDelete(user: User) {
    if (!window.confirm(`Eliminar el usuario "${getUserName(user)}"?`)) return
    try {
      await deleteUser.mutateAsync(user.id)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo eliminar el usuario."))
    }
  }

  const isSubmitting = createUser.isPending || updateUser.isPending

  return (
    <main className="space-y-4 p-4">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <SidebarTrigger className="mt-0.5 shrink-0" />
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Modulo de usuarios</p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Accesos, roles y sucursales</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Gestiona el personal operativo de <span className="font-semibold text-foreground">{slug}</span>, define permisos por rol y controla a que sucursales puede entrar cada usuario.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => void usersQuery.refetch()} disabled={usersQuery.isFetching}>
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button className="gap-2" onClick={openCreateSheet}>
              <Plus className="h-4 w-4" />
              Nuevo usuario
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<UserRound className="h-5 w-5 text-primary" />} label="Usuarios registrados" value={String(users.length)} hint={`${filteredUsers.length} visibles con el filtro actual`} iconClass="bg-primary/10" />
        <MetricCard icon={<BadgeCheck className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />} label="Activos" value={String(activeUsers)} hint={`${users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0}% del total`} iconClass="bg-emerald-100 dark:bg-emerald-950/30" hintClass="text-emerald-600 dark:text-emerald-400" />
        <MetricCard icon={<Shield className="h-5 w-5 text-blue-700 dark:text-blue-300" />} label="Admin y owners" value={String(adminUsers)} hint="Usuarios con mayor nivel de acceso" iconClass="bg-blue-100 dark:bg-blue-950/30" />
        <MetricCard icon={<Store className="h-5 w-5 text-violet-700 dark:text-violet-300" />} label="Con sucursales" value={String(usersWithStores)} hint={`${users.length > 0 ? Math.round((usersWithStores / users.length) * 100) : 0}% asignado`} iconClass="bg-violet-100 dark:bg-violet-950/30" />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>Base de usuarios</CardTitle>
                <CardDescription>Correos, roles, estado y sucursales permitidas dentro del tenant actual.</CardDescription>
              </div>
              <div className="relative min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, correo, rol o sucursal" className="pl-9" />
              </div>
            </div>
            <Separator />
          </CardHeader>
          <CardContent className="pt-0">
            {actionError ? <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div> : null}
            {usersQuery.isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-18 rounded-xl" />)}</div>
            ) : usersQuery.isError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{getApiErrorMessage(usersQuery.error, "No se pudo cargar la lista de usuarios.")}</div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState title="No hay usuarios para mostrar" description={users.length === 0 ? "Crea el primer usuario operativo para empezar a delegar accesos." : "Ajusta la busqueda para encontrar un usuario existente."} onCreate={users.length === 0 ? openCreateSheet : undefined} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-2 py-3 font-medium">Usuario</th>
                      <th className="px-2 py-3 font-medium">Rol</th>
                      <th className="px-2 py-3 font-medium">Sucursales</th>
                      <th className="px-2 py-3 font-medium">Estado</th>
                      <th className="px-2 py-3 font-medium">Actualizacion</th>
                      <th className="px-2 py-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const role = getUserRole(user)
                      const active = user.isActive !== false
                      const userStores = user.stores ?? []
                      return (
                        <tr key={String(user.id)} className="border-b border-border/50 last:border-0">
                          <td className="px-2 py-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{getInitials(getUserName(user))}</div>
                              <div className="space-y-1">
                                <p className="font-semibold text-foreground">{getUserName(user)}</p>
                                <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5" />{user.email}</p>
                                {user.phone ? <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Phone className="h-3.5 w-3.5" />{user.phone}</p> : null}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-4"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${roleBadgeClass(role)}`}>{role}</span></td>
                          <td className="px-2 py-4">
                            {userStores.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {userStores.slice(0, 2).map((store) => <span key={String(store.id)} className="inline-flex rounded-full border border-border/70 bg-muted/20 px-2 py-1 text-xs font-medium text-foreground">{store.name ?? store.code ?? `ID ${String(store.id)}`}</span>)}
                                {userStores.length > 2 ? <span className="inline-flex rounded-full border border-border/70 bg-muted/20 px-2 py-1 text-xs font-medium text-muted-foreground">+{userStores.length - 2} mas</span> : null}
                              </div>
                            ) : <span className="text-muted-foreground">Sin sucursales</span>}
                          </td>
                          <td className="px-2 py-4"><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${statusBadgeClass(active)}`}>{active ? "Activo" : "Inactivo"}</span></td>
                          <td className="px-2 py-4 text-muted-foreground">{formatDate(user.updatedAt ?? user.createdAt)}</td>
                          <td className="px-2 py-4">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" className="gap-2" onClick={() => openEditSheet(user)}><Pencil className="h-4 w-4" />Editar</Button>
                              <Button variant="destructive" size="sm" className="gap-2" onClick={() => void handleDelete(user)} disabled={deleteUser.isPending}><Trash2 className="h-4 w-4" />Eliminar</Button>
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
          <SummaryCard title="Usuarios activos" value={String(activeUsers)} description="Personal actualmente habilitado para iniciar sesion." />
          <SummaryCard title="Sin sucursal asignada" value={String(users.length - usersWithStores)} description="Revisa si necesitan acceso restringido o cobertura completa." />
          <Card>
            <CardHeader>
              <CardTitle>Usuarios recientes</CardTitle>
              <CardDescription>Altas o cambios mas recientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentUsers.length === 0 ? <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">Aun no existen usuarios registrados.</div> : recentUsers.map((user) => <div key={`recent-${String(user.id)}`} className="rounded-lg border border-border/70 p-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-foreground">{getUserName(user)}</p><span className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${roleBadgeClass(getUserRole(user))}`}>{getUserRole(user)}</span></div><p className="mt-1 text-xs text-muted-foreground">{formatDate(user.updatedAt ?? user.createdAt)}</p></div>)}
            </CardContent>
          </Card>
        </div>
      </section>

      <Sheet open={sheetOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</SheetTitle>
            <SheetDescription>{editingUser ? "Actualiza correo, perfil, rol, estado y sucursales permitidas." : "Crea un acceso nuevo dentro del tenant autenticado."}</SheetDescription>
          </SheetHeader>
          <form className="flex flex-1 flex-col gap-5 px-4 pb-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Correo" htmlFor="user-email" error={formErrors.email}><Input id="user-email" type="email" value={formValues.email} onChange={(event) => handleFieldChange("email", event.target.value)} placeholder="vendedor@empresa.com" aria-invalid={Boolean(formErrors.email)} /></Field>
              <Field label="Clave" htmlFor="user-password" error={formErrors.password} hint={editingUser ? "Solo completa este campo si deseas cambiar la clave." : "La clave se enviara al backend para guardarse hasheada."} className="sm:col-span-2"><Input id="user-password" type="password" value={formValues.password} onChange={(event) => handleFieldChange("password", event.target.value)} placeholder={editingUser ? "Deja vacio para no cambiarla" : "Minimo 6 caracteres"} maxLength={72} aria-invalid={Boolean(formErrors.password)} /></Field>
              <Field label="Nombre visible" htmlFor="user-display-name" error={formErrors.displayName}><Input id="user-display-name" value={formValues.displayName} onChange={(event) => handleFieldChange("displayName", event.target.value)} placeholder="Juan Perez" maxLength={120} aria-invalid={Boolean(formErrors.displayName)} /></Field>
              <Field label="Telefono" htmlFor="user-phone" error={formErrors.phone}><Input id="user-phone" value={formValues.phone} onChange={(event) => handleFieldChange("phone", event.target.value)} placeholder="999888777" maxLength={20} aria-invalid={Boolean(formErrors.phone)} /></Field>
              <Field label="RUC" htmlFor="user-ruc" error={formErrors.ruc}><Input id="user-ruc" value={formValues.ruc} onChange={(event) => handleFieldChange("ruc", event.target.value)} placeholder="20123456789" maxLength={11} aria-invalid={Boolean(formErrors.ruc)} /></Field>
              <div className="space-y-2">
                <label htmlFor="user-role" className="text-sm font-medium text-foreground">Rol</label>
                <select id="user-role" value={formValues.role} onChange={(event) => handleFieldChange("role", event.target.value as UserRoleValue)} className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs">
                  {USER_ROLE_VALUES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-border/70 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Estado del usuario</p>
                  <p className="mt-1 text-xs text-muted-foreground">Si lo desactivas, el usuario queda sin acceso operativo.</p>
                </div>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <input type="checkbox" checked={formValues.isActive} onChange={(event) => handleFieldChange("isActive", event.target.checked)} className="mt-0.5 h-4 w-4 rounded border border-input" />
                  Activo
                </label>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border/70 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Sucursales permitidas</p>
                <p className="mt-1 text-xs text-muted-foreground">Si no seleccionas ninguna, el usuario quedara sin acceso a sucursales.</p>
              </div>
              {storesQuery.isLoading ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-10 rounded-lg" />)}</div>
              ) : stores.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/70 p-3 text-sm text-muted-foreground">No hay sucursales registradas todavia.</div>
              ) : (
                <div className="grid gap-2">
                  {stores.map((store) => {
                    const storeId = String(store.id)
                    return (
                      <label key={storeId} className="flex items-start gap-3 rounded-lg border border-border/70 p-3 text-sm">
                        <input type="checkbox" checked={formValues.storeIds.includes(storeId)} onChange={(event) => handleStoreToggle(storeId, event.target.checked)} className="mt-0.5 h-4 w-4 rounded border border-input" />
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{store.name}</p>
                          <p className="text-xs text-muted-foreground">{store.code || "Sin codigo"}{store.address ? ` - ${store.address}` : ""}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>

            {actionError ? <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{actionError}</div> : null}
            <SheetFooter className="border-t px-0 pt-4">
              <Button type="button" variant="outline" onClick={() => handleSheetOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando..." : editingUser ? "Guardar cambios" : "Crear usuario"}</Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </main>
  )
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
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className={`text-xs font-medium ${hintClass ?? "text-muted-foreground"}`}>{hint}</p>
          </div>
          <div className={`rounded-lg p-2.5 ${iconClass}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryCard({ title, value, description }: { title: string; value: string; description: string }) {
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
      <UserCog className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {onCreate ? (
        <Button className="mt-4 gap-2" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Crear primer usuario
        </Button>
      ) : null}
    </div>
  )
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
