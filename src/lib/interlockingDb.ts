import { Branch, InterlockingProduct, InterlockingTransaction, FraudAlert, ShiftClosing, DEFAULT_BRANCHES } from "@/types/branch"
import { supabase } from "@/lib/supabaseClient"
import { sendTelegramAlert } from "@/lib/telegram"
import { upsertCustomer } from "@/lib/crmDb"

// Dynamic runtime branches (starts with 1 initial branch from DEFAULT_BRANCHES, expandable)
let runtimeBranches: Branch[] = [...DEFAULT_BRANCHES]

// Dynamic runtime store settings
let runtimeStoreSettings = {
  storeName: "Toko meruvin",
  profileImage: null as string | null,
  telegramPhone: "083153598697",
  telegramChatId: null as string | null,
}

export async function getStoreSettings(): Promise<{
  storeName: string
  profileImage: string | null
  telegramPhone: string
  telegramChatId: string | null
}> {
  return runtimeStoreSettings
}

export async function updateStoreSettings(data: {
  storeName?: string
  profileImage?: string | null
  telegramPhone?: string
  telegramChatId?: string | null
}) {
  if (data.storeName !== undefined && data.storeName.trim()) runtimeStoreSettings.storeName = data.storeName.trim()
  if (data.profileImage !== undefined) runtimeStoreSettings.profileImage = data.profileImage
  if (data.telegramPhone !== undefined && data.telegramPhone.trim()) runtimeStoreSettings.telegramPhone = data.telegramPhone.trim()
  if (data.telegramChatId !== undefined) runtimeStoreSettings.telegramChatId = data.telegramChatId && data.telegramChatId.trim() ? data.telegramChatId.trim() : null
  return runtimeStoreSettings
}

export async function getBranches(): Promise<Branch[]> {
  try {
    const { data, error } = await supabase.from("branches").select("*")
    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
        id: d.id,
        name: d.name,
        location: d.location || "",
        deviceId: d.device_id || `ESP32-${d.name.toUpperCase().replace(/\s+/g, "-")}`,
        status: (d.status || "ONLINE") as "ONLINE" | "OFFLINE",
        createdAt: d.created_at,
      }))
    }
  } catch (e) {}

  return runtimeBranches
}

export async function createBranch(data: { name: string; location: string; deviceId?: string }): Promise<Branch> {
  const cleanName = data.name.trim()
  const cleanLocation = data.location.trim()
  const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")
  const branchId = `branch-${slug}-${Date.now().toString().slice(-4)}`

  const newBranch: Branch = {
    id: branchId,
    name: cleanName,
    location: cleanLocation,
    deviceId: data.deviceId?.trim() || `ESP32-${slug.toUpperCase()}`,
    status: "ONLINE",
    createdAt: new Date().toISOString(),
  }

  runtimeBranches.push(newBranch)

  // Auto-seed standard products for this new branch in runtime if needed
  try {
    await supabase.from("branches").insert({
      id: newBranch.id,
      name: newBranch.name,
      location: newBranch.location,
      device_id: newBranch.deviceId,
      status: "ONLINE",
    })
  } catch (e) {}

  return newBranch
}

export async function deleteBranch(id: string): Promise<boolean> {
  // Prevent deleting if only 1 branch left
  if (runtimeBranches.length <= 1) return false

  runtimeBranches = runtimeBranches.filter(b => b.id !== id)
  try {
    await supabase.from("branches").delete().eq("id", id)
  } catch (e) {}
  return true
}

