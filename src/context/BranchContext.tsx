"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { Branch, DEFAULT_BRANCHES } from "@/types/branch"

type BranchContextType = {
  branches: Branch[]
  selectedBranch: Branch
  selectedBranchId: string
  setSelectedBranchId: (id: string) => void
  isAllBranches: boolean
  setIsAllBranches: (val: boolean) => void
  addBranch: (newBranch: Branch) => void
  updateBranchState: (updated: Branch) => void
  deleteBranchState: (id: string) => void
  refreshBranches: () => Promise<void>
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

const STORAGE_KEY = "ubos_selected_branch_id"
const BRANCHES_STORAGE_KEY = "bosnitro_branches_list"
const BRANCH_EVENT_NAME = "bosnitro_branches_sync"

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(BRANCHES_STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map = new Map<string, Branch>()
            for (const b of DEFAULT_BRANCHES) map.set(b.id, b)
            for (const b of parsed) if (b && b.id) map.set(b.id, b)
            return Array.from(map.values())
          }
        }
      } catch (e) {}
    }
    return DEFAULT_BRANCHES
  })

  const [selectedBranchId, setSelectedBranchIdState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && saved !== "ALL") return saved
      } catch (e) {}
    }
    return DEFAULT_BRANCHES[0].id
  })

  const [isAllBranches, setIsAllBranches] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === "ALL") return true
      } catch (e) {}
    }
    return false
  })

  const persistBranchesLocal = (list: Branch[]) => {
    try {
      localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(list))
      window.dispatchEvent(new CustomEvent(BRANCH_EVENT_NAME, { detail: list }))
    } catch (e) {}
  }

  const refreshBranches = useCallback(async () => {
    // 1. Read existing from local cache
    let localBranches: Branch[] = []
    try {
      const cached = localStorage.getItem(BRANCHES_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          localBranches = parsed
        }
      }
    } catch (e) {}

    try {
      const res = await fetch("/api/branches")
      if (res.ok) {
        const serverData: Branch[] = await res.json()
        if (Array.isArray(serverData)) {
          // Merge server data, local branches, and default branches (NEVER wipe any branch!)
          const branchMap = new Map<string, Branch>()
          for (const b of DEFAULT_BRANCHES) branchMap.set(b.id, b)
          for (const b of serverData) if (b && b.id) branchMap.set(b.id, b)
          for (const b of localBranches) if (b && b.id) branchMap.set(b.id, b)

          const merged = Array.from(branchMap.values())
          setBranches(merged)
          persistBranchesLocal(merged)

          // If local has branches that server doesn't have (cold container restart), auto-heal server
          const missingOnServer = localBranches.filter(lb => !serverData.some(sb => sb.id === lb.id))
          if (missingOnServer.length > 0) {
            fetch("/api/branches", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ branches: merged }),
            }).catch(() => {})
          }
        }
      }
    } catch (e) {
      // Offline fallback: keep local branches
      if (localBranches.length > 0) {
        setBranches(localBranches)
      }
    }
  }, [])

  useEffect(() => {
    refreshBranches()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === BRANCHES_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed)) setBranches(parsed)
        } catch (err) {}
      }
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === "ALL") {
          setIsAllBranches(true)
        } else {
          setSelectedBranchIdState(e.newValue)
          setIsAllBranches(false)
        }
      }
    }

    const handleCustomSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setBranches(e.detail)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener(BRANCH_EVENT_NAME, handleCustomSync)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener(BRANCH_EVENT_NAME, handleCustomSync)
    }
  }, [refreshBranches])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && (saved === "ALL" || branches.some(b => b.id === saved))) {
        if (saved === "ALL") {
          setIsAllBranches(true)
        } else {
          setSelectedBranchIdState(saved)
          setIsAllBranches(false)
        }
      } else if (branches.length > 0 && selectedBranchId !== "ALL" && !branches.some(b => b.id === selectedBranchId)) {
        // Only fallback if current selection does not exist
        setSelectedBranchIdState(branches[0].id)
      }
    } catch (e) {}
  }, [branches, selectedBranchId])

  const setSelectedBranchId = (id: string) => {
    if (id === "ALL") {
      setIsAllBranches(true)
      try {
        localStorage.setItem(STORAGE_KEY, "ALL")
      } catch (e) {}
    } else {
      setIsAllBranches(false)
      setSelectedBranchIdState(id)
      try {
        localStorage.setItem(STORAGE_KEY, id)
      } catch (e) {}
    }
  }

  const addBranch = (newBranch: Branch) => {
    setBranches(prev => {
      const map = new Map<string, Branch>()
      for (const b of prev) map.set(b.id, b)
      map.set(newBranch.id, newBranch)
      const updated = Array.from(map.values())
      persistBranchesLocal(updated)
      return updated
    })
    setSelectedBranchId(newBranch.id)
  }

  const updateBranchState = (updated: Branch) => {
    setBranches(prev => {
      const next = prev.map(b => b.id === updated.id ? updated : b)
      persistBranchesLocal(next)
      return next
    })
  }

  const deleteBranchState = (id: string) => {
    setBranches(prev => {
      const next = prev.filter(b => b.id !== id)
      persistBranchesLocal(next)
      if (selectedBranchId === id && next.length > 0) {
        setSelectedBranchId(next[0].id)
      }
      return next
    })
  }

  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0] || DEFAULT_BRANCHES[0]

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        selectedBranchId,
        setSelectedBranchId,
        isAllBranches,
        setIsAllBranches,
        addBranch,
        updateBranchState,
        deleteBranchState,
        refreshBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  const context = useContext(BranchContext)
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider")
  }
  return context
}
