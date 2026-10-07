"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { Branch, DEFAULT_BRANCHES } from "@/types/branch"

type BranchContextType = {
  branches: Branch[]
  selectedBranch: Branch
  selectedBranchId: string
  setSelectedBranchId: (id: string) => void
  isAllBranches: boolean
  setIsAllBranches: (val: boolean) => void
}

const BranchContext = createContext<BranchContextType | undefined>(undefined)

const STORAGE_KEY = "ubos_selected_branch_id"

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches] = useState<Branch[]>(DEFAULT_BRANCHES)
  const [selectedBranchId, setSelectedBranchIdState] = useState<string>(DEFAULT_BRANCHES[0].id)
  const [isAllBranches, setIsAllBranches] = useState<boolean>(false)

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
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, [branches])

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

  const selectedBranch = branches.find(b => b.id === selectedBranchId) || branches[0]

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        selectedBranchId,
        setSelectedBranchId,
        isAllBranches,
        setIsAllBranches
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