// Base catalog template for initial branch seeding
const BASE_PRODUCTS_TEMPLATE: InterlockingProduct[] = [
  // 1. LAYANAN NITROGEN (IoT Trigger - Motor & Mobil)
  {
    id: "nitro-motor-baru",
    category: "NITROGEN",
    vehicleType: "MOTOR",
    serviceType: "FULL",
    variant: "ISI_BARU",
    name: "Nitrogen Motor - Isi Baru",
    price: 10000,
    costPrice: 1000,
    stock: 9999,
    timerSeconds: 35,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "nitro-motor-tambah",
    category: "NITROGEN",
    vehicleType: "MOTOR",
    serviceType: "TAMBAH",
    variant: "ISI_TAMBAH",
    name: "Nitrogen Motor - Isi Tambah",
    price: 5000,
    costPrice: 500,
    stock: 9999,
    timerSeconds: 15,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "nitro-motor-tambal",
    category: "NITROGEN",
    vehicleType: "MOTOR",
    serviceType: "TAMBAL",
    variant: "TAMBAL_BAN",
    name: "Tambal Ban Tubeless Motor",
    price: 15000,
    costPrice: 3000,
    stock: 9999,
    timerSeconds: 45,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "nitro-mobil-baru",
    category: "NITROGEN",
    vehicleType: "MOBIL",
    serviceType: "FULL",
    variant: "ISI_BARU",
    name: "Nitrogen Mobil - Isi Baru (4 Roda)",
    price: 25000,
    costPrice: 2500,
    stock: 9999,
    timerSeconds: 90,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "nitro-mobil-tambah",
    category: "NITROGEN",
    vehicleType: "MOBIL",
    serviceType: "TAMBAH",
    variant: "ISI_TAMBAH",
    name: "Nitrogen Mobil - Isi Tambah",
    price: 10000,
    costPrice: 1000,
    stock: 9999,
    timerSeconds: 30,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "nitro-mobil-tambal",
    category: "NITROGEN",
    vehicleType: "MOBIL",
    serviceType: "TAMBAL",
    variant: "TAMBAL_BAN",
    name: "Tambal Ban Tubeless Mobil",
    price: 35000,
    costPrice: 6000,
    stock: 9999,
    timerSeconds: 120,
    requiresPhoto: true,
    isActive: true,
  },

  // 2. LAYANAN LAINNYA (Digital Stock-Lock: Ganti Oli, Minyak Rem, Cairan Tubles)
  {
    id: "layanan-oli-mpx2",
    category: "LAYANAN_LAINNYA",
    vehicleType: "MOTOR",
    serviceType: null,
    variant: "GANTI_OLI",
    name: "Ganti Oli AHM MPX2 Matic 0.8L",
    price: 52000,
    costPrice: 42000,
    stock: 35,
    barcode: "8999901001",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "layanan-oli-shell",
    category: "LAYANAN_LAINNYA",
    vehicleType: "MOTOR",
    serviceType: null,
    variant: "GANTI_OLI",
    name: "Ganti Oli Shell Advance AX7 0.8L",
    price: 65000,
    costPrice: 53000,
    stock: 20,
    barcode: "8999901002",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "layanan-oli-yamalube",
    category: "LAYANAN_LAINNYA",
    vehicleType: "MOTOR",
    serviceType: null,
    variant: "GANTI_OLI",
    name: "Ganti Oli Yamalube Silver 0.8L",
    price: 48000,
    costPrice: 39000,
    stock: 15,
    barcode: "8999901003",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "layanan-oli-enduro",
    category: "LAYANAN_LAINNYA",
    vehicleType: "MOTOR",
    serviceType: null,
    variant: "GANTI_OLI",
    name: "Ganti Oli Enduro 4T Racing 1L",
    price: 58000,
    costPrice: 47000,
    stock: 18,
    barcode: "8999901004",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "layanan-oli-motul",
    category: "LAYANAN_LAINNYA",
    vehicleType: "MOTOR",
    serviceType: null,
    variant: "GANTI_OLI",
    name: "Ganti Oli Motul Scooter LE 0.8L",
    price: 75000,
    costPrice: 61000,
    stock: 10,
    barcode: "8999901006",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "layanan-minyak-rem-dot3",
    category: "LAYANAN_LAINNYA",
    vehicleType: null,
    serviceType: null,
    variant: "MINYAK_REM",
    name: "Kuras & Ganti Minyak Rem DOT 3 (300ml)",
    price: 35000,
    costPrice: 25000,
    stock: 25,
    barcode: "8999901010",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "layanan-minyak-rem-dot4",
    category: "LAYANAN_LAINNYA",
    vehicleType: null,
    serviceType: null,
    variant: "MINYAK_REM",
    name: "Kuras & Ganti Minyak Rem DOT 4 (300ml)",
    price: 45000,
    costPrice: 32000,
    stock: 15,
    barcode: "8999901011",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "layanan-cairan-tubles-350",
    category: "LAYANAN_LAINNYA",
    vehicleType: null,
    serviceType: null,
    variant: "TUBLES",
    name: "Isi Cairan Ban Tubeless M-One 350ml",
    price: 38000,
    costPrice: 26000,
    stock: 40,
    barcode: "8999901020",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "layanan-cairan-tubles-500",
    category: "LAYANAN_LAINNYA",
    vehicleType: null,
    serviceType: null,
    variant: "TUBLES",
    name: "Isi Cairan Ban Tubeless IML 500ml",
    price: 48000,
    costPrice: 33000,
    stock: 30,
    barcode: "8999901021",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
]

// Per-branch products catalog to guarantee complete isolation of prices, timers, and stock
const branchProductsMap: Record<string, InterlockingProduct[]> = {}

export function getBranchProductsList(branchId?: string): InterlockingProduct[] {
  const targetId = (!branchId || branchId === "ALL") ? "branch-utama" : branchId
  if (!branchProductsMap[targetId]) {
    // Clone base template with this branch's unique branchId
    branchProductsMap[targetId] = BASE_PRODUCTS_TEMPLATE.map(p => ({
      ...p,
      branchId: targetId
    }))
  }
  return branchProductsMap[targetId]
}

let runtimeTransactions: InterlockingTransaction[] = [
  // Transaksi Live Hari Ini (Sesuai Gambar 2)
  {
    id: "TX-TAMBUN-1024",
    branchId: "branch-utama",
    branchName: "Cabang Tambun",
    cashierName: "Budi Santoso",
    totalAmount: 10000,
    totalCostPrice: 1000,
    grossProfit: 9000,
    customerPlate: "B 2345 KZ",
    customerName: "Pak Bambang",
    customerPhone: "081234567890",
    vehiclePhotoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=600&q=80",
    usedBottlePhotoUrl: null,
    status: "COMPLETED",
    paymentMethod: "CASH",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 menit lalu
    items: [
      { productId: "nitro-motor-baru", productName: "Nitrogen Motor - Isi Baru", category: "NITROGEN", quantity: 1, price: 10000, costPrice: 1000, subtotal: 10000 }
    ]
  },
  {
    id: "TX-CIBITUNG1-1018",
    branchId: "branch-cibitung-1",
    branchName: "Cabang Cibitung 1",
    cashierName: "Rian Hidayat",
    totalAmount: 65000,
    totalCostPrice: 53000,
    grossProfit: 12000,
    customerPlate: "B 4567 TBD",
    customerName: "Mas Dimas",
    customerPhone: "085712345678",
    vehiclePhotoUrl: null,
    usedBottlePhotoUrl: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=600&q=80",
    status: "COMPLETED",
    paymentMethod: "QRIS",
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(), // 42 menit lalu
    items: [
      { productId: "layanan-oli-shell", productName: "Ganti Oli Shell Advance AX7 0.8L", category: "LAYANAN_LAINNYA", quantity: 1, price: 65000, costPrice: 53000, subtotal: 65000 }
    ]
  },
  {
    id: "TX-CIBITUNG2-1012",
    branchId: "branch-cibitung-2",
    branchName: "Cabang Cibitung 2",
    cashierName: "Doni Pratama",
    totalAmount: 25000,
    totalCostPrice: 2500,
    grossProfit: 22500,
    customerPlate: "B 6789 TY",
    customerName: "Ibu Ratna",
    customerPhone: "087890123456",
    vehiclePhotoUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=600&q=80",
    usedBottlePhotoUrl: null,
    status: "COMPLETED",
    paymentMethod: "CASH",
    createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString(), // 48 menit lalu
    items: [
      { productId: "nitro-mobil-baru", productName: "Nitrogen Mobil - Isi Baru (4 Roda)", category: "NITROGEN", quantity: 1, price: 25000, costPrice: 2500, subtotal: 25000 }
    ]
  },
  {
    id: "TX-CIBITUNG3-0955",
    branchId: "branch-cibitung-3",
    branchName: "Cabang Cibitung 3",
    cashierName: "Andi Saputra",
    totalAmount: 52000,
    totalCostPrice: 42000,
    grossProfit: 10000,
    customerPlate: "B 9981 SAA",
    customerName: "Pak Hendra",
    customerPhone: "081398765432",
    vehiclePhotoUrl: null,
    usedBottlePhotoUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=600&q=80",
    status: "COMPLETED",
    paymentMethod: "TRANSFER",
    createdAt: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    items: [
      { productId: "layanan-oli-mpx2", productName: "Ganti Oli AHM MPX2 Matic 0.8L", category: "LAYANAN_LAINNYA", quantity: 1, price: 52000, costPrice: 42000, subtotal: 52000 }
    ]
  },
  // Data histori transaksi 30 hari untuk analisis penjualan & sistem reward
  ...Array.from({ length: 29 }).map((_, idx) => {
    const dayAgo = idx + 1
    const branches = ["branch-utama", "branch-cibitung-1", "branch-cibitung-2", "branch-cibitung-3"]
    const branchNames = ["Cabang Tambun", "Cabang Cibitung 1", "Cabang Cibitung 2", "Cabang Cibitung 3"]
    const bIdx = idx % 4
    const amount = 2600000 + (Math.sin(idx) * 400000) // Variasi omzet harian ~2.6jt - 3jt (rata-rata di atas target 2.5jt)
    return {
      id: `TX-HIST-${dayAgo}`,
      branchId: branches[bIdx],
      branchName: branchNames[bIdx],
      cashierName: "Petugas Shift",
      totalAmount: Math.round(amount),
      totalCostPrice: Math.round(amount * 0.35),
      grossProfit: Math.round(amount * 0.65),
      customerPlate: `B ${1000 + idx} XYZ`,
      customerName: `Pelanggan #${idx + 1}`,
      customerPhone: `0812345678${(idx % 90).toString().padStart(2, "0")}`,
      vehiclePhotoUrl: null,
      usedBottlePhotoUrl: null,
      status: "COMPLETED" as const,
      paymentMethod: idx % 2 === 0 ? "CASH" : "QRIS",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * dayAgo).toISOString(),
      items: [
        { productId: "nitro-motor-tambah", productName: "Nitrogen Motor - Isi Tambah", category: "NITROGEN" as const, quantity: 20, price: 5000, costPrice: 500, subtotal: 100000 },
        { productId: "layanan-oli-shell", productName: "Ganti Oli Shell Advance AX7 0.8L", category: "LAYANAN_LAINNYA" as const, quantity: 38, price: 65000, costPrice: 53000, subtotal: 2470000 }
      ]
    }
  })
]

