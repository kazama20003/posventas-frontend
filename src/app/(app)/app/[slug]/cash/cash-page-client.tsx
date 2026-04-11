"use client"

import Link from "next/link"
import { useMemo, useState, type FormEvent } from "react"
import {
  ArrowRightLeft,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CASH_MOVEMENT_MANUAL_TYPES,
  getApiErrorMessage,
  useCashMovements,
  useCashRegisterOpenSession,
  useCashRegisters,
  useCashSessions,
  useCloseCashSession,
  useCreateCashMovement,
  useCreateCashRegister,
  useOpenCashSession,
  type CashMovementManualType,
} from "@/lib/api/cash"
import { useActiveStore } from "@/lib/app/active-store-context"

type CashPageClientProps = {
  slug: string
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Sin fecha"
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function normalizeOptionalValue(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : undefined
}

function toNumber(value: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function CashPageClient({ slug }: CashPageClientProps) {
  const [search, setSearch] = useState("")
  const [selectedRegisterId, setSelectedRegisterId] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerCode, setRegisterCode] = useState("")
  const [openingAmount, setOpeningAmount] = useState("")
  const [openingNotes, setOpeningNotes] = useState("")
  const [closingAmount, setClosingAmount] = useState("")
  const [closingNotes, setClosingNotes] = useState("")
  const [movementType, setMovementType] = useState<CashMovementManualType>("CASH_IN")
  const [movementAmount, setMovementAmount] = useState("")
  const [movementReason, setMovementReason] = useState("")
  const [movementReferenceId, setMovementReferenceId] = useState("")
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { selectedStore, selectedStoreId, isLoading: isLoadingStores } = useActiveStore()
  const registersQuery = useCashRegisters()
  const sessionsQuery = useCashSessions()
  const movementsQuery = useCashMovements()
  const createRegister = useCreateCashRegister()
  const openSession = useOpenCashSession()
  const closeSession = useCloseCashSession()
  const createMovement = useCreateCashMovement()

  const registers = useMemo(() => registersQuery.data ?? [], [registersQuery.data])
  const sessions = useMemo(() => sessionsQuery.data ?? [], [sessionsQuery.data])
  const movements = useMemo(() => movementsQuery.data ?? [], [movementsQuery.data])

  const registersForStore = useMemo(() => {
    if (!selectedStoreId) return []
    return registers.filter((register) => String(register.storeId) === selectedStoreId)
  }, [registers, selectedStoreId])

  const effectiveSelectedRegisterId = useMemo(() => {
    if (!registersForStore.length) return ""

    return registersForStore.some((register) => String(register.id) === selectedRegisterId)
      ? selectedRegisterId
      : String(registersForStore[0]?.id ?? "")
  }, [registersForStore, selectedRegisterId])

  const selectedRegister = useMemo(
    () =>
      registersForStore.find((register) => String(register.id) === effectiveSelectedRegisterId) ??
      null,
    [effectiveSelectedRegisterId, registersForStore]
  )

  const openSessionQuery = useCashRegisterOpenSession(effectiveSelectedRegisterId, {
    enabled: Boolean(effectiveSelectedRegisterId),
  })

  const currentSession = openSessionQuery.data ?? null

  const filteredRegisters = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return registersForStore

    return registersForStore.filter((register) =>
      [register.name, register.code].some((value) =>
        String(value ?? "").toLowerCase().includes(normalized)
      )
    )
  }, [registersForStore, search])

  const registersById = useMemo(
    () => new Map(registers.map((register) => [String(register.id), register])),
    [registers]
  )

  const sessionsForStore = useMemo(
    () =>
      sessions.filter((session) => {
        const register = session.cashRegister ?? registersById.get(String(session.cashRegisterId))
        return register ? String(register.storeId) === selectedStoreId : false
      }),
    [registersById, selectedStoreId, sessions]
  )

  const movementsForStore = useMemo(
    () =>
      movements
        .filter((movement) => {
          const register =
            movement.cashRegister ?? registersById.get(String(movement.cashRegisterId))
          return register ? String(register.storeId) === selectedStoreId : false
        })
        .sort(
          (left, right) =>
            new Date(right.updatedAt ?? right.createdAt ?? 0).getTime() -
            new Date(left.updatedAt ?? left.createdAt ?? 0).getTime()
        )
        .slice(0, 6),
    [movements, registersById, selectedStoreId]
  )

  const activeSessions = sessionsForStore.filter(
    (session) => String(session.status ?? "").toUpperCase() === "OPEN" || !session.closedAt
  ).length

  const isLoading =
    isLoadingStores || registersQuery.isLoading || sessionsQuery.isLoading || movementsQuery.isLoading

  function clearMessages() {
    setActionError(null)
    setSuccessMessage(null)
  }

  async function handleCreateRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedStoreId) {
      setActionError("Selecciona una sucursal antes de crear una caja.")
      return
    }

    if (registerName.trim().length < 2) {
      setActionError("El nombre de la caja debe tener al menos 2 caracteres.")
      return
    }

    clearMessages()

    try {
      const register = await createRegister.mutateAsync({
        storeId: selectedStoreId,
        name: registerName.trim(),
        code: normalizeOptionalValue(registerCode),
      })

      setRegisterName("")
      setRegisterCode("")
      setSelectedRegisterId(String(register.id))
      setSuccessMessage(`Caja ${register.name} creada.`)
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo crear la caja."))
    }
  }

  async function handleOpenSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!effectiveSelectedRegisterId) {
      setActionError("Selecciona una caja antes de abrir sesion.")
      return
    }

    const amount = toNumber(openingAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      setActionError("El monto de apertura debe ser valido.")
      return
    }

    clearMessages()

    try {
      await openSession.mutateAsync({
        cashRegisterId: effectiveSelectedRegisterId,
        openingAmount: amount,
        notes: normalizeOptionalValue(openingNotes),
      })

      setOpeningAmount("")
      setOpeningNotes("")
      setSuccessMessage("Sesion abierta.")
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo abrir la sesion."))
    }
  }

  async function handleCloseSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!currentSession) {
      setActionError("No existe una sesion abierta.")
      return
    }

    const amount = toNumber(closingAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      setActionError("El monto de cierre debe ser valido.")
      return
    }

    clearMessages()

    try {
      await closeSession.mutateAsync({
        id: currentSession.id,
        payload: {
          countedClosingAmount: amount,
          notes: normalizeOptionalValue(closingNotes),
        },
      })

      setClosingAmount("")
      setClosingNotes("")
      setSuccessMessage("Sesion cerrada.")
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo cerrar la sesion."))
    }
  }

  async function handleCreateMovement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!effectiveSelectedRegisterId || !currentSession) {
      setActionError("Necesitas una caja con sesion abierta para registrar movimientos.")
      return
    }

    const amount = toNumber(movementAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError("El monto del movimiento debe ser mayor a 0.")
      return
    }

    clearMessages()

    try {
      await createMovement.mutateAsync({
        cashRegisterId: effectiveSelectedRegisterId,
        cashSessionId: String(currentSession.id),
        type: movementType,
        amount,
        reason: normalizeOptionalValue(movementReason),
        referenceId: normalizeOptionalValue(movementReferenceId),
      })

      setMovementAmount("")
      setMovementReason("")
      setMovementReferenceId("")
      setSuccessMessage("Movimiento registrado.")
    } catch (error) {
      setActionError(getApiErrorMessage(error, "No se pudo registrar el movimiento."))
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <header className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <span>Tenant {slug}</span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Caja</h1>
            <p className="text-sm text-muted-foreground">
              Flujo recomendado: crear caja, abrir sesion, cobrar en POS y cerrar sesion.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                void registersQuery.refetch()
                void sessionsQuery.refetch()
                void movementsQuery.refetch()
                if (effectiveSelectedRegisterId) void openSessionQuery.refetch()
              }}
            >
              <RefreshCcw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button asChild className="gap-2">
              <Link href={`/app/${slug}/pos`}>
                <ShoppingCart className="h-4 w-4" />
                Ir al POS
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Cajas en sucursal
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{registersForStore.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sesiones abiertas
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">{activeSessions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Sucursal activa
            </p>
            <p className="mt-2 text-lg font-bold text-foreground">
              {selectedStore?.name ?? "Sin sucursal"}
            </p>
          </CardContent>
        </Card>
      </section>

      {actionError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {successMessage}
        </div>
      ) : null}

      {!selectedStoreId ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            La caja depende de una sucursal. Selecciona una en el sidebar antes de operar.
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cajas</CardTitle>
                <CardDescription>Registra y selecciona la caja con la que trabajara el POS.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="pl-9"
                    placeholder="Buscar caja"
                  />
                </div>

                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 rounded-xl" />
                    ))}
                  </div>
                ) : filteredRegisters.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                    No hay cajas para esta sucursal.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRegisters.map((register) => (
                      <button
                        key={String(register.id)}
                        type="button"
                        onClick={() => {
                          setSelectedRegisterId(String(register.id))
                          clearMessages()
                        }}
                        className={
                          String(register.id) === effectiveSelectedRegisterId
                            ? "w-full rounded-xl border border-primary/40 bg-primary/5 p-4 text-left"
                            : "w-full rounded-xl border border-border/70 bg-background p-4 text-left hover:bg-muted/20"
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{register.name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {register.code || "Sin codigo"}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {register.isActive === false ? "Inactiva" : "Activa"}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <Separator />

                <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]" onSubmit={handleCreateRegister}>
                  <Input
                    value={registerName}
                    onChange={(event) => setRegisterName(event.target.value)}
                    placeholder="Nombre de caja"
                    maxLength={120}
                  />
                  <Input
                    value={registerCode}
                    onChange={(event) => setRegisterCode(event.target.value)}
                    placeholder="Codigo"
                    maxLength={40}
                  />
                  <Button type="submit" className="gap-2" disabled={createRegister.isPending}>
                    <Plus className="h-4 w-4" />
                    {createRegister.isPending ? "Creando..." : "Crear caja"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Movimientos recientes</CardTitle>
                <CardDescription>Ingresos y salidas manuales de la sucursal activa.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {movementsQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-18 rounded-xl" />
                  ))
                ) : movementsForStore.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                    Aun no hay movimientos registrados.
                  </div>
                ) : (
                  movementsForStore.map((movement) => (
                    <div key={String(movement.id)} className="rounded-xl border border-border/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {registersById.get(String(movement.cashRegisterId))?.name ?? "Caja"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatDate(movement.createdAt)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {formatCurrency(Number(movement.amount ?? 0))}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {String(movement.type) === "CASH_OUT" ? "Salida" : "Ingreso"} · {movement.reason || "Sin motivo"}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sesion de caja</CardTitle>
              <CardDescription>
                {selectedRegister ? `Caja seleccionada: ${selectedRegister.name}` : "Selecciona una caja."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedRegister ? (
                <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                  Crea o selecciona una caja para abrir sesion.
                </div>
              ) : openSessionQuery.isLoading ? (
                <Skeleton className="h-32 rounded-xl" />
              ) : currentSession ? (
                <>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      Sesion abierta
                    </p>
                    <p className="mt-2 text-sm text-foreground">
                      Apertura: {formatCurrency(Number(currentSession.openingAmount ?? 0))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(currentSession.openedAt ?? currentSession.createdAt)}
                    </p>
                  </div>

                  <form className="space-y-3" onSubmit={handleCreateMovement}>
                    <div className="grid gap-3">
                      <select
                        value={movementType}
                        onChange={(event) => setMovementType(event.target.value as CashMovementManualType)}
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                      >
                        {CASH_MOVEMENT_MANUAL_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type === "CASH_IN" ? "Ingreso" : "Salida"}
                          </option>
                        ))}
                      </select>
                      <Input
                        value={movementAmount}
                        onChange={(event) => setMovementAmount(event.target.value)}
                        placeholder="Monto del movimiento"
                        inputMode="decimal"
                      />
                      <Input
                        value={movementReason}
                        onChange={(event) => setMovementReason(event.target.value)}
                        placeholder="Motivo"
                        maxLength={250}
                      />
                      <Input
                        value={movementReferenceId}
                        onChange={(event) => setMovementReferenceId(event.target.value)}
                        placeholder="Referencia"
                        maxLength={120}
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={createMovement.isPending}>
                      <ArrowRightLeft className="h-4 w-4" />
                      {createMovement.isPending ? "Registrando..." : "Registrar movimiento"}
                    </Button>
                  </form>

                  <Separator />

                  <form className="space-y-3" onSubmit={handleCloseSession}>
                    <Input
                      value={closingAmount}
                      onChange={(event) => setClosingAmount(event.target.value)}
                      placeholder="Monto contado al cierre"
                      inputMode="decimal"
                    />
                    <Input
                      value={closingNotes}
                      onChange={(event) => setClosingNotes(event.target.value)}
                      placeholder="Notas del cierre"
                      maxLength={500}
                    />
                    <Button type="submit" variant="outline" className="w-full" disabled={closeSession.isPending}>
                      {closeSession.isPending ? "Cerrando..." : "Cerrar sesion"}
                    </Button>
                  </form>
                </>
              ) : (
                <form className="space-y-3" onSubmit={handleOpenSession}>
                  <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                    Esta caja no tiene sesion abierta. El POS deberia exigir este paso antes de cobrar.
                  </div>
                  <Input
                    value={openingAmount}
                    onChange={(event) => setOpeningAmount(event.target.value)}
                    placeholder="Monto de apertura"
                    inputMode="decimal"
                  />
                  <Input
                    value={openingNotes}
                    onChange={(event) => setOpeningNotes(event.target.value)}
                    placeholder="Notas de apertura"
                    maxLength={500}
                  />
                  <Button type="submit" className="w-full" disabled={openSession.isPending}>
                    {openSession.isPending ? "Abriendo..." : "Abrir sesion"}
                  </Button>
                </form>
              )}

              <div className="rounded-xl border border-border/70 bg-muted/10 p-4 text-sm text-muted-foreground">
                Regla sugerida: la caja se crea una vez por terminal o punto fisico. La sesion se abre por turno.
                La validacion final debe vivir en backend, no solo en el frontend.
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  )
}
