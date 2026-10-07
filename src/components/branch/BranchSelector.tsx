"use client"

import { useState, useRef, useEffect } from "react"
import { useBranch } from "@/context/BranchContext"
import { MapPin, Building2, ChevronDown, Check, Plus } from "lucide-react"
import AddBranchModal from "@/components/branch/AddBranchModal"

export default function BranchSelector({ allowAll = false }: { allowAll?: boolean }) {
  const { branches, selectedBranch, selectedBranchId, setSelectedBranchId, isAllBranches } = useBranch()
  const [isOpen, setIsOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-left transition-all group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800 truncate">
                  {isAllBranches ? "Semua Cabang" : selectedBranch.name}
                </span>
                <span className="flex h-1.5 w-1.5 relative shrink-0" title="IoT Controller Terhubung">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {isAllBranches ? `${branches.length} Outlet Aktif` : selectedBranch.location}
              </p>
            </div>
          </div>

          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Pilih Cabang Outlet
            </div>

            {allowAll && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBranchId("ALL")
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                  isAllBranches
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span>Semua Cabang (Akumulasi)</span>
                </div>
                {isAllBranches && <Check className="w-4 h-4 text-emerald-600" />}
              </button>
            )}

            {branches.map((b) => {
              const isSelected = !isAllBranches && selectedBranchId === b.id
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBranchId(b.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left text-xs font-semibold transition-colors ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/50"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-900 font-bold">{b.name}</span>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal pl-5">{b.location}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              )
            })}

            {allowAll && (
              <div className="pt-1 mt-1 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    setIsAddModalOpen(true)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Tambah Cabang Baru</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AddBranchModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </>
  )
}