let runtimeFraudAlerts: FraudAlert[] = [
  {
    id: "alert-1",
    branchId: "branch-utama",
    branchName: "Cabang Tambun",
    deviceId: "ESP32-TAMBUN",
    alertType: "COMPRESSOR_OFF_HOURS",
    message: "Potensi Fraud - Kompresor Aktif",
    detectedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(), // 10:42
  },
  {
    id: "alert-2",
    branchId: "branch-cibitung-1",
    branchName: "Cabang Cibitung 1",
    deviceId: "ESP32-CIBITUNG-1",
    alertType: "UNAUTHORIZED_FLOW",
    message: "Pengisian Tanpa Transaksi POS",
    detectedAt: new Date(Date.now() - 1000 * 60 * 105).toISOString(), // 09:37
  },
  {
    id: "alert-3",
    branchId: "branch-cibitung-3",
    branchName: "Cabang Cibitung 3",
    deviceId: "ESP32-CIBITUNG-3",
    alertType: "DISCREPANCY",
    message: "Selisih Setoran Karyawan",
    detectedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 08:21
  },
  {
    id: "alert-4",
    branchId: "branch-cibitung-2",
    branchName: "Cabang Cibitung 2",
    deviceId: "ESP32-CIBITUNG-2",
    alertType: "COMPRESSOR_OFF_HOURS",
    message: "Kompresor Aktif di Luar Jam Operasional",
    detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(), // 02:15
  },
]
let runtimeShiftClosings: ShiftClosing[] = []

