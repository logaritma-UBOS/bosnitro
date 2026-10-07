"use client"

import { useState, useRef, useEffect } from "react"
import { useBranch } from "@/context/BranchContext"

export default function BranchSelector({ allowAll = false }: { allowAll?: boolean }) {
  const { branches, selectedBranch, selectedBranchId, setSelectedBranchId, isAllBranches } = useBranch()
  const [isOpen, setIsOpen] = useState(false)
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
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-left transition-all group"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shrink-0 font-black text-xs">
            📍
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
              {isAllBranches ? "4 Outlet Aktif" : selectedBranch.location}
            </p>
          </div>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
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
                <span className="text-sm">🏢</span>
                <span>Semua Cabang (Akumulasi)</span>
              </div>
              {isAllBranches && <span className="text-emerald-600 font-bold">✓</span>}
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
                    <span className="text-slate-900 font-bold">{b.name}</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal">{b.location}</p>
                </div>
                {isSelected && <span className="text-emerald-600 font-bold">✓</span>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
