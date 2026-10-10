"use client"

import { InterlockingTransaction } from "@/types/branch"

const STORAGE_KEY = "bosnitro_pos_transactions"
const TX_EVENT_NAME = "bosnitro_transaction_sync"

/**
 * Retrieve transactions from local cache, strictly isolated by branch if specified
 */
export function getLocalTransactions(branchId?: string): InterlockingTransaction[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: InterlockingTransaction[] = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    const sorted = parsed.sort(
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
export function saveLocalTransactions(newTxs: InterlockingTransaction[]): InterlockingTransaction[] {
  if (typeof window === "undefined" || !Array.isArray(newTxs) || newTxs.length === 0) return []
  try {
    const existing = getLocalTransactions()
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

    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))

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
export async function syncTransactions(branchId?: string): Promise<InterlockingTransaction[]> {
  if (typeof window === "undefined") return []

  const branchParam = !branchId || branchId === "ALL" ? "ALL" : branchId
  const localList = getLocalTransactions()

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
            saveLocalTransactions(data.transactions)
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
        saveLocalTransactions(data.transactions)
      }
    }
  } catch (e) {
    // Graceful offline fallback
  }

  return getLocalTransactions(branchId)
}

/**
 * Subscribe to transaction updates across tabs and within the same window
 */
export function subscribeTransactions(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}

  const handleCustom = () => callback()
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback()
  }

  window.addEventListener(TX_EVENT_NAME, handleCustom)
  window.addEventListener("storage", handleStorage)

  return () => {
    window.removeEventListener(TX_EVENT_NAME, handleCustom)
    window.removeEventListener("storage", handleStorage)
  }
}