export async function getProducts(branchId?: string): Promise<InterlockingProduct[]> {
  try {
    const { data, error } = await supabase.from("products").select("*")
    if (!error && data && data.length > 0) {
      return data
        .filter((d: any) => !branchId || branchId === "ALL" || d.branch_id === branchId)
        .map((d: any) => ({
          id: d.id,
          branchId: d.branch_id,
          category: d.category,
          vehicleType: d.vehicle_type,
          serviceType: d.service_type,
          name: d.name,
          price: Number(d.price),
          costPrice: Number(d.cost_price || 0),
          stock: Number(d.stock || 0),
          barcode: d.barcode,
          timerSeconds: d.timer_seconds,
          requiresPhoto: d.requires_photo ?? true,
          imageUrl: d.image_url,
          isActive: d.is_active ?? true,
        }))
    }
  } catch (e) {}

  return getBranchProductsList(branchId)
}

export async function updateNitrogenItem(id: string, price: number, timerSeconds: number, branchId?: string) {
  const products = getBranchProductsList(branchId)
  const item = products.find(p => p.id === id)
  if (item) {
    item.price = price
    item.timerSeconds = timerSeconds
  }

  try {
    await supabase.from("products").update({ price, timer_seconds: timerSeconds }).eq("id", id)
  } catch (e) {}

  return item
}

