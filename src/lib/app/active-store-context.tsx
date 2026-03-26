"use client"

import * as React from "react"
import { create } from "zustand"

import { useStores, type Store } from "@/lib/api/stores"

const ACTIVE_STORE_STORAGE_KEY = "posventas_active_store"

type ActiveStoreState = {
  tenantSlug: string | null
  stores: Store[]
  selectedStoreId: string
  isLoading: boolean
  isError: boolean
  error: unknown
  initializeTenant: (tenantSlug: string) => void
  setSelectedStoreId: (storeId: string) => void
  syncStores: (stores: Store[]) => void
  setQueryState: (payload: {
    isLoading: boolean
    isError: boolean
    error: unknown
  }) => void
}

function normalizeStoreId(storeId: string | number | null | undefined) {
  return String(storeId ?? "").trim()
}

function getStorageKey(tenantSlug: string) {
  return `${ACTIVE_STORE_STORAGE_KEY}:${tenantSlug}`
}

function readPersistedStoreId(tenantSlug: string) {
  if (typeof window === "undefined") {
    return ""
  }

  return normalizeStoreId(window.localStorage.getItem(getStorageKey(tenantSlug)))
}

function persistStoreId(tenantSlug: string | null, storeId: string) {
  if (typeof window === "undefined" || !tenantSlug) {
    return
  }

  const storageKey = getStorageKey(tenantSlug)

  if (storeId) {
    window.localStorage.setItem(storageKey, storeId)
  } else {
    window.localStorage.removeItem(storageKey)
  }
}

const useActiveStoreStore = create<ActiveStoreState>((set, get) => ({
  tenantSlug: null,
  stores: [],
  selectedStoreId: "",
  isLoading: true,
  isError: false,
  error: null,
  initializeTenant: (tenantSlug) => {
    if (get().tenantSlug === tenantSlug) {
      return
    }

    set({
      tenantSlug,
      stores: [],
      selectedStoreId: readPersistedStoreId(tenantSlug),
      isLoading: true,
      isError: false,
      error: null,
    })
  },
  setSelectedStoreId: (storeId) => {
    const normalizedStoreId = normalizeStoreId(storeId)

    persistStoreId(get().tenantSlug, normalizedStoreId)
    set({ selectedStoreId: normalizedStoreId })
  },
  syncStores: (stores) => {
    const normalizedStores = stores ?? []
    const availableStoreIds = new Set(
      normalizedStores.map((store) => normalizeStoreId(store.id))
    )
    const currentStoreId = normalizeStoreId(get().selectedStoreId)
    const nextStoreId =
      availableStoreIds.size === 0
        ? ""
        : currentStoreId && availableStoreIds.has(currentStoreId)
          ? currentStoreId
          : normalizeStoreId(normalizedStores[0]?.id)

    persistStoreId(get().tenantSlug, nextStoreId)

    set({
      stores: normalizedStores,
      selectedStoreId: nextStoreId,
    })
  },
  setQueryState: ({ isLoading, isError, error }) => {
    set({
      isLoading,
      isError,
      error,
    })
  },
}))

type ActiveStoreBootstrapProps = {
  tenantSlug: string
}

export function ActiveStoreBootstrap({
  tenantSlug,
}: ActiveStoreBootstrapProps) {
  const storesQuery = useStores()
  const initializeTenant = useActiveStoreStore((state) => state.initializeTenant)
  const syncStores = useActiveStoreStore((state) => state.syncStores)
  const setQueryState = useActiveStoreStore((state) => state.setQueryState)

  React.useEffect(() => {
    initializeTenant(tenantSlug)
  }, [initializeTenant, tenantSlug])

  React.useEffect(() => {
    setQueryState({
      isLoading: storesQuery.isLoading,
      isError: storesQuery.isError,
      error: storesQuery.error,
    })
  }, [
    setQueryState,
    storesQuery.error,
    storesQuery.isError,
    storesQuery.isLoading,
  ])

  React.useEffect(() => {
    if (storesQuery.isLoading) {
      return
    }

    syncStores(storesQuery.data ?? [])
  }, [storesQuery.data, storesQuery.isLoading, syncStores])

  return null
}

export function useActiveStore() {
  const stores = useActiveStoreStore((state) => state.stores)
  const selectedStoreId = useActiveStoreStore((state) => state.selectedStoreId)
  const setSelectedStoreId = useActiveStoreStore((state) => state.setSelectedStoreId)
  const isLoading = useActiveStoreStore((state) => state.isLoading)
  const isError = useActiveStoreStore((state) => state.isError)
  const error = useActiveStoreStore((state) => state.error)

  const selectedStore = React.useMemo(
    () => stores.find((store) => normalizeStoreId(store.id) === selectedStoreId) ?? null,
    [selectedStoreId, stores]
  )

  return {
    stores,
    selectedStoreId,
    selectedStore,
    setSelectedStoreId,
    isLoading,
    isError,
    error,
  }
}
