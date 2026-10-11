"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { Branch, DEFAULT_BRANCHES } from "@/types/branch"
import { setActiveBusinessId } from "@/lib/transactionStore"

type BranchContextType = {
  businessId?: string
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
  assignedBranchId?: string | null
  userRole?: string
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

export function BranchProvider({
  children,
  businessId,
  assignedBranchId,
  userRole = "OWNER",
}: {
  children: React.ReactNode
  businessId?: string
  assignedBranchId?: string | null
  userRole?: string
}) {
  const STORAGE_KEY = businessId ? `ubos_selected_branch_id_${businessId}` : "ubos_selected_branch_id"
  const BRANCHES_STORAGE_KEY = businessId ? `bosnitro_branches_list_${businessId}` : "bosnitro_branches_list"
  const BRANCH_EVENT_NAME = businessId ? `bosnitro_branches_sync_${businessId}` : "bosnitro_branches_sync"

  useEffect(() => {
    if (businessId) {
      setActiveBusinessId(businessId)
    }
  }, [businessId])

  const readLocalBranches = useCallback((): Branch[] => {
    if (typeof window === "undefined") return []
    try {
      // 1. Direct scoped key
      const cached = localStorage.getItem(BRANCHES_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
      // 2. Backup key
      if (businessId) {
        const backup = localStorage.getItem(`bosnitro_branches_list_${businessId}_backup`)
        if (backup) {
          const parsed = JSON.parse(backup)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        }
      }
      // 3. Scan other candidate keys for this user or business
      let bestCandidate: Branch[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith("bosnitro_branches_list")) {
          try {
            const val = localStorage.getItem(key)
            if (val) {
              const parsed = JSON.parse(val)
              if (Array.isArray(parsed) && parsed.length > bestCandidate.length) {
                if (!businessId || parsed.some((b: any) => !b.businessId || b.businessId === businessId)) {
                  bestCandidate = parsed
                }
              }
            }
          } catch (e) {}
        }
      }
      if (bestCandidate.length > 0) return bestCandidate
    } catch (e) {}
    return []
  }, [BRANCHES_STORAGE_KEY, businessId])

  const [branches, setBranches] = useState<Branch[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(BRANCHES_STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed
          }
        }
        if (businessId) {
          const backup = localStorage.getItem(`bosnitro_branches_list_${businessId}_backup`)
          if (backup) {
            const parsed = JSON.parse(backup)
            if (Array.isArray(parsed) && parsed.length > 0) return parsed
          }
        }
      } catch (e) {}
    }
    return businessId ? [] : DEFAULT_BRANCHES
  })

  const [selectedBranchId, setSelectedBranchIdState] = useState<string>(() => {
    if (assignedBranchId && userRole !== "OWNER") {
      return assignedBranchId
    }
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved && saved !== "ALL") return saved
      } catch (e) {}
    }
    return branches[0]?.id || (businessId ? `${businessId}-utama` : "branch-utama")
  })

  const [isAllBranches, setIsAllBranches] = useState<boolean>(() => {
    if (assignedBranchId && userRole !== "OWNER") {
      return false
    }
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved === "ALL") return true
      } catch (e) {}
    }
    return false
  })

  const persistBranchesLocal = useCallback((list: Branch[]) => {
    try {
      localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(list))
      if (businessId) {
        localStorage.setItem(`bosnitro_branches_list_${businessId}_backup`, JSON.stringify(list))
      }
      window.dispatchEvent(new CustomEvent(BRANCH_EVENT_NAME, { detail: list }))
    } catch (e) {}
  }, [BRANCHES_STORAGE_KEY, BRANCH_EVENT_NAME, businessId])

  const refreshBranches = useCallback(async () => {
    // 1. Read existing from local cache (NEVER lose existing local branches)
    const localBranches = readLocalBranches()

    try {
      const res = await fetch("/api/branches")
      if (res.ok) {
        const serverData: Branch[] = await res.json()
        if (Array.isArray(serverData)) {
          // Merge server data and local branches
          const branchMap = new Map<string, Branch>()

          // 1. Add all local branches FIRST (preserves newly created branches across refreshes)
          for (const b of localBranches) {
            if (b && b.id) {
              branchMap.set(b.id, { ...b, businessId: businessId || b.businessId })
            }
          }

          // 2. Merge server data
          for (const b of serverData) {
            if (b && b.id) {
              const existing = branchMap.get(b.id)
              branchMap.set(b.id, { ...existing, ...b, businessId: businessId || b.businessId })
            }
          }

          if (branchMap.size === 0 && !businessId) {
            for (const b of DEFAULT_BRANCHES) branchMap.set(b.id, b)
          }

          const merged = Array.from(branchMap.values())
          if (merged.length > 0) {
            setBranches(merged)
            persistBranchesLocal(merged)
          }

          // If local has branches that server doesn't have (cold container restart), auto-heal server
          const missingOnServer = localBranches.filter(lb => !serverData.some(sb => sb.id === lb.id))
          if (missingOnServer.length > 0 || (merged.length > serverData.length)) {
            fetch("/api/branches", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ branches: merged, businessId }),
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
  }, [readLocalBranches, persistBranchesLocal, businessId])

  useEffect(() => {
    refreshBranches()

    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === BRANCHES_STORAGE_KEY || e.key === `bosnitro_branches_list_${businessId}_backup`) && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue)
          if (Array.isArray(parsed) && parsed.length > 0) setBranches(parsed)
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
      if (e.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setBranches(e.detail)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener(BRANCH_EVENT_NAME, handleCustomSync)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener(BRANCH_EVENT_NAME, handleCustomSync)
    }
  }, [refreshBranches, BRANCHES_STORAGE_KEY, STORAGE_KEY, BRANCH_EVENT_NAME, businessId])

  useEffect(() => {
    if (assignedBranchId && userRole !== "OWNER") {
      setSelectedBranchIdState(assignedBranchId)
      setIsAllBranches(false)
      return
    }
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
  }, [branches, selectedBranchId, STORAGE_KEY, assignedBranchId, userRole])

  const setSelectedBranchId = (id: string) => {
    if (assignedBranchId && userRole !== "OWNER") {
      setSelectedBranchIdState(assignedBranchId)
      setIsAllBranches(false)
      return
    }
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

  const handleSetIsAllBranches = (val: boolean) => {
    if (assignedBranchId && userRole !== "OWNER") {
      setIsAllBranches(false)
      return
    }
    setIsAllBranches(val)
  }

  const addBranch = (newBranch: Branch) => {
    const branchWithBiz: Branch = {
      ...newBranch,
      businessId: businessId || newBranch.businessId,
    }
    setBranches(prev => {
      const map = new Map<string, Branch>()
      for (const b of prev) if (b && b.id) map.set(b.id, b)
      map.set(branchWithBiz.id, branchWithBiz)
      const updated = Array.from(map.values())
      persistBranchesLocal(updated)
      return updated
    })
    setSelectedBranchId(branchWithBiz.id)

    // Eagerly sync to server
    fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: branchWithBiz.id,
        name: branchWithBiz.name,
        location: branchWithBiz.location,
        deviceId: branchWithBiz.deviceId,
        businessId,
      }),
    }).catch(() => {})
  }

  const updateBranchState = (updated: Branch) => {
    setBranches(prev => {
      const next = prev.map(b => b.id === updated.id ? { ...b, ...updated } : b)
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

  const selectedBranch = branches.find(b => b.id === selectedBranchId) || (assignedBranchId ? {
    id: assignedBranchId,
    businessId,
    name: "Cabang Outlet",
    location: "-",
    status: "ONLINE",
  } as Branch : null) || branches[0] || ({
    id: businessId ? `${businessId}-utama` : "branch-utama",
    businessId,
    name: "Cabang Utama",
    location: "Jl. Utama No. 1",
    status: "ONLINE",
  } as Branch)

  return (
    <BranchContext.Provider
      value={{
        businessId,
        branches,
        selectedBranch,
        selectedBranchId,
        setSelectedBranchId,
        isAllBranches,
        setIsAllBranches: handleSetIsAllBranches,
        addBranch,
        updateBranchState,
        deleteBranchState,
        refreshBranches,
        assignedBranchId,
        userRole,
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