export async function saveRetailProduct(data: {
  id?: string
  name: string
  barcode?: string
  price: number
  costPrice: number
  stock: number
  branchId?: string
}) {
  const targetBranch = data.branchId || "branch-utama"
  const products = getBranchProductsList(targetBranch)

  if (data.id) {
    const existing = products.find(p => p.id === data.id)
    if (existing) {
      existing.name = data.name
      existing.barcode = data.barcode
      existing.price = data.price
      existing.costPrice = data.costPrice
      existing.stock = data.stock
      existing.branchId = targetBranch
      return existing
    }
  }

  const newProd: InterlockingProduct = {
    id: `retail-${Date.now()}`,
    category: "RETAIL",
    vehicleType: null,
    serviceType: null,
    name: data.name,
    barcode: data.barcode,
    price: data.price,
    costPrice: data.costPrice,
    stock: data.stock,
    timerSeconds: 0,
    requiresPhoto: true,
    branchId: targetBranch,
    isActive: true
  }

  products.push(newProd)
  return newProd
}

export async function recordTransaction(payload: {
  branchId: string
  cashierId?: string | null
  cashierName?: string | null
  items: Array<{
    productId: string
    quantity: number
    price: number
    costPrice?: number
    category?: string
  }>
  totalAmount: number
  paymentMethod: string
  vehiclePhotoUrl?: string | null
  usedBottlePhotoUrl?: string | null
  customerPlate?: string | null
  customerName?: string | null
  customerPhone?: string | null
}): Promise<InterlockingTransaction> {
  const branch = runtimeBranches.find(b => b.id === payload.branchId) || DEFAULT_BRANCHES.find(b => b.id === payload.branchId) || { id: payload.branchId, name: "Cabang Outlet", location: "" }

  // Deduct retail / service stock from that branch's inventory
  const branchProds = getBranchProductsList(payload.branchId)
  for (const item of payload.items) {
    const product = branchProds.find(p => p.id === item.productId)
    if (product && (product.category === "RETAIL" || product.category === "LAYANAN_LAINNYA")) {
      product.stock = Math.max(0, product.stock - item.quantity)
    }
  }

  const transactionItems = payload.items.map(item => {
    const prod = branchProds.find(p => p.id === item.productId)
    return {
      productId: item.productId,
      productName: prod?.name || "Layanan/Barang",
      category: (prod?.category || item.category || "NITROGEN") as any,
      quantity: item.quantity,
      price: item.price,
      costPrice: item.costPrice ?? prod?.costPrice ?? 0,
      subtotal: item.price * item.quantity
    }
  })

  const totalCost = transactionItems.reduce((acc, it) => acc + (it.costPrice * it.quantity), 0)
  const grossProfit = payload.totalAmount - totalCost

  const tx: InterlockingTransaction = {
    id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    branchId: payload.branchId,
    branchName: branch.name,
    cashierId: payload.cashierId || null,
    cashierName: payload.cashierName || "Kasir Outlet",
    totalAmount: payload.totalAmount,
    totalCostPrice: totalCost,
    grossProfit,
    vehiclePhotoUrl: payload.vehiclePhotoUrl || null,
    usedBottlePhotoUrl: payload.usedBottlePhotoUrl || null,
    customerPlate: payload.customerPlate || null,
    customerName: payload.customerName || null,
    customerPhone: payload.customerPhone || null,
    status: "COMPLETED",
    paymentMethod: payload.paymentMethod || "CASH",
    createdAt: new Date().toISOString(),
    items: transactionItems
  }

  runtimeTransactions.unshift(tx)

  // Auto-sync customer to CRM
  if (payload.customerPlate) {
    const serviceSummary = transactionItems.map(i => i.productName).join(", ")
    const isMobil = transactionItems.some(i => i.productName.toLowerCase().includes("mobil"))
    upsertCustomer({
      name: payload.customerName || `Pelanggan ${payload.customerPlate}`,
      phone: payload.customerPhone || "-",
      plateNumber: payload.customerPlate,
      vehicleType: isMobil ? "MOBIL" : "MOTOR",
      serviceType: serviceSummary,
      branchId: payload.branchId,
      branchName: branch.name,
      amount: payload.totalAmount,
    }).catch(console.error)
  }

  try {
    await supabase.from("transactions").insert({
      id: tx.id,
      branch_id: tx.branchId,
      cashier_id: tx.cashierId,
      total_amount: tx.totalAmount,
      vehicle_photo_url: tx.vehiclePhotoUrl,
      used_bottle_photo_url: tx.usedBottlePhotoUrl,
      status: tx.status,
      payment_method: tx.paymentMethod
    })
  } catch (e) {}

  return tx
}

