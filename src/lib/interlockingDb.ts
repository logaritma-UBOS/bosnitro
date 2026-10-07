import { Branch, InterlockingProduct, InterlockingTransaction, FraudAlert, ShiftClosing, DEFAULT_BRANCHES } from "@/types/branch"
import { supabase } from "@/lib/supabaseClient"
import { sendTelegramAlert } from "@/lib/telegram"

// Dynamic runtime branches (starts with 1 initial branch from DEFAULT_BRANCHES, expandable)
let runtimeBranches: Branch[] = [...DEFAULT_BRANCHES]

// Dynamic runtime store settings
let runtimeStoreSettings = {
  storeName: "Toko meruvin",
  profileImage: null as string | null,
  telegramPhone: "083153598697",
}

export async function getStoreSettings(): Promise<{ storeName: string; profileImage: string | null; telegramPhone: string }> {
  return runtimeStoreSettings
}

export async function updateStoreSettings(data: { storeName?: string; profileImage?: string | null; telegramPhone?: string }) {
  if (data.storeName !== undefined && data.storeName.trim()) runtimeStoreSettings.storeName = data.storeName.trim()
  if (data.profileImage !== undefined) runtimeStoreSettings.profileImage = data.profileImage
  if (data.telegramPhone !== undefined && data.telegramPhone.trim()) runtimeStoreSettings.telegramPhone = data.telegramPhone.trim()
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

// In-memory / persistent runtime store for fast reactivity & offline-first capability
let runtimeProducts: InterlockingProduct[] = [
  // 1. NITROGEN SERVICES
  {
    id: "nitro-motor-tambah",
    category: "NITROGEN",
    vehicleType: "MOTOR",
    serviceType: "TAMBAH",
    name: "Tambah Angin Motor",
    price: 5000,
    costPrice: 500,
    stock: 9999,
    timerSeconds: 15,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "nitro-motor-full",
    category: "NITROGEN",
    vehicleType: "MOTOR",
    serviceType: "FULL",
    name: "Isi Angin Full Motor",
    price: 10000,
    costPrice: 1000,
    stock: 9999,
    timerSeconds: 35,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "nitro-mobil-tambah",
    category: "NITROGEN",
    vehicleType: "MOBIL",
    serviceType: "TAMBAH",
    name: "Tambah Angin Mobil",
    price: 10000,
    costPrice: 1000,
    stock: 9999,
    timerSeconds: 30,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "nitro-mobil-full",
    category: "NITROGEN",
    vehicleType: "MOBIL",
    serviceType: "FULL",
    name: "Isi Angin Full Mobil",
    price: 25000,
    costPrice: 2500,
    stock: 9999,
    timerSeconds: 90,
    requiresPhoto: true,
    isActive: true,
  },
  // 2. RETAIL & OLI
  {
    id: "retail-mpx2",
    category: "RETAIL",
    vehicleType: null,
    serviceType: null,
    name: "Oli AHM MPX2 Matic 0.8L",
    price: 52000,
    costPrice: 42000,
    stock: 35,
    barcode: "8999901001",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "retail-shell-ax7",
    category: "RETAIL",
    vehicleType: null,
    serviceType: null,
    name: "Oli Shell Advance AX7 10W-40 0.8L",
    price: 65000,
    costPrice: 53000,
    stock: 20,
    barcode: "8999901002",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "retail-yamalube",
    category: "RETAIL",
    vehicleType: null,
    serviceType: null,
    name: "Oli Yamalube Silver 0.8L",
    price: 48000,
    costPrice: 39000,
    stock: 15,
    barcode: "8999901003",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "retail-enduro",
    category: "RETAIL",
    vehicleType: null,
    serviceType: null,
    name: "Pertamina Enduro 4T Racing 1L",
    price: 58000,
    costPrice: 47000,
    stock: 18,
    barcode: "8999901004",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "retail-castrol-power1",
    category: "RETAIL",
    vehicleType: null,
    serviceType: null,
    name: "Castrol Power 1 10W-40 0.8L",
    price: 62000,
    costPrice: 50000,
    stock: 12,
    barcode: "8999901005",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
  {
    id: "retail-motul-scooter",
    category: "RETAIL",
    vehicleType: null,
    serviceType: null,
    name: "Motul Scooter Expert LE 10W-30 0.8L",
    price: 75000,
    costPrice: 61000,
    stock: 10,
    barcode: "8999901006",
    timerSeconds: 0,
    requiresPhoto: true,
    isActive: true,
  },
]

let runtimeTransactions: InterlockingTransaction[] = []

let runtimeFraudAlerts: FraudAlert[] = [
  {
    id: "alert-demo-1",
    branchId: "branch-utama",
    branchName: "Cabang Utama",
    deviceId: "ESP32-NITRO-01",
    alertType: "UNAUTHORIZED_FLOW",
    message: "Flow sensor mendeteksi aliran gas nitrogen 22 PSI selama 8 detik tanpa ada transaksi POS tercatat!",
    detectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  }
]
let runtimeShiftClosings: ShiftClosing[] = []

export async function getProducts(branchId?: string): Promise<InterlockingProduct[]> {
  try {
    const { data, error } = await supabase.from("products").select("*")
    if (!error && data && data.length > 0) {
      return data.map((d: any) => ({
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

  return runtimeProducts.filter(p => !p.branchId || !branchId || p.branchId === branchId)
}

export async function updateNitrogenItem(id: string, price: number, timerSeconds: number) {
  const item = runtimeProducts.find(p => p.id === id)
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
  if (data.id) {
    const existing = runtimeProducts.find(p => p.id === data.id)
    if (existing) {
      existing.name = data.name
      existing.barcode = data.barcode
      existing.price = data.price
      existing.costPrice = data.costPrice
      existing.stock = data.stock
      if (data.branchId) existing.branchId = data.branchId
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
    branchId: data.branchId,
    isActive: true
  }

  runtimeProducts.push(newProd)
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
}): Promise<InterlockingTransaction> {
  const branch = runtimeBranches.find(b => b.id === payload.branchId) || DEFAULT_BRANCHES.find(b => b.id === payload.branchId) || { id: payload.branchId, name: "Cabang Outlet", location: "" }

  // Deduct retail stock
  for (const item of payload.items) {
    const product = runtimeProducts.find(p => p.id === item.productId)
    if (product && product.category === "RETAIL") {
      product.stock = Math.max(0, product.stock - item.quantity)
    }
  }

  const transactionItems = payload.items.map(item => {
    const prod = runtimeProducts.find(p => p.id === item.productId)
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
    status: "COMPLETED",
    paymentMethod: payload.paymentMethod || "CASH",
    createdAt: new Date().toISOString(),
    items: transactionItems
  }

  runtimeTransactions.unshift(tx)

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
