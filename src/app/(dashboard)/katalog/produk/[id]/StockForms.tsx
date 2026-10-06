"use client"
import { useState, useTransition } from "react"
import { FormattedNumberInput } from "@/components/FormattedNumberInput"

// Komponen feedback tombol dengan animasi loading & sukses
function FeedbackButton({ label, successLabel, pending }: { label: string, successLabel: string, pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`font-bold px-4 rounded-lg text-sm shadow-sm whitespace-nowrap transition-all duration-200
        ${pending
          ? "bg-gray-400 text-white cursor-not-allowed"
          : "bg-emerald-600 hover:bg-emerald-700 text-white"
        }`}
    >
      {pending ? "⏳ Menyimpan..." : label}
    </button>
  )
}

export function StockUpdateForm({
  productId,
  businessId,
  currentStock,
  onStockUpdate,
}: {
  productId: string
  businessId: string
  currentStock: number
  onStockUpdate: (formData: FormData) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      await onStockUpdate(formData)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2500)
    })
  }

  return (
    <div>
      <form action={handleSubmit} className="flex gap-2">
        <FormattedNumberInput
          name="newStock"
          defaultValue={currentStock}
          step="any"
          required
          className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-gray-50 font-bold text-emerald-700"
        />
        <FeedbackButton label="Update Stok" successLabel="✓ Terupdate!" pending={isPending} />
      </form>
      {showSuccess && (
        <p className="text-xs text-emerald-600 font-semibold mt-1.5 animate-pulse">✅ Stok berhasil diperbarui!</p>
      )}
    </div>
  )
}

export function CostUpdateForm({
  defaultValue,
  onCostUpdate,
}: {
  defaultValue: number
  onCostUpdate: (formData: FormData) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      await onCostUpdate(formData)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2500)
    })
  }

  return (
    <div>
      <form action={handleSubmit} className="flex gap-2">
        <FormattedNumberInput
          name="purchaseCost"
          defaultValue={defaultValue}
          step="any"
          required
          className="w-full border border-gray-300 p-2 rounded-lg text-sm bg-gray-50"
        />
        <FeedbackButton label="Simpan" successLabel="✓ Tersimpan!" pending={isPending} />
      </form>
      {showSuccess && (
        <p className="text-xs text-emerald-600 font-semibold mt-1.5 animate-pulse">✅ Harga modal berhasil disimpan!</p>
      )}
    </div>
  )
}