export async function getTransactions(branchId?: string): Promise<InterlockingTransaction[]> {
  if (!branchId || branchId === "ALL") {
    return runtimeTransactions
  }
  return runtimeTransactions.filter(t => t.branchId === branchId)
}

export async function getFraudAlerts(branchId?: string): Promise<FraudAlert[]> {
  if (!branchId || branchId === "ALL") {
    return runtimeFraudAlerts
  }
  return runtimeFraudAlerts.filter(a => a.branchId === branchId)
}

export async function recordFraudAlert(payload: {
  branchId: string
  deviceId: string
  alertType: "UNAUTHORIZED_FLOW" | "TAMPER_DETECTED" | "DISCREPANCY"
  message: string
}): Promise<FraudAlert> {
  const branch = runtimeBranches.find(b => b.id === payload.branchId) || DEFAULT_BRANCHES.find(b => b.id === payload.branchId) || { id: payload.branchId, name: "Cabang Outlet", location: "" }

  const alert: FraudAlert = {
    id: `ALERT-${Date.now()}`,
    branchId: payload.branchId,
    branchName: branch.name,
    deviceId: payload.deviceId,
    alertType: payload.alertType,
    message: payload.message,
    detectedAt: new Date().toISOString()
  }

  runtimeFraudAlerts.unshift(alert)

  // Send Telegram Notification
  const tgMsg = `🚨 <b>PERINGATAN SENSOR IOT - KECURANGAN / ANOMALI</b>\n\n` +
    `📍 <b>Cabang:</b> ${branch.name} (${branch.location})\n` +
    `📟 <b>Device ID:</b> ${payload.deviceId}\n` +
    `⚠️ <b>Tipe:</b> ${payload.alertType}\n` +
    `📝 <b>Detail:</b> ${payload.message}\n` +
    `⏰ <b>Waktu:</b> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}\n\n` +
    `<i>Mohon segera periksa CCTV atau galeri audit POS cabang terkait!</i>`

  await sendTelegramAlert(tgMsg)

  return alert
}

export async function recordShiftClosing(payload: {
  branchId: string
  cashierId: string
  cashierName: string
  physicalCash: number
  notes?: string
}): Promise<ShiftClosing> {
  const branch = runtimeBranches.find(b => b.id === payload.branchId) || DEFAULT_BRANCHES.find(b => b.id === payload.branchId) || { id: payload.branchId, name: "Cabang Outlet", location: "" }

  const branchTxs = runtimeTransactions.filter(t => 
    t.branchId === payload.branchId &&
    t.paymentMethod === "CASH" &&
    t.status === "COMPLETED"
  )
  const systemRevenue = branchTxs.reduce((sum, t) => sum + t.totalAmount, 0)
  const discrepancy = payload.physicalCash - systemRevenue

  const closing: ShiftClosing = {
    id: `SHIFT-${Date.now()}`,
    branchId: payload.branchId,
    branchName: branch.name,
    cashierId: payload.cashierId,
    cashierName: payload.cashierName,
    physicalCash: payload.physicalCash,
    systemRevenue,
    discrepancy,
    notes: payload.notes || null,
    closedAt: new Date().toISOString()
  }

  runtimeShiftClosings.unshift(closing)
  return closing
}

