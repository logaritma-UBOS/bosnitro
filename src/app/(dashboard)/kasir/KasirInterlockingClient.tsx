"use client"

import { useState, useMemo, useEffect } from "react"
import { useBranch } from "@/context/BranchContext"
import { InterlockingProduct, InterlockingTransaction } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import BranchSelector from "@/components/branch/BranchSelector"
import AuditCameraModal from "@/components/pos/AuditCameraModal"
import SolenoidCountdownModal from "@/components/pos/SolenoidCountdownModal"
import Link from "next/link"
import {
  formatTextReceipt,
  printDirectWebBluetooth,
  getRawBtIntentUrl,
} from "@/lib/bluetoothPrinter"
import {
  User,
  LogOut,
  Video,
  Wifi,
  Bluetooth,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  XCircle,
  RefreshCcw,
  Wrench,
  CheckCircle,
  ChevronLeft,
  ScanLine,
  Camera,
  Search,
  X,
  Droplets,
  Radio,
  Printer,
  Smartphone,
  Send,
  Sparkles,
  Bike,
  Car,
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

  // Layout & Navigation States matching pos-kasir
  const [activeTab, setActiveTab] = useState<"nitrogen" | "retail">("nitrogen")
  const [vehicleType, setVehicleType] = useState<"motor" | "mobil" | null>(null)
  const [mobileView, setMobileView] = useState<"products" | "cart">("products")
  const [serviceFilter, setServiceFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([])
  const [lastCart, setLastCart] = useState<CartItem[] | null>(null)

  // Customer CRM Form
  const [customerPlate, setCustomerPlate] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")

  // Interlocking Hardware & Photo Audit State
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState<string | null>(null)
  const [usedBottlePhotoUrl, setUsedBottlePhotoUrl] = useState<string | null>(null)
  const [cameraModalType, setCameraModalType] = useState<"NITROGEN_PLATE" | "RETAIL_BOTTLE" | null>(null)

  // Hardware Status Indicator States
  const [cameraStatus, setCameraStatus] = useState<"Ready" | "Off">("Ready")
  const [iotStatus, setIotStatus] = useState<"Online" | "Offline">("Online")
  const [printerConnected, setPrinterConnected] = useState(false)

  // Solenoid valve execution state
  const [solenoidModalOpen, setSolenoidModalOpen] = useState(false)
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(15)
  const [activeServiceName, setActiveServiceName] = useState("")
  const [lastReceiptNumber, setLastReceiptNumber] = useState("")

  // Checkout & Payment Modal States
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "payment">("cart")
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS" | "TRANSFER">("CASH")
  const [cashReceived, setCashReceived] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [completedTx, setCompletedTx] = useState<InterlockingTransaction | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [printStatus, setPrintStatus] = useState<string | null>(null)
  const [printerSize, setPrinterSize] = useState<"58mm" | "80mm">("58mm")

  // Sync products dynamically per selected branch
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

  // Cart operations
  const addToCart = (product: InterlockingProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        if (
          (product.category === "RETAIL" || product.category === "LAYANAN_LAINNYA") &&
          existing.quantity >= product.stock
        ) {
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

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
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

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [cart])

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }, [cart])

  const hasNitrogenInCart = useMemo(() => {
    return cart.some((item) => item.product.category === "NITROGEN")
  }, [cart])

  const hasOtherInCart = useMemo(() => {
    return cart.some(
      (item) => item.product.category === "RETAIL" || item.product.category === "LAYANAN_LAINNYA"
    )
  }, [cart])

  const nitrogenItem = useMemo(() => {
    return cart.find((item) => item.product.category === "NITROGEN")
  }, [cart])

  // Bluetooth connect toggle
  const handleConnectPrinter = async () => {
    try {
      setPrinterConnected(true)
    } catch {
      setPrinterConnected(false)
    }
  }

  // Reprint last receipt
  const reprintLastReceipt = () => {
    if (completedTx) {
      setShowSuccessModal(true)
    } else {
      alert("Belum ada struk transaksi sebelumnya untuk dicetak ulang.")
    }
  }

  // Interlocking verification & Proceed to Payment
  const handleStartPengerjaan = () => {
    if (cart.length === 0) return

    // 1. Mandatory Plate Check
    if (hasNitrogenInCart && !customerPlate.trim()) {
      alert("Harap masukkan Plat Nomor Kendaraan pelanggan terlebih dahulu!")
      return
    }

    // 2. Interlock Check for Nitrogen: Photo Plat
    if (hasNitrogenInCart && !vehiclePhotoUrl) {
      setCameraModalType("NITROGEN_PLATE")
      return
    }

    // 3. Interlock Check for Other Service: Photo Botol/Part
    if (hasOtherInCart && !usedBottlePhotoUrl) {
      setCameraModalType("RETAIL_BOTTLE")
      return
    }

    // Open Payment Modal
    setCheckoutStep("payment")
    setCashReceived(totalAmount)
  }

  const handlePhotoCaptured = (photoUrl: string) => {
    if (cameraModalType === "NITROGEN_PLATE") {
      setVehiclePhotoUrl(photoUrl)
      setCameraModalType(null)
      if (hasOtherInCart && !usedBottlePhotoUrl) {
        setTimeout(() => setCameraModalType("RETAIL_BOTTLE"), 250)
      } else {
        setCheckoutStep("payment")
        setCashReceived(totalAmount)
      }
    } else if (cameraModalType === "RETAIL_BOTTLE") {
      setUsedBottlePhotoUrl(photoUrl)
      setCameraModalType(null)
      setCheckoutStep("payment")
      setCashReceived(totalAmount)
    }
  }

  // Selesaikan Pembayaran & Lunasi
  const handleSelesaikanPembayaran = async () => {
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
        totalAmount,
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
      setLastCart([...cart])

      // Trigger IoT Solenoid Valve if Nitrogen was in cart
      if (hasNitrogenInCart && nitrogenItem) {
        const timerSecs = nitrogenItem.product.timerSeconds || 15
        setActiveTimerSeconds(timerSecs)
        setActiveServiceName(nitrogenItem.product.name)
        setLastReceiptNumber(tx.id)

        fetch("/api/hardware/iot-trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: selectedBranchId,
            durationSeconds: timerSecs,
            vehicleType: vehicleType ? vehicleType.toUpperCase() : "MOTOR",
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

      setCheckoutStep("cart")
      setShowSuccessModal(true)
      clearCart()
      if (mobileView === "cart") setMobileView("products")
    } catch (e: any) {
      alert("Error Checkout: " + e.message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Bluetooth Printing Handlers
  const handlePrintWebBluetooth = async () => {
    if (!completedTx) return
    setPrintStatus("Menghubungkan ke printer Bluetooth...")
    try {
      const receiptText = formatTextReceipt(
        completedTx,
        selectedBranch.name || "AL-KAHFI NITROGEN",
        printerSize,
        "TERIMA KASIH - TEKANAN BAN AMAN"
      )
      const res = await printDirectWebBluetooth(receiptText)
      setPrintStatus(res.message)
    } catch (e: any) {
      setPrintStatus("Error: " + (e.message || "Gagal mencetak Bluetooth"))
    }
  }

  const handlePrintRawBt = () => {
    if (!completedTx) return
    const receiptText = formatTextReceipt(
      completedTx,
      selectedBranch.name || "AL-KAHFI NITROGEN",
      printerSize,
      "TERIMA KASIH - TEKANAN BAN AMAN"
    )
    const rawBtUrl = getRawBtIntentUrl(receiptText)
    window.location.href = rawBtUrl
  }

  const handleSendWhatsAppReceipt = () => {
    if (!completedTx) return
    const phone = completedTx.customerPhone || customerPhone
    const cleanPhone = (phone || "").replace(/[^0-9]/g, "")
    const targetPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone
    if (!targetPhone) {
      alert("Nomor WhatsApp pelanggan tidak tersedia.")
      return
    }

    const itemsSummary = completedTx.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")
    const msg = `Halo Kak ${completedTx.customerName || "Pelanggan"}! 🚗💨\n\nTerima kasih telah servis di *${selectedBranch.name}*.\n*No. Transaksi:* ${completedTx.id}\n*Plat Kendaraan:* ${completedTx.customerPlate || "-"}\n*Layanan:* ${itemsSummary}\n*Total Tagihan:* ${formatRupiah(completedTx.totalAmount)}\n*Metode:* ${completedTx.paymentMethod}\n\nTekanan ban & oli Anda kini prima. Sampai jumpa di servis berikutnya!`

    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  const kembalian = Math.max(0, cashReceived - totalAmount)

  return (
    <div className="flex flex-col min-h-screen md:h-screen bg-gray-50 font-sans md:overflow-hidden">
      {/* ===== HEADER INFO (STYLE POS-KASIR) ===== */}
      <header className="bg-gradient-to-r from-red-600 to-red-700 shadow-md border-b-4 border-[#012B89] px-4 lg:px-6 py-2 flex flex-col md:flex-row justify-between items-center z-10 gap-3 shrink-0">
        <div className="flex items-center space-x-3 md:space-x-5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center space-x-3 text-white">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-black text-xl text-yellow-300 shadow-inner">
              ⚡
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm md:text-lg leading-tight drop-shadow-md uppercase text-white">
                {selectedBranch.name}
              </span>
              <span className="text-[10px] font-bold text-yellow-300">Outlet Nitrogen Al-Kahfi</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3 border-l border-white/20 pl-3 md:pl-5">
            <div className="flex items-center space-x-1.5 text-white">
              <User size={16} />
              <span className="font-medium text-xs md:text-sm drop-shadow-md truncate max-w-[120px] sm:max-w-none">
                Kasir: {user?.name || "Petugas Shift"}
              </span>
            </div>
            <Link
              href="/shift-closing"
              className="px-2.5 py-1 md:px-3 md:py-1.5 bg-yellow-400 text-red-700 hover:bg-yellow-300 rounded-lg text-xs md:text-sm font-black transition-colors shadow-sm flex items-center space-x-1"
            >
              <LogOut size={13} />
              <span>Tutup Shift</span>
            </Link>
          </div>
        </div>

        <div
          className="flex items-center flex-nowrap gap-1.5 md:gap-2 w-full md:w-auto justify-start md:justify-end overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* Branch Switcher Dropdown */}
          <div className="shrink-0 max-w-[170px]">
            <BranchSelector />
          </div>

          {/* Status Kamera */}
          <div
            className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold ${
              cameraStatus === "Ready" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            <Video size={13} />
            <span>Cam: {cameraStatus}</span>
          </div>

          {/* Status IoT */}
          <div
            className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold ${
              iotStatus === "Online" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            <Wifi size={13} />
            <span>IoT: {iotStatus}</span>
          </div>

          {/* Status Printer */}
          <button
            onClick={handleConnectPrinter}
            className={`shrink-0 flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] md:text-xs font-semibold transition-all hover:ring-2 hover:ring-blue-300 ${
              printerConnected
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer"
            }`}
          >
            <Bluetooth size={13} />
            <span>Printer: {printerConnected ? "Connected" : "Connect"}</span>
          </button>
        </div>
      </header>

      {/* ===== MAIN CONTENT AREA (SPLIT LAYOUT) ===== */}
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden relative">
        {/* Kiri: Area Produk */}
        <div
          className={`flex-1 flex flex-col p-3 md:p-4 space-y-4 md:overflow-y-auto pb-24 md:pb-4 ${
            mobileView === "cart" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Header Tabs */}
          <div className="flex space-x-2 p-1 bg-white rounded-xl shadow-sm border shrink-0">
            <button
              onClick={() => setActiveTab("nitrogen")}
              className={`flex-1 py-2.5 md:py-3 text-sm md:text-base font-bold rounded-lg transition-colors ${
                activeTab === "nitrogen"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Layanan Nitrogen
            </button>
            <button
              onClick={() => setActiveTab("retail")}
              className={`flex-1 py-2.5 md:py-3 text-sm md:text-base font-bold rounded-lg transition-colors ${
                activeTab === "retail"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              Ritel & Aksesoris
            </button>
          </div>

          {/* Area Produk Grid */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border p-3 md:p-4 min-h-[350px]">
            {activeTab === "nitrogen" && (
              <div className="flex flex-col h-full">
                {vehicleType === null ? (
                  /* Big Vehicle Choice Cards (Motor vs Mobil) */
                  <div className="grid grid-cols-2 gap-4 h-full p-2 my-auto">
                    <button
                      onClick={() => setVehicleType("motor")}
                      className="bg-white border-2 border-gray-100 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center justify-center p-6 group cursor-pointer"
                    >
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-5xl sm:text-7xl">🏍️</span>
                      </div>
                      <span className="font-black text-xl sm:text-2xl text-gray-800">Motor</span>
                      <span className="text-gray-500 font-medium text-xs sm:text-sm mt-1">
                        Pilih layanan Motor
                      </span>
                    </button>

                    <button
                      onClick={() => setVehicleType("mobil")}
                      className="bg-white border-2 border-gray-100 rounded-3xl hover:border-blue-500 hover:shadow-xl transition-all flex flex-col items-center justify-center p-6 group cursor-pointer"
                    >
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="text-5xl sm:text-7xl">🚗</span>
                      </div>
                      <span className="font-black text-xl sm:text-2xl text-gray-800">Mobil</span>
                      <span className="text-gray-500 font-medium text-xs sm:text-sm mt-1">
                        Pilih layanan Mobil
                      </span>
                    </button>
                  </div>
                ) : (
                  /* Service Variants for Chosen Vehicle */
                  <>
                    <div className="flex items-center space-x-3 mb-4 bg-gray-50 p-2 rounded-xl">
                      <button
                        onClick={() => setVehicleType(null)}
                        className="p-2.5 bg-white border shadow-sm rounded-lg hover:bg-gray-100 font-bold text-xs md:text-sm text-gray-700 transition-all cursor-pointer"
                      >
                        &larr; Kembali
                      </button>
                      <div className="font-bold text-gray-800 text-sm md:text-base flex items-center">
                        <span className="mr-2 text-2xl">{vehicleType === "motor" ? "🏍️" : "🚗"}</span>
                        Varian Layanan {vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-4">
                      {products
                        .filter(
                          (p) =>
                            p.category === "NITROGEN" &&
                            p.vehicleType === (vehicleType === "motor" ? "MOTOR" : "MOBIL")
                        )
                        .map((product) => (
                          <button
                            key={product.id}
                            onClick={() => addToCart(product)}
                            className="w-full p-4 md:p-5 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50/50 bg-white transition-all flex items-center justify-between group shadow-sm hover:shadow-md cursor-pointer text-left"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                                {product.serviceType === "FULL" || product.variant === "ISI_BARU" ? (
                                  <Plus size={24} />
                                ) : product.serviceType === "TAMBAH" || product.variant === "ISI_TAMBAH" ? (
                                  <RefreshCcw size={24} />
                                ) : (
                                  <Wrench size={24} />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-gray-800 text-base md:text-lg block">
                                  {product.name}
                                </span>
                                <span className="text-gray-500 text-xs md:text-sm font-medium">
                                  {product.serviceType === "FULL" || product.variant === "ISI_BARU"
                                    ? "Pengurasan & Isi Ulang Nitrogen"
                                    : product.serviceType === "TAMBAH" || product.variant === "ISI_TAMBAH"
                                    ? "Penambahan Tekanan Angin Standar"
                                    : "Perbaikan Ban Bocor & Pengisian"}
                                </span>
                              </div>
                            </div>
                            <span className="text-blue-600 font-black text-lg md:text-xl shrink-0 tabular-nums">
                              {formatRupiah(product.price)}
                            </span>
                          </button>
                        ))}

                      {products.filter(
                        (p) =>
                          p.category === "NITROGEN" &&
                          p.vehicleType === (vehicleType === "motor" ? "MOTOR" : "MOBIL")
                      ).length === 0 && (
                        <div className="text-center p-8 text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                          Belum ada layanan untuk {vehicleType}.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "retail" && (
              <div className="space-y-4">
                {/* Search Barcode & Name */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Scan Barcode atau cari nama oli / produk..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Sub-category Filter Pills */}
                  <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { id: "ALL", label: "Semua" },
                      { id: "OLI", label: "Oli Mesin" },
                      { id: "MINYAK_REM", label: "Minyak Rem" },
                      { id: "TUBLES", label: "Cairan Tubles" },
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        onClick={() => setServiceFilter(pill.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          serviceFilter === pill.id
                            ? "bg-blue-600 text-white shadow-xs"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Retail Products Grid (2-3 columns) */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mt-4">
                  {products
                    .filter((p) => {
                      if (p.category === "NITROGEN") return false
                      if (serviceFilter !== "ALL") {
                        if (serviceFilter === "OLI" && p.variant !== "GANTI_OLI") return false
                        if (serviceFilter === "MINYAK_REM" && p.variant !== "MINYAK_REM") return false
                        if (serviceFilter === "TUBLES" && p.variant !== "TUBLES") return false
                      }
                      if (!searchQuery.trim()) return true
                      const q = searchQuery.toLowerCase()
                      return (
                        p.name.toLowerCase().includes(q) ||
                        (p.barcode && p.barcode.toLowerCase().includes(q))
                      )
                    })
                    .map((product) => {
                      const isOutOfStock = product.stock <= 0
                      return (
                        <button
                          key={product.id}
                          disabled={isOutOfStock}
                          onClick={() => !isOutOfStock && addToCart(product)}
                          className={`p-3.5 border rounded-2xl transition-all flex flex-col justify-between text-left group overflow-hidden ${
                            isOutOfStock
                              ? "opacity-50 border-gray-200 bg-gray-50 cursor-not-allowed"
                              : "border-gray-200 hover:border-blue-500 hover:shadow-lg bg-white cursor-pointer"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Droplets size={18} />
                              </div>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  product.stock > 10
                                    ? "bg-green-100 text-green-800"
                                    : product.stock > 0
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                Stok: {product.stock}
                              </span>
                            </div>
                            <span className="text-xs md:text-sm font-bold text-gray-800 line-clamp-2 block mb-1">
                              {product.name}
                            </span>
                            {product.barcode && (
                              <span className="text-[10px] font-mono text-gray-400 block mb-2">
                                SKU: {product.barcode}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-gray-900 font-black text-sm md:text-base tabular-nums">
                              {formatRupiah(product.price)}
                            </span>
                            <span className="text-blue-600 bg-blue-50 group-hover:bg-blue-600 group-hover:text-white p-1 rounded-lg transition-colors">
                              <Plus size={14} />
                            </span>
                          </div>
                        </button>
                      )
                    })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Cart Button for Mobile */}
        {cart.length > 0 && mobileView === "products" && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_20px_rgba(0,0,0,0.08)] z-30">
            <button
              onClick={() => setMobileView("cart")}
              className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-bold flex justify-between items-center shadow-lg active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center space-x-2">
                <div className="bg-blue-800/60 px-2 py-0.5 rounded-md text-xs font-black">
                  {totalItemsCount}
                </div>
                <span className="text-sm">Lihat Keranjang</span>
              </div>
              <div className="flex items-center space-x-2 font-black text-sm">
                <span>{formatRupiah(totalAmount)}</span>
                <span>&rarr;</span>
              </div>
            </button>
          </div>
        )}

        {/* ===== KANAN: CART DRAWER (STYLE POS-KASIR) ===== */}
        <div
          className={`w-full md:w-[340px] lg:w-[420px] bg-white shadow-xl flex-col border-t md:border-t-0 md:border-l border-gray-200 z-10 relative shrink-0 md:h-full ${
            mobileView === "cart" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Dark Header */}
          <div className="p-3 md:p-4 bg-gray-800 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2 md:space-x-3">
              <button
                onClick={() => setMobileView("products")}
                className="md:hidden p-1 bg-gray-700 hover:bg-gray-600 rounded-md mr-1 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <ShoppingCart size={20} className="text-yellow-400" />
              <h2 className="text-sm md:text-base font-bold">Pesanan Saat Ini</h2>
            </div>
            <div className="bg-gray-700 px-2.5 py-1 rounded-full text-xs font-bold">
              {totalItemsCount} Item
            </div>
          </div>

          {/* CRM Pelanggan & Kendaraan */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                <Sparkles size={11} className="text-blue-600" />
                Data Pelanggan & Audit
              </span>
              <span className="text-[10px] text-gray-400 font-semibold">{selectedBranch.name}</span>
            </div>
            <div>
              <input
                type="text"
                value={customerPlate}
                onChange={(e) => setCustomerPlate(e.target.value.toUpperCase())}
                placeholder="Plat Nomor Kendaraan (Contoh: B 1234 ABC) *"
                className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama Pelanggan"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="No. WhatsApp"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Interlocking Photo Badges */}
            {cart.length > 0 && (
              <div className="pt-1 flex gap-1.5">
                {hasNitrogenInCart && (
                  <button
                    type="button"
                    onClick={() => setCameraModalType("NITROGEN_PLATE")}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition-all ${
                      vehiclePhotoUrl
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-amber-50 border-amber-300 text-amber-700 animate-pulse"
                    }`}
                  >
                    <Camera size={11} />
                    <span>{vehiclePhotoUrl ? "Foto Plat ✅" : "Wajib Foto Plat 📷"}</span>
                  </button>
                )}
                {hasOtherInCart && (
                  <button
                    type="button"
                    onClick={() => setCameraModalType("RETAIL_BOTTLE")}
                    className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 border transition-all ${
                      usedBottlePhotoUrl
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-blue-50 border-blue-300 text-blue-700"
                    }`}
                  >
                    <Droplets size={11} />
                    <span>{usedBottlePhotoUrl ? "Foto Botol ✅" : "Foto Botol Bekas 📸"}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-2 min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-3 py-10 md:py-16">
                <ShoppingCart size={48} className="mb-2 md:w-16 md:h-16 text-gray-200" />
                <p className="text-sm md:text-base font-medium text-gray-400">Keranjang Kosong</p>
                <p className="text-xs text-gray-400">Pilih layanan nitrogen atau ritel di sebelah kiri</p>
              </div>
            ) : (
              <div className="space-y-2 p-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex justify-between items-center p-2.5 md:p-3 bg-white border border-gray-100 shadow-xs rounded-xl shrink-0"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-gray-800 text-xs md:text-sm leading-tight">
                        {item.product.name}
                      </div>
                      <div className="text-[11px] md:text-xs text-gray-500 font-medium mt-0.5 tabular-nums">
                        {formatRupiah(item.product.price)} / item
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 md:space-x-1.5 shrink-0">
                      <div className="flex items-center bg-gray-50 rounded-lg p-0.5 border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1 md:p-1.5 text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          <Minus size={13} className="stroke-[3]" />
                        </button>
                        <span className="font-black w-5 md:w-6 text-center text-xs md:text-sm text-gray-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1 md:p-1.5 text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          <Plus size={13} className="stroke-[3]" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="p-1 md:p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Panel Footer */}
          <div className="bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.03)] p-3 md:p-4 shrink-0 z-20">
            {/* Top Bar Actions */}
            <div className="flex justify-between items-center mb-3">
              <div className="flex space-x-1.5 md:space-x-2">
                <button
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="p-1.5 md:px-3 md:py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                  title="Batalkan Transaksi"
                >
                  <XCircle size={15} />
                  <span>Batal</span>
                </button>
                <button
                  onClick={reprintLastReceipt}
                  disabled={!completedTx}
                  className="p-1.5 md:px-3 md:py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                  title="Cetak Ulang Struk"
                >
                  <RefreshCcw size={15} />
                  <span>Reprint</span>
                </button>
              </div>
            </div>

            {/* Main Checkout Button */}
            <button
              onClick={handleStartPengerjaan}
              disabled={cart.length === 0 || isProcessing}
              className={`w-full p-3.5 md:p-4 rounded-xl flex justify-between items-center transition-all shadow-md group ${
                cart.length === 0
                  ? "bg-gray-300 shadow-none cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-blue-500/30 cursor-pointer"
              }`}
            >
              <div className="flex items-center space-x-2 text-white/90 group-hover:text-white">
                <Wrench size={20} />
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider">
                  {hasNitrogenInCart ? "PROSES TRANSAKSI & KATUP" : "PROSES TRANSAKSI"}
                </span>
              </div>
              <div className="text-white text-lg md:text-xl font-black text-right leading-none tabular-nums">
                <span className="text-[10px] md:text-xs font-medium opacity-80 block mb-0.5 text-right uppercase tracking-wider">
                  Total
                </span>
                {formatRupiah(totalAmount)}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ===== SECURE PAYMENT MODAL (STYLE POS-KASIR) ===== */}
      {checkoutStep === "payment" && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col items-center space-y-5 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setCheckoutStep("cart")}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center space-y-1 mb-2">
              <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-inner border-4 bg-green-50 text-green-600 border-green-100 mb-2">
                <CheckCircle size={32} strokeWidth={3} />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
                Pembayaran Pelanggan
              </h2>
              <p className="text-gray-500 font-medium text-xs md:text-sm">
                Cabang: <span className="font-bold text-gray-700">{selectedBranch.name}</span> &bull; Plat:{" "}
                <span className="font-bold text-gray-800">{customerPlate || "-"}</span>
              </p>
            </div>

            {/* Payment Collection Form */}
            <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-600 uppercase">Tagihan Pelanggan</span>
                <span className="text-2xl font-black text-blue-600 tabular-nums">
                  {formatRupiah(totalAmount)}
                </span>
              </div>

              {/* Payment Methods */}
              <div className="flex bg-gray-200 p-1 rounded-xl">
                {(["CASH", "QRIS", "TRANSFER"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                      paymentMethod === m
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {m === "CASH" ? "TUNAI" : m}
                  </button>
                ))}
              </div>

              {paymentMethod === "CASH" && (
                <div className="space-y-3">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={cashReceived || ""}
                        onChange={(e) => setCashReceived(Number(e.target.value))}
                        placeholder="0"
                        className="w-full text-right text-lg font-bold pl-8 pr-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-900 bg-white transition-all tabular-nums"
                      />
                    </div>
                    <div className="w-[125px] flex flex-col justify-center px-3 bg-gray-200 rounded-xl shrink-0">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Kembali</span>
                      <span
                        className={`font-black text-sm leading-none mt-1 tabular-nums ${
                          kembalian > 0 ? "text-green-600" : "text-gray-700"
                        }`}
                      >
                        {formatRupiah(kembalian)}
                      </span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCashReceived(totalAmount)}
                      className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-xs"
                    >
                      Uang Pas
                    </button>
                    <button
                      onClick={() => setCashReceived(50000)}
                      className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-xs"
                    >
                      50rb
                    </button>
                    <button
                      onClick={() => setCashReceived(100000)}
                      className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-blue-50 hover:border-blue-300 transition-colors shadow-xs"
                    >
                      100rb
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleSelesaikanPembayaran}
              disabled={isProcessing || (paymentMethod === "CASH" && cashReceived < totalAmount)}
              className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-base shadow-xl shadow-gray-900/20 transition-all flex justify-center items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <span className="animate-pulse">Menyimpan & Memicu Katup...</span>
              ) : (
                <>
                  <Printer size={18} />
                  <span>LUNASI & CETAK STRUK</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== MANDATORY INTERLOCKING AUDIT CAMERA MODAL ===== */}
      {cameraModalType && (
        <AuditCameraModal
          isOpen={true}
          auditType={cameraModalType}
          onCaptureComplete={handlePhotoCaptured}
          onCancel={() => setCameraModalType(null)}
        />
      )}

      {/* ===== SOLENOID VALVE COUNTDOWN MODAL ===== */}
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

      {/* ===== POST-CHECKOUT SUCCESS & BLUETOOTH THERMAL PRINT MODAL ===== */}
      {showSuccessModal && completedTx && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-5 text-center relative">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-2">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-black">Transaksi Berhasil Disimpan</h3>
              <p className="text-xs text-yellow-300">
                No. Transaksi: <span className="font-mono font-bold">{completedTx.id}</span>
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Receipt Preview */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs text-slate-800 space-y-1">
                <div className="text-center font-bold text-slate-900 border-b border-dashed border-slate-300 pb-2 mb-2">
                  {selectedBranch.name.toUpperCase()}
                  <div className="text-[10px] font-normal text-slate-500">
                    OUTLET NITROGEN AL-KAHFI TERINTEGRASI
                  </div>
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
                      <span>
                        {it.quantity}x {it.productName}
                      </span>
                      <span>{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold border-t border-slate-300 pt-1 text-sm">
                  <span>TOTAL:</span>
                  <span className="text-blue-700">{formatRupiah(completedTx.totalAmount)}</span>
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
                      className={`px-2 py-0.5 rounded ${
                        printerSize === "58mm" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      58mm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrinterSize("80mm")}
                      className={`px-2 py-0.5 rounded ${
                        printerSize === "80mm" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      80mm
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePrintWebBluetooth}
                    className="py-3 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Direct Web Bluetooth</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintRawBt}
                    className="py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 border border-emerald-200 transition-colors cursor-pointer"
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
                className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
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
