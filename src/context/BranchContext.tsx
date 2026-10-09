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

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>(DEFAULT_BRANCHES)
  const [selectedBranchId, setSelectedBranchIdState] = useState<string>(DEFAULT_BRANCHES[0].id)
  const [isAllBranches, setIsAllBranches] = useState<boolean>(false)

  const refreshBranches = useCallback(async () => {
    try {
      const res = await fetch("/api/branches")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setBranches(data)
        }
      }
    } catch (e) {
      // Offline fallback
    }
  }, [])

  useEffect(() => {
    refreshBranches()
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
      } else if (branches.length > 0 && !branches.some(b => b.id === selectedBranchId)) {
        // If current selectedBranchId not in branches, select first
        setSelectedBranchIdState(branches[0].id)
      }
    } catch (e) {
      // Ignore localStorage errors
    }
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
      if (prev.some(b => b.id === newBranch.id)) return prev
      return [...prev, newBranch]
    })
    setSelectedBranchId(newBranch.id)
  }

  const updateBranchState = (updated: Branch) => {
    setBranches(prev => prev.map(b => b.id === updated.id ? updated : b))
  }

  const deleteBranchState = (id: string) => {
    setBranches(prev => {
      const next = prev.filter(b => b.id !== id)
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