export async function getShiftClosings(branchId?: string): Promise<ShiftClosing[]> {
  if (!branchId || branchId === "ALL") {
    return runtimeShiftClosings
  }
  return runtimeShiftClosings.filter(s => s.branchId === branchId)
}

// -------------------------------------------------------------
// BRANCH-SCOPED EMPLOYEE & ACCESS MANAGEMENT (PEGAWAI)
// -------------------------------------------------------------
export type BranchStaff = {
  id: string
  branchId: string
  branchName: string
  name: string
  email: string
  role: "KASIR" | "MANAGER"
  phone?: string
  createdAt: string
}

let runtimeStaffs: BranchStaff[] = [
  // Cabang Tambun
  {
    id: "staff-tambun-1",
    branchId: "branch-utama",
    branchName: "Cabang Tambun",
    name: "Budi Santoso",
    email: "budi.tambun@ubos.id",
    role: "KASIR",
    phone: "081234567891",
    createdAt: new Date().toISOString(),
  },
  {
    id: "staff-tambun-2",
    branchId: "branch-utama",
    branchName: "Cabang Tambun",
    name: "Joko Widodo",
    email: "joko.tambun@ubos.id",
    role: "MANAGER",
    phone: "081234567892",
    createdAt: new Date().toISOString(),
  },
  // Cabang Cibitung 1
  {
    id: "staff-cibitung1-1",
    branchId: "branch-cibitung-1",
    branchName: "Cabang Cibitung 1",
    name: "Rian Hidayat",
    email: "rian.cibitung1@ubos.id",
    role: "KASIR",
    phone: "085712345678",
    createdAt: new Date().toISOString(),
  },
  {
    id: "staff-cibitung1-2",
    branchId: "branch-cibitung-1",
    branchName: "Cabang Cibitung 1",
    name: "Agus Setiawan",
    email: "agus.cibitung1@ubos.id",
    role: "MANAGER",
    phone: "085712345679",
    createdAt: new Date().toISOString(),
  },
  // Cabang Cibitung 2
  {
    id: "staff-cibitung2-1",
    branchId: "branch-cibitung-2",
    branchName: "Cabang Cibitung 2",
    name: "Doni Pratama",
    email: "doni.cibitung2@ubos.id",
    role: "KASIR",
    phone: "087890123456",
    createdAt: new Date().toISOString(),
  },
  // Cabang Cibitung 3
  {
    id: "staff-cibitung3-1",
    branchId: "branch-cibitung-3",
    branchName: "Cabang Cibitung 3",
    name: "Andi Saputra",
    email: "andi.cibitung3@ubos.id",
    role: "KASIR",
    phone: "081398765432",
    createdAt: new Date().toISOString(),
  },
]

export async function getStaffListByBranch(branchId?: string): Promise<BranchStaff[]> {
  if (!branchId || branchId === "ALL") {
    return runtimeStaffs
  }
  return runtimeStaffs.filter(s => s.branchId === branchId)
}

export async function createStaffForBranch(data: {
  branchId: string
  name: string
  email: string
  role: "KASIR" | "MANAGER"
  phone?: string
}): Promise<BranchStaff> {
  const branch = runtimeBranches.find(b => b.id === data.branchId) || DEFAULT_BRANCHES.find(b => b.id === data.branchId) || { id: data.branchId, name: "Cabang Outlet", location: "" }
  const newStaff: BranchStaff = {
    id: `staff-${Date.now()}`,
    branchId: data.branchId,
    branchName: branch.name,
    name: data.name.trim(),
    email: data.email.trim(),
    role: data.role,
    phone: data.phone?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
  runtimeStaffs.push(newStaff)
  return newStaff
}

export async function deleteStaffFromBranch(staffId: string): Promise<boolean> {
  runtimeStaffs = runtimeStaffs.filter(s => s.id !== staffId)
  return true
}

