"use client"

import { useState, useMemo, useEffect } from "react"
import { useBranch } from "@/context/BranchContext"
import { InterlockingProduct } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import BranchSelector from "@/components/branch/BranchSelector"
import AuditCameraModal from "@/components/pos/AuditCameraModal"
import SolenoidCountdownModal from "@/components/pos/SolenoidCountdownModal"

type CartItem = {
  product: InterlockingProduct
  quantity: number
}

export default function KasirInterlockingClient({
  initialProducts,
  user,
}: {
  initialProducts: InterlockingProduct[]
  user?: { name?: string | null; role?: string | null }
}) {
  const { selectedBranch, selectedBranchId } = useBranch()
  const [products, setProducts] = useState<InterlockingProduct[]>(initialProducts)
  const [activeTab, setActiveTab] = useState<"NITROGEN" | "RETAIL">("NITROGEN")
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Interlocking Photo State
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null)
  const [usedBottlePhotoUrl, setUsedBottlePhotoUrl] = useState<string | null>(null)
  const [cameraModalType, setCameraModalType] = useState<"NITROGEN_PLATE" | "RETAIL_BOTTLE" | null>(null)

  // Solenoid Countdown State
  const [solenoidModalOpen, setSolenoidModalOpen] = useState(false)
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(15)
  const [activeServiceName, setActiveServiceName] = useState("")
  const [lastReceiptNumber, setLastReceiptNumber] = useState("")

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH")
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedTx, setCompletedTx] = useState<any>(null)

  // Dynamic sync with catalog on branch change
  useEffect(() => {
    if (!selectedBranchId) return
    fetch(`/api/catalog/products?branchId=${selectedBranchId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.products && Array.isArray(data.products)) {
          setProducts(data.products)
        }
      })
      .catch(console.error)
  }, [selectedBranchId])

  // Categorize products
  const nitrogenProducts = useMemo(() => {
    return products.filter((p) => p.category === "NITROGEN")
  }, [products])

  const retailProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.category !== "RETAIL") return false
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        p.name.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query))
      )
    })
  }, [products, searchQuery])

  // Cart operations
  const addToCart = (product: InterlockingProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (product.category === "RETAIL" && existing.quantity >= product.stock) {
          alert(`Stok ${product.name} di cabang ini tersisa ${product.stock} pcs!`)
          return prev
        }
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            if (item.product.category === "RETAIL" && newQty > item.product.stock) {
              alert(`Stok ${item.product.name} hanya tersedia ${item.product.stock} pcs!`)
              return item
            }
            return { ...item, quantity: newQty }
          }
          return item
        })
        .filter((item) => item.quantity > 0)
    )
  }

  const clearCart = () => {
    setCart([])
    setVehiclePhotoUrl(null)
    setUsedBottlePhotoUrl(null)
    setCashReceived(0)
  }

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  const hasNitrogenInCart = useMemo(() => {
    return cart.some((item) => item.product.category === "NITROGEN")
  }, [cart])

  const hasRetailInCart = useMemo(() => {
    return cart.some((item) => item.product.category === "RETAIL")
  }, [cart])

  const nitrogenItem = useMemo(() => {
    return cart.find((item) => item.product.category === "NITROGEN")
  }, [cart])

  // Initiates interlocking verification before payment
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return

    // 1. Interlock Check for Nitrogen
    if (hasNitrogenInCart && !vehiclePhotoUrl) {
      setCameraModalType("NITROGEN_PLATE")
      return
    }

    // 2. Interlock Check for Retail/Oli
    if (hasRetailInCart && !usedBottlePhotoUrl) {
      setCameraModalType("RETAIL_BOTTLE")
      return
    }

    // 3. Both photos verified (or not required), finalize payment
    handleFinalizePayment()
  }

  const handlePhotoCaptured = (photoUrl: string) => {
    if (cameraModalType === "NITROGEN_PLATE") {
      setVehiclePhotoUrl(photoUrl)
      setCameraModalType(null)
      // Check if retail photo also needed
      if (hasRetailInCart && !usedBottlePhotoUrl) {
        setTimeout(() => setCameraModalType("RETAIL_BOTTLE"), 200)
        return
      }
    } else if (cameraModalType === "RETAIL_BOTTLE") {
      setUsedBottlePhotoUrl(photoUrl)
      setCameraModalType(null)
    }
  }

  const handleFinalizePayment = async () => {
    setIsProcessing(true)

    try {
      const payload = {
        branchId: selectedBranchId,
        items: cart.map((c) => ({
          productId: c.product.id,
          quantity: c.quantity,
          price: c.product.price,
          costPrice: c.product.costPrice,
          category: c.product.category,
        })),
        totalAmount: subtotal,
        paymentMethod,
        vehiclePhotoUrl,
        usedBottlePhotoUrl,
      }

      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || "Gagal memproses pembayaran")
      }

      const tx = data.transaction
      setCompletedTx(tx)

      // Trigger IoT Solenoid Valve if Nitrogen was in cart
      if (hasNitrogenInCart && nitrogenItem) {
        const timerSecs = nitrogenItem.product.timerSeconds || 15
        setActiveTimerSeconds(timerSecs)
        setActiveServiceName(nitrogenItem.product.name)
        setLastReceiptNumber(tx.id)

        // Call IoT API
        fetch("/api/iot/trigger-valve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branch_id: selectedBranchId,
            timer_seconds: timerSecs,
            transaction_id: tx.id,
          }),
        }).catch(console.error)

        setSolenoidModalOpen(true)
      }

      // Deduct stock in client UI
      setProducts((prev) =>
        prev.map((prod) => {
          const inCart = cart.find((c) => c.product.id === prod.id)
          if (inCart && prod.category === "RETAIL") {
            return { ...prod, stock: Math.max(0, prod.stock - inCart.quantity) }
          }
          return prod
        })
      )

      clearCart()
    } catch (e: any) {
      alert("Error Checkout: " + e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const changeDue = Math.max(0, cashReceived - subtotal)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/20">
            ⚡
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 leading-tight">
              POS Interlocking Nitrogen & Ritel
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Operator: <span className="font-bold text-slate-700">{user?.name || "Budi Kasir"}</span> ({user?.role || "KASIR"})
            </p>
          </div>
        </div>

        {/* Branch Selector Widget */}
        <div className="w-full sm:w-64">
          <BranchSelector />
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Catalog Selection */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto space-y-5">
          {/* Category Tabs */}
          <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab("NITROGEN")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === "NITROGEN"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="text-sm">💨</span>
              <span>Layanan Nitrogen</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                IoT Valve
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("RETAIL")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === "RETAIL"
                  ? "bg-white text-blue-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="text-sm">🧴</span>
              <span>Ritel & Oli</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                Stok Fisik
              </span>
            </button>
          </div>

          {/* TAB 1: NITROGEN SERVICES */}
          {activeTab === "NITROGEN" && (
            <div className="space-y-4">
              <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-emerald-900">
                    Sistem Penguncian Katup Solenoid Otomatis
                  </h3>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Wajib foto plat kendaraan pelanggan sebelum pembayaran agar katup gas dapat terbuka.
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    Sensor Aktif
                  </span>
                </div>
              </div>

              {/* Nitrogen Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {nitrogenProducts.map((p) => {
                  const isMotor = p.vehicleType === "MOTOR"
                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="group bg-white hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-300 rounded-3xl p-5 cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-2xl p-2.5 bg-slate-50 group-hover:bg-emerald-100 rounded-2xl transition-colors">
                            {isMotor ? "🏍️" : "🚗"}
                          </span>
                          <span className="bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full flex items-center gap-1">
                            ⏱️ {p.timerSeconds} Detik
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-900 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {p.serviceType === "TAMBAH" ? "Penambahan tekanan angin ban" : "Kuras dan isi ulang murni nitrogen"}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-lg font-black text-emerald-700 tabular-nums">
                          {formatRupiah(p.price)}
                        </span>
                        <span className="bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-xs transition-colors">
                          + Pilih
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: RETAIL & OLI */}
          {activeTab === "RETAIL" && (
            <div className="space-y-4">
              {/* Search Barcode & Name */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Scan Barcode atau ketik nama oli / barang..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-xs"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                  🔍
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Retail Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {retailProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      className={`bg-white border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                        isOutOfStock
                          ? "opacity-50 border-slate-200 cursor-not-allowed bg-slate-50"
                          : "border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer hover:bg-blue-50/30"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-xl">🧴</span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              p.stock > 10
                                ? "bg-emerald-100 text-emerald-800"
                                : p.stock > 0
                                ? "bg-amber-100 text-amber-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            Stok: {p.stock} pcs
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{p.name}</h4>
                        {p.barcode && (
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            SKU: {p.barcode}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900 tabular-nums">
                          {formatRupiah(p.price)}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                          + Tambah
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Cart & Interlocking Checkout Panel */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-sm">
          {/* Cart Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Keranjang Kasir</h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Outlet: <span className="font-bold text-slate-700">{selectedBranch.name}</span>
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs font-bold text-red-500 hover:text-red-700"
              >
                Kosongkan
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 divide-y divide-slate-100">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <span className="text-3xl block mb-2">🛒</span>
                <p className="text-xs font-medium">Keranjang masih kosong.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pilih layanan nitrogen atau barang ritel di sebelah kiri.
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {formatRupiah(item.product.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-5 text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Visual Audit Verification Badges */}
          {cart.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Status Syarat Audit Visual
              </div>

              {hasNitrogenInCart && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span>🏍️</span>
                    <span className="font-bold text-slate-800">Foto Plat Kendaraan</span>
                  </div>
                  {vehiclePhotoUrl ? (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      ✓ Terlampir
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCameraModalType("NITROGEN_PLATE")}
                      className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-md"
                    >
                      📸 Ambil Foto
                    </button>
                  )}
                </div>
              )}

              {hasRetailInCart && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span>🧴</span>
                    <span className="font-bold text-slate-800">Foto Botol Bekas Oli</span>
                  </div>
                  {usedBottlePhotoUrl ? (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      ✓ Terlampir
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCameraModalType("RETAIL_BOTTLE")}
                      className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-md"
                    >
                      📸 Ambil Foto
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Checkout Controls */}
          {cart.length > 0 && (
            <div className="p-4 bg-white border-t border-slate-200 space-y-3.5">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["CASH", "QRIS", "TRANSFER"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        paymentMethod === method
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Quick Nominal Buttons */}
              {paymentMethod === "CASH" && (
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Uang Diterima</span>
                    {changeDue > 0 && (
                      <span className="font-bold text-emerald-700">
                        Kembalian: {formatRupiah(changeDue)}
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={cashReceived || ""}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    placeholder={`Masukkan nominal tunai (min: ${formatRupiah(subtotal)})`}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="grid grid-cols-4 gap-1 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setCashReceived(subtotal)}
                      className="py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      Uang Pas
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived(10000)}
                      className="py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      10rb
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived(50000)}
                      className="py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      50rb
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashReceived(100000)}
                      className="py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700"
                    >
                      100rb
                    </button>
                  </div>
                </div>
              )}

              {/* Total & Checkout Button */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Total Tagihan</p>
                  <p className="text-xl font-black text-slate-900 tabular-nums">
                    {formatRupiah(subtotal)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleInitiateCheckout}
                disabled={isProcessing}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Memproses Pembayaran & Katup...</span>
                ) : (
                  <>
                    <span>
                      {hasNitrogenInCart ? "Konfirmasi & Buka Katup Gas" : "Selesaikan Pembayaran"}
                    </span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Camera Modal */}
      {cameraModalType && (
        <AuditCameraModal
          isOpen={true}
          auditType={cameraModalType}
          onCaptureComplete={handlePhotoCaptured}
          onCancel={() => setCameraModalType(null)}
        />
      )}

      {/* Solenoid Countdown Modal */}
      {solenoidModalOpen && (
        <SolenoidCountdownModal
          isOpen={true}
          timerSeconds={activeTimerSeconds}
          serviceName={activeServiceName}
          vehiclePhotoUrl={vehiclePhotoUrl}
          receiptNumber={lastReceiptNumber}
          onClose={() => setSolenoidModalOpen(false)}
        />
      )}
    </div>
  )
}
