"use client"

import { useState, useMemo, useEffect } from "react"
import { useBranch } from "@/context/BranchContext"
import { InterlockingProduct, InterlockingTransaction } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import BranchSelector from "@/components/branch/BranchSelector"
import AuditCameraModal from "@/components/pos/AuditCameraModal"
import SolenoidCountdownModal from "@/components/pos/SolenoidCountdownModal"
import {
  formatTextReceipt,
  printDirectWebBluetooth,
  getRawBtIntentUrl,
} from "@/lib/bluetoothPrinter"
import {
  Zap,
  Gauge,
  Droplets,
  Bike,
  Car,
  Clock,
  Search,
  X,
  ShoppingCart,
  Camera,
  Check,
  ArrowRight,
  Banknote,
  QrCode,
  CreditCard,
  Plus,
  Minus,
  Radio,
  Printer,
  Smartphone,
  Send,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react"

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
  const [activeTab, setActiveTab] = useState<"NITROGEN" | "LAYANAN_LAINNYA">("NITROGEN")
  const [nitrogenVehicleFilter, setNitrogenVehicleFilter] = useState<"MOTOR" | "MOBIL">("MOTOR")
  const [serviceFilter, setServiceFilter] = useState<string>("ALL")
  const [cart, setCart] = useState<CartItem[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Customer CRM Form
  const [customerPlate, setCustomerPlate] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Interlocking Photo State
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null)
  const [usedBottlePhotoUrl, setUsedBottlePhotoUrl] = useState<string | null>(null)
  const [cameraModalType, setCameraModalType] = useState<"NITROGEN_PLATE" | "RETAIL_BOTTLE" | null>(null)

  // Hardware execution states
  const [solenoidModalOpen, setSolenoidModalOpen] = useState(false)
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(15)
  const [activeServiceName, setActiveServiceName] = useState("")
  const [lastReceiptNumber, setLastReceiptNumber] = useState("")

  // Payment & Result State
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH")
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedTx, setCompletedTx] = useState<InterlockingTransaction | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [printStatus, setPrintStatus] = useState<string | null>(null)
  const [printerSize, setPrinterSize] = useState<"58mm" | "80mm">("58mm")

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

  // Filtered Nitrogen Products (Image 1: Layanan Nitrogen with Motor/Mobil Toggle)
  const nitrogenProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.category !== "NITROGEN") return false
      return p.vehicleType === nitrogenVehicleFilter
    })
  }, [products, nitrogenVehicleFilter])

  // Filtered Layanan Lainnya (Image 1: Ganti Oli, Minyak Rem, Cairan Tubles)
  const otherProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.category === "NITROGEN") return false

      if (serviceFilter !== "ALL") {
        if (serviceFilter === "OLI" && p.serviceVariant !== "GANTI_OLI") return false
        if (serviceFilter === "MINYAK_REM" && p.serviceVariant !== "MINYAK_REM") return false
        if (serviceFilter === "TUBLES" && p.serviceVariant !== "TUBLES") return false
      }

      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        p.name.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query))
      )
    })
  }, [products, serviceFilter, searchQuery])

  // Cart operations
  const addToCart = (product: InterlockingProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if ((product.category === "RETAIL" || product.category === "LAYANAN_LAINNYA") && existing.quantity >= product.stock) {
          alert(`Stok ${product.name} tersisa ${product.stock} pcs!`)
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
            if (
              (item.product.category === "RETAIL" || item.product.category === "LAYANAN_LAINNYA") &&
              newQty > item.product.stock
            ) {
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
    setCustomerPlate("")
    setCustomerName("")
    setCustomerPhone("")
  }

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  const hasNitrogenInCart = useMemo(() => {
    return cart.some((item) => item.product.category === "NITROGEN")
  }, [cart])

  const hasOtherInCart = useMemo(() => {
    return cart.some((item) => item.product.category === "RETAIL" || item.product.category === "LAYANAN_LAINNYA")
  }, [cart])

  const nitrogenItem = useMemo(() => {
    return cart.find((item) => item.product.category === "NITROGEN")
  }, [cart])

  // Interlocking verification before payment
  const handleInitiateCheckout = () => {
    if (cart.length === 0) return

    // 1. Mandatory plate input
    if (hasNitrogenInCart && !customerPlate.trim()) {
      alert("Harap masukkan Plat Nomor Kendaraan pelanggan sebelum checkout!")
      return
    }

    // 2. Interlock Check for Nitrogen: Photo Plat
    if (hasNitrogenInCart && !vehiclePhotoUrl) {
      setCameraModalType("NITROGEN_PLATE")
      return
    }

    // 3. Interlock Check for Layanan Lainnya: Foto Bukti Pengerjaan
    if (hasOtherInCart && !usedBottlePhotoUrl) {
      setCameraModalType("RETAIL_BOTTLE")
      return
    }

    // 4. Photos verified, proceed
    handleFinalizePayment()
  }

  const handlePhotoCaptured = (photoUrl: string) => {
    if (cameraModalType === "NITROGEN_PLATE") {
      setVehiclePhotoUrl(photoUrl)
      setCameraModalType(null)
      // Check if other service photo is also needed
      if (hasOtherInCart && !usedBottlePhotoUrl) {
        setTimeout(() => setCameraModalType("RETAIL_BOTTLE"), 250)
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
        customerPlate: customerPlate.toUpperCase().trim() || null,
        customerName: customerName.trim() || null,
        customerPhone: customerPhone.trim() || null,
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

      const tx: InterlockingTransaction = data.transaction
      setCompletedTx(tx)

      // Trigger IoT Solenoid Valve if Nitrogen was in cart (Image 1: Sinyal WebSocket ESP32)
      if (hasNitrogenInCart && nitrogenItem) {
        const timerSecs = nitrogenItem.product.timerSeconds || 15
        setActiveTimerSeconds(timerSecs)
        setActiveServiceName(nitrogenItem.product.name)
        setLastReceiptNumber(tx.id)

        // Fire IoT Valve trigger
        fetch("/api/hardware/iot-trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: selectedBranchId,
            durationSeconds: timerSecs,
            vehicleType: nitrogenVehicleFilter,
            serviceVariant: nitrogenItem.product.serviceVariant,
          }),
        }).catch(console.error)

        setSolenoidModalOpen(true)
      }

      // Deduct stock in client UI
      setProducts((prev) =>
        prev.map((prod) => {
          const inCart = cart.find((c) => c.product.id === prod.id)
          if (inCart && (prod.category === "RETAIL" || prod.category === "LAYANAN_LAINNYA")) {
            return { ...prod, stock: Math.max(0, prod.stock - inCart.quantity) }
          }
          return prod
        })
      )

      // Show completed modal with Bluetooth print options
      setShowSuccessModal(true)
      clearCart()
    } catch (e: any) {
      alert("Error Checkout: " + e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Mini Bluetooth Printing (Option A: Web Bluetooth)
  const handlePrintWebBluetooth = async () => {
    if (!completedTx) return
    setPrintStatus("Menghubungkan ke printer Bluetooth...")
    try {
      const receiptText = formatTextReceipt(
        completedTx,
        selectedBranch.name || "UBOS NITROGEN",
        printerSize,
        "TERIMA KASIH - TEKANAN BAN AMAN"
      )
      const res = await printDirectWebBluetooth(receiptText)
      setPrintStatus(res.message)
    } catch (e: any) {
      setPrintStatus("Error: " + (e.message || "Gagal mencetak Bluetooth"))
    }
  }

  // Handle Mini Bluetooth Printing (Option B: Android RawBT Intent)
  const handlePrintRawBt = () => {
    if (!completedTx) return
    const receiptText = formatTextReceipt(
      completedTx,
      selectedBranch.name || "UBOS NITROGEN",
      printerSize,
      "TERIMA KASIH - TEKANAN BAN AMAN"
    )
    const rawBtUrl = getRawBtIntentUrl(receiptText)
    window.location.href = rawBtUrl
  }

  // Handle WhatsApp Customer Reminder
  const handleSendWhatsAppReceipt = () => {
    if (!completedTx) return
    const phone = completedTx.customerPhone || customerPhone
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "")
    const targetPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone
    if (!targetPhone) {
      alert("Nomor HP pelanggan tidak tersedia.")
      return
    }

    const itemsSummary = completedTx.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")
    const msg = `Halo Kak ${completedTx.customerName || "Pelanggan"}! 🚗💨\n\nTerima kasih telah melakukan servis di *${selectedBranch.name}*.\n*No. Transaksi:* ${completedTx.id}\n*Plat Kendaraan:* ${completedTx.customerPlate || "-"}\n*Layanan:* ${itemsSummary}\n*Total Tagihan:* ${formatRupiah(completedTx.totalAmount)}\n*Metode:* ${completedTx.paymentMethod}\n\nTekanan ban & oli Anda kini dalam kondisi prima. Sampai jumpa di servis berikutnya!`

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const changeDue = Math.max(0, cashReceived - subtotal)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 lg:pb-0">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-emerald-600/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                POS Interlocking & Hardware Trigger
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                <span>ESP32 Ready</span>
              </span>
            </div>
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
          {/* Category Tabs (Image 1 Blueprint) */}
          <div className="flex bg-slate-200/80 p-1.5 rounded-2xl max-w-lg">
            <button
              type="button"
              onClick={() => setActiveTab("NITROGEN")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === "NITROGEN"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Gauge className="w-4 h-4 text-emerald-600" />
              <span>Layanan Nitrogen</span>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                IoT Trigger
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("LAYANAN_LAINNYA")}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === "LAYANAN_LAINNYA"
                  ? "bg-white text-blue-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wrench className="w-4 h-4 text-blue-600" />
              <span>Layanan Lainnya</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-black">
                Digital Stock-Lock
              </span>
            </button>
          </div>

          {/* TAB 1: NITROGEN SERVICES (Image 1: Layanan Nitrogen) */}
          {activeTab === "NITROGEN" && (
            <div className="space-y-4">
              {/* Vehicle Toggle: Motor vs Mobil */}
              <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-2.5">
                <span className="text-xs font-bold text-slate-700 pl-2">Jenis Kendaraan:</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNitrogenVehicleFilter("MOTOR")}
                    className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                      nitrogenVehicleFilter === "MOTOR"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Motor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNitrogenVehicleFilter("MOBIL")}
                    className={`py-2 px-4 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                      nitrogenVehicleFilter === "MOBIL"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>Mobil</span>
                  </button>
                </div>
              </div>

              {/* Informational Workflow Banner (Image 1) */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <span className="font-extrabold">Alur Otomatisasi Hardware:</span> Memilih varian akan mengirim sinyal WebSocket ke ESP32 katup solenoid, auto-capture CCTV plat nomor, dan cetak struk via Bluetooth thermal printer.
                </div>
              </div>

              {/* 3 Variants Nitrogen Cards: Isi Baru, Isi Tambah, Tambal Ban */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {nitrogenProducts.map((p) => {
                  return (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="group bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-400 rounded-3xl p-5 cursor-pointer shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-slate-100 group-hover:bg-emerald-100 text-emerald-700 rounded-2xl transition-colors">
                            {p.vehicleType === "MOTOR" ? <Bike className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                          </div>
                          <span className="bg-emerald-50 text-emerald-800 text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>{p.timerSeconds} Detik</span>
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-900 transition-colors">
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {p.serviceVariant === "ISI_BARU"
                            ? "Kuras dan pengisian murni nitrogen 100%"
                            : p.serviceVariant === "ISI_TAMBAH"
                            ? "Penambahan tekanan angin ban standar"
                            : "Perbaikan ban bocor dan pengisian nitrogen"}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-base font-black text-emerald-700 tabular-nums">
                          {formatRupiah(p.price)}
                        </span>
                        <span className="bg-emerald-600 group-hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-xs transition-colors flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pilih</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LAYANAN LAINNYA (Image 1: Ganti Oli, Minyak Rem, Cairan Tubles) */}
          {activeTab === "LAYANAN_LAINNYA" && (
            <div className="space-y-4">
              {/* Sub-category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "ALL", label: "Semua Produk" },
                  { id: "OLI", label: "Ganti Oli" },
                  { id: "MINYAK_REM", label: "Ganti Minyak Rem" },
                  { id: "TUBLES", label: "Cairan Tubles" },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setServiceFilter(pill.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      serviceFilter === pill.id
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Search Barcode & Name */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Scan Barcode atau ketik nama oli / produk..."
                  className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 shadow-xs"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Informational Banner */}
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Droplets className="w-4 h-4" />
                </div>
                <div className="text-xs text-blue-900 leading-relaxed">
                  <span className="font-extrabold">Digital Stock-Lock:</span> Wajib memotret botol oli bekas / sparepart yang diganti saat checkout untuk memastikan stok fisik berkurang secara transparan.
                </div>
              </div>

              {/* Layanan Lainnya Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {otherProducts.map((p) => {
                  const isOutOfStock = p.stock <= 0
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      className={`bg-white border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                        isOutOfStock
                          ? "opacity-50 border-slate-200 cursor-not-allowed bg-slate-50"
                          : "border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer hover:bg-blue-50/30"
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Droplets className="w-4 h-4" />
                          </div>
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
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          <span>Pilih</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customer CRM & Cart Checkout Panel */}
        <div className="w-full lg:w-96 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col shadow-sm">
          {/* Cart Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Keranjang Transaksi</h2>
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

          {/* Customer CRM Input Fields */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 space-y-2.5">
            <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Data Pelanggan & Kendaraan</span>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-1">
                Plat Nomor Kendaraan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerPlate}
                onChange={(e) => setCustomerPlate(e.target.value.toUpperCase())}
                placeholder="Contoh: B 1234 ABC"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama (Opsional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">No. WhatsApp</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0812..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2.5 divide-y divide-slate-100 max-h-64 lg:max-h-none">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium">Keranjang masih kosong.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pilih layanan nitrogen atau oli di sebelah kiri.
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
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 w-5 text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-sm flex items-center justify-center"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Interlocking Audit Badges (Image 1 Requirement) */}
          {cart.length > 0 && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Bukti Audit Visual (Interlocking)
              </div>

              {hasNitrogenInCart && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Bike className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-slate-800">Foto Plat Kendaraan</span>
                  </div>
                  {vehiclePhotoUrl ? (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Terlampir</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCameraModalType("NITROGEN_PLATE")}
                      className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-md flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Ambil Foto</span>
                    </button>
                  )}
                </div>
              )}

              {hasOtherInCart && (
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">Foto Botol / Pengerjaan</span>
                  </div>
                  {usedBottlePhotoUrl ? (
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Terlampir</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCameraModalType("RETAIL_BOTTLE")}
                      className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 px-2.5 py-1 rounded-md flex items-center gap-1"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Ambil Foto</span>
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
                  {(["CASH", "QRIS", "TRANSFER"] as const).map((method) => {
                    const MethodIcon = method === "CASH" ? Banknote : method === "QRIS" ? QrCode : CreditCard
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          paymentMethod === method
                            ? "bg-slate-900 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        <MethodIcon className="w-3.5 h-3.5" />
                        <span>{method}</span>
                      </button>
                    )
                  })}
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
                    placeholder={`Nomor tunai (min: ${formatRupiah(subtotal)})`}
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
                      {hasNitrogenInCart ? "Proses & Buka Katup Gas" : "Selesaikan Transaksi"}
                    </span>
                    <ArrowRight className="w-4 h-4" />
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

      {/* Solenoid Countdown Modal (Active valve timer) */}
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

      {/* Post-Checkout Success & Bluetooth Printer Modal */}
      {showSuccessModal && completedTx && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-emerald-600 text-white p-5 text-center relative">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-black">Transaksi Berhasil Disimpan</h3>
              <p className="text-xs text-emerald-100">
                Nota: <span className="font-mono font-bold">{completedTx.id}</span>
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Receipt Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 space-y-1">
                <div className="text-center font-bold text-slate-900 border-b border-dashed border-slate-300 pb-2 mb-2">
                  {selectedBranch.name.toUpperCase()}
                  <div className="text-[10px] font-normal text-slate-500">POS OUTLET NITROGEN TERINTEGRASI</div>
                </div>
                <div className="flex justify-between">
                  <span>Plat Kendaraan:</span>
                  <span className="font-bold">{completedTx.customerPlate || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{new Date(completedTx.createdAt).toLocaleTimeString("id-ID")}</span>
                </div>
                <div className="border-t border-dashed border-slate-300 my-2 pt-1">
                  {completedTx.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>{it.quantity}x {it.productName}</span>
                      <span>{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-1 text-sm">
                  <span>TOTAL:</span>
                  <span className="text-emerald-700">{formatRupiah(completedTx.totalAmount)}</span>
                </div>
              </div>

              {/* Hardware Actions: Bluetooth Printer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-slate-700" />
                    <span>Cetak Struk Thermal Bluetooth</span>
                  </span>
                  <div className="flex gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPrinterSize("58mm")}
                      className={`px-2 py-0.5 rounded ${printerSize === "58mm" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"}`}
                    >
                      58mm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrinterSize("80mm")}
                      className={`px-2 py-0.5 rounded ${printerSize === "80mm" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"}`}
                    >
                      80mm
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePrintWebBluetooth}
                    className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Direct Web Bluetooth</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintRawBt}
                    className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5"
                  >
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    <span>RawBT Helper (Android)</span>
                  </button>
                </div>

                {printStatus && (
                  <p className="text-[11px] text-center text-slate-600 font-medium bg-slate-100 py-1 rounded-lg">
                    {printStatus}
                  </p>
                )}
              </div>

              {/* WhatsApp Reminder Button */}
              {completedTx.customerPhone && (
                <button
                  type="button"
                  onClick={handleSendWhatsAppReceipt}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200 transition-colors"
                >
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>Kirim Struk & Pengingat ke WhatsApp Pelanggan</span>
                </button>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false)
                  setCompletedTx(null)
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all"
              >
                Transaksi Selesai & Buka Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
