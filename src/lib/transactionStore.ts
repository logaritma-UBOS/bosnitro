"use client"

import { InterlockingTransaction } from "@/types/branch"

let activeBusinessId: string | undefined = undefined

export function setActiveBusinessId(id?: string) {
  if (id) {
    activeBusinessId = id
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("bosnitro_active_business_id", id)
      } catch (e) {}
    }
  }
}

export function getActiveBusinessId(): string | undefined {
  if (activeBusinessId) return activeBusinessId
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("bosnitro_active_business_id") || undefined
    } catch (e) {}
  }
  return undefined
}

function resolveStorageKey(businessId?: string): string {
  const bId = businessId || getActiveBusinessId()
  return bId ? `bosnitro_pos_transactions_${bId}` : "bosnitro_pos_transactions"
}

const TX_EVENT_NAME = "bosnitro_transaction_sync"

/**
 * Retrieve transactions from local cache, strictly isolated by branch and businessId
 */
export function getLocalTransactions(branchId?: string, businessId?: string): InterlockingTransaction[] {
  if (typeof window === "undefined") return []
  try {
    const key = resolveStorageKey(businessId)
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed: InterlockingTransaction[] = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const effectiveBiz = businessId || getActiveBusinessId()
    const filtered = effectiveBiz
      ? parsed.filter(t => !t.businessId || t.businessId === effectiveBiz)
      : parsed

    const sorted = filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    if (!branchId || branchId === "ALL") {
      return sorted
    }
    return sorted.filter((t) => t.branchId === branchId)
  } catch (e) {
    return []
  }
}

/**
 * Save new or updated transactions to local storage and broadcast to other pages/tabs
 */
export function saveLocalTransactions(newTxs: InterlockingTransaction[], businessId?: string): InterlockingTransaction[] {
  if (typeof window === "undefined" || !Array.isArray(newTxs) || newTxs.length === 0) return []
  try {
    const key = resolveStorageKey(businessId)
    const existing = getLocalTransactions(undefined, businessId)
    const map = new Map<string, InterlockingTransaction>()

    // Retain existing
    for (const t of existing) {
      if (t && t.id) map.set(t.id, t)
    }
    // Upsert new ones
    for (const t of newTxs) {
      if (t && t.id) map.set(t.id, t)
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    localStorage.setItem(key, JSON.stringify(merged))

    // Broadcast update across current window
    window.dispatchEvent(new CustomEvent(TX_EVENT_NAME, { detail: merged }))
    return merged
  } catch (e) {
    return []
  }
}

/**
 * Two-way sync: push local transactions to server, pull server transactions,
 * merge into local storage, and return the filtered list for this branch.
 */
export async function syncTransactions(branchId?: string, businessId?: string): Promise<InterlockingTransaction[]> {
  if (typeof window === "undefined") return []

  const branchParam = !branchId || branchId === "ALL" ? "ALL" : branchId
  const localList = getLocalTransactions(undefined, businessId)

  try {
    // 1. Sync local transactions to server (fire-and-forget or awaited)
    if (localList.length > 0) {
      fetch("/api/pos/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions: localList, branchId: branchParam }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.transactions)) {
            saveLocalTransactions(data.transactions, businessId)
          }
        })
        .catch(() => {})
    }

    // 2. Fetch server transactions for this branch
    const res = await fetch(`/api/pos/transactions?branchId=${encodeURIComponent(branchParam)}`, {
      cache: "no-store",
    })

    if (res.ok) {
      const data = await res.json()
      if (data.success && Array.isArray(data.transactions)) {
        saveLocalTransactions(data.transactions, businessId)
      }
    }
  } catch (e) {
    // Graceful offline fallback
  }

  return getLocalTransactions(branchId, businessId)
}

/**
 * Subscribe to transaction updates across tabs and within the same window
 */
export function subscribeTransactions(callback: () => void, businessId?: string): () => void {
  if (typeof window === "undefined") return () => {}

  const key = resolveStorageKey(businessId)
  const handleCustom = () => callback()
  const handleStorage = (e: StorageEvent) => {
    if (e.key === key) callback()
  }

  window.addEventListener(TX_EVENT_NAME, handleCustom)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(TX_EVENT_NAME, handleCustom)
    window.removeEventListener("storage", handleStorage)
  }
}
