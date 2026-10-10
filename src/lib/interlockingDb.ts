import { Branch, InterlockingProduct, InterlockingTransaction, FraudAlert, ShiftClosing, DEFAULT_BRANCHES } from "@/types/branch"
import { supabase } from "@/lib/supabaseClient"
import { sendTelegramAlert } from "@/lib/telegram"
import { upsertCustomer } from "@/lib/crmDb"

// Dynamic runtime branches (starts with 1 initial branch from DEFAULT_BRANCHES, expandable)
let runtimeBranches: Branch[] = [...DEFAULT_BRANCHES]

// Dynamic runtime store settings map (scoped by businessId/userId)
const scopedRuntimeStoreSettings: Record<string, {
  storeName: string
  profileImage: string | null
  telegramPhone: string
  telegramChatId: string | null
  telegramBotToken: string | null
}> = {}

const DEFAULT_STORE_SETTINGS = {
  storeName: "MERUVIN",
  profileImage: null as string | null,
  telegramPhone: "083153598697",
  telegramChatId: "-5332437584" as string | null,
  telegramBotToken: null as string | null,
}

export async function getStoreSettings(scopeId?: string): Promise<{
  storeName: string
  profileImage: string | null
  telegramPhone: string
  telegramChatId: string | null
  telegramBotToken: string | null
}> {
  const keyPrefix = scopeId ? `${scopeId}_` : ""
  
  if (!scopedRuntimeStoreSettings[keyPrefix]) {
    scopedRuntimeStoreSettings[keyPrefix] = { ...DEFAULT_STORE_SETTINGS }
  }

  try {
    const { prisma } = await import("@/lib/prisma")
    const searchKeys = [
      "store_name", "store_telegram_phone", "store_telegram_chat_id", "store_telegram_bot_token", "store_profile_image"
    ]
    if (scopeId) {
      searchKeys.push(
        `${scopeId}_store_name`,
        `${scopeId}_store_telegram_phone`,
        `${scopeId}_store_telegram_chat_id`,
        `${scopeId}_store_telegram_bot_token`,
        `${scopeId}_store_profile_image`
      )
    }

    const settings = await prisma.systemSetting.findMany({
      where: {
        key: { in: searchKeys }
      }
    })
    const map = Object.fromEntries(settings.map(s => [s.key, s.value]))

    const item = scopedRuntimeStoreSettings[keyPrefix]
    if (scopeId && map[`${scopeId}_store_name`]) item.storeName = map[`${scopeId}_store_name`]
    else if (!scopeId && map["store_name"]) item.storeName = map["store_name"]

    if (scopeId && map[`${scopeId}_store_telegram_phone`]) item.telegramPhone = map[`${scopeId}_store_telegram_phone`]
    else if (!scopeId && map["store_telegram_phone"]) item.telegramPhone = map["store_telegram_phone"]

    if (scopeId && map[`${scopeId}_store_telegram_chat_id`]) item.telegramChatId = map[`${scopeId}_store_telegram_chat_id`]
    else if (!scopeId && map["store_telegram_chat_id"]) item.telegramChatId = map["store_telegram_chat_id"]

    if (scopeId && map[`${scopeId}_store_telegram_bot_token`]) item.telegramBotToken = map[`${scopeId}_store_telegram_bot_token`]
    else if (!scopeId && map["store_telegram_bot_token"]) item.telegramBotToken = map["store_telegram_bot_token"]

    if (scopeId && map[`${scopeId}_store_profile_image`]) item.profileImage = map[`${scopeId}_store_profile_image`]
    else if (!scopeId && map["store_profile_image"]) item.profileImage = map["store_profile_image"]
  } catch (e) {}

  return scopedRuntimeStoreSettings[keyPrefix]
}

export async function updateStoreSettings(
  data: {
    storeName?: string
    profileImage?: string | null
    telegramPhone?: string
    telegramChatId?: string | null
    telegramBotToken?: string | null
  },
  scopeId?: string
) {
  const keyPrefix = scopeId ? `${scopeId}_` : ""
  if (!scopedRuntimeStoreSettings[keyPrefix]) {
    scopedRuntimeStoreSettings[keyPrefix] = { ...DEFAULT_STORE_SETTINGS }
  }
  const item = scopedRuntimeStoreSettings[keyPrefix]

  if (data.storeName !== undefined && data.storeName.trim()) item.storeName = data.storeName.trim()
  if (data.profileImage !== undefined) item.profileImage = data.profileImage
  if (data.telegramPhone !== undefined && data.telegramPhone.trim()) item.telegramPhone = data.telegramPhone.trim()
  if (data.telegramChatId !== undefined) item.telegramChatId = data.telegramChatId && data.telegramChatId.trim() ? data.telegramChatId.trim() : null
  if (data.telegramBotToken !== undefined) item.telegramBotToken = data.telegramBotToken && data.telegramBotToken.trim() ? data.telegramBotToken.trim() : null

  // Persist directly to Prisma SystemSetting (scoped per account/business)
  try {
    const { prisma } = await import("@/lib/prisma")
    const storeNameKey = scopeId ? `${scopeId}_store_name` : "store_name"
    const phoneKey = scopeId ? `${scopeId}_store_telegram_phone` : "store_telegram_phone"
    const chatIdKey = scopeId ? `${scopeId}_store_telegram_chat_id` : "store_telegram_chat_id"
    const botTokenKey = scopeId ? `${scopeId}_store_telegram_bot_token` : "store_telegram_bot_token"
    const profileImgKey = scopeId ? `${scopeId}_store_profile_image` : "store_profile_image"

    if (data.storeName && data.storeName.trim()) {
      await prisma.systemSetting.upsert({
        where: { key: storeNameKey },
        update: { value: data.storeName.trim() },
        create: { id: `sys-${storeNameKey}`, key: storeNameKey, value: data.storeName.trim() }
      })
    }
    if (data.telegramPhone && data.telegramPhone.trim()) {
      await prisma.systemSetting.upsert({
        where: { key: phoneKey },
        update: { value: data.telegramPhone.trim() },
        create: { id: `sys-${phoneKey}`, key: phoneKey, value: data.telegramPhone.trim() }
      })
    }
    if (data.telegramChatId !== undefined) {
      const val = data.telegramChatId && data.telegramChatId.trim() ? data.telegramChatId.trim() : ""
      await prisma.systemSetting.upsert({
        where: { key: chatIdKey },
        update: { value: val },
        create: { id: `sys-${chatIdKey}`, key: chatIdKey, value: val }
      })
    }
    if (data.telegramBotToken !== undefined) {
      const val = data.telegramBotToken && data.telegramBotToken.trim() ? data.telegramBotToken.trim() : ""
      await prisma.systemSetting.upsert({
        where: { key: botTokenKey },
        update: { value: val },
        create: { id: `sys-${botTokenKey}`, key: botTokenKey, value: val }
      })
    }
    if (data.profileImage !== undefined && data.profileImage) {
      await prisma.systemSetting.upsert({
        where: { key: profileImgKey },
        update: { value: data.profileImage },
        create: { id: `sys-${profileImgKey}`, key: profileImgKey, value: data.profileImage }
      })
    }
  } catch (e) {}

  return item
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

export async function updateBranch(id: string, data: { name?: string; location?: string; deviceId?: string }): Promise<Branch | null> {
  const branch = runtimeBranches.find(b => b.id === id)
  if (!branch) return null

  if (data.name !== undefined && data.name.trim()) branch.name = data.name.trim()
  if (data.location !== undefined) branch.location = data.location.trim()
  if (data.deviceId !== undefined) branch.deviceId = data.deviceId.trim()

  try {
    await supabase.from("branches").update({
      name: branch.name,
      location: branch.location,
      device_id: branch.deviceId,
    }).eq("id", id)
  } catch (e) {}

  return branch
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

export type BranchExpense = {
  id: string
  branchId: string
  branchName: string
  category: string
  amount: number
  description: string
  date: string
}

let runtimeExpenses: BranchExpense[] = []

export async function getExpenses(branchId?: string): Promise<BranchExpense[]> {
  if (!branchId || branchId === "ALL") {
    return runtimeExpenses
  }
  return runtimeExpenses.filter((e) => e.branchId === branchId)
}

export async function recordExpense(payload: {
  branchId: string
  category: string
  amount: number
  description?: string
}): Promise<BranchExpense> {
  const branch = runtimeBranches.find(b => b.id === payload.branchId) || DEFAULT_BRANCHES.find(b => b.id === payload.branchId) || { id: payload.branchId, name: "Cabang Outlet", location: "" }
  const expense: BranchExpense = {
    id: `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    branchId: payload.branchId,
    branchName: branch.name,
    category: payload.category,
    amount: payload.amount,
    description: payload.description || "",
    date: new Date().toISOString(),
  }
  runtimeExpenses.unshift(expense)
  return expense
}

export async function deleteBranchExpense(id: string): Promise<boolean> {
  runtimeExpenses = runtimeExpenses.filter((e) => e.id !== id)
  return true
}

// Reset all runtime transactions to 0 from the start (Requirement 2)
let runtimeTransactions: InterlockingTransaction[] = []

// Reset all runtime fraud alerts to 0 from the start
let runtimeFraudAlerts: FraudAlert[] = []
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
  alertType: FraudAlert["alertType"]
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

  // Send Telegram Notification customized by alert type
  let headerTitle = "🚨 <b>PERINGATAN SENSOR IOT - KECURANGAN / ANOMALI</b>"
  let footerNote = "<i>Mohon segera periksa CCTV atau galeri audit POS cabang terkait!</i>"

  if (payload.alertType === "SENSOR_OFFLINE" || payload.alertType === "DEVICE_OFFLINE") {
    headerTitle = "🚨 <b>PERINGATAN PERANGKAT IOT - SENSOR / MODUL MATI (OFFLINE)</b>"
    footerNote = "<i>Periksa koneksi daya atau jaringan WiFi modul ESP32 di outlet terkait!</i>"
  } else if (payload.alertType === "DISCREPANCY") {
    headerTitle = "⚠️ <b>PERINGATAN AUDIT KASIR - SELISIH SETORAN UANG</b>"
    footerNote = "<i>Pemeriksaan selisih setoran fisik kasir otomatis oleh BOSNITRO Audit System.</i>"
  }

  const tgMsg = `${headerTitle}\n\n` +
    `📍 <b>Cabang:</b> ${branch.name} (${branch.location})\n` +
    `📟 <b>Device ID:</b> ${payload.deviceId}\n` +
    `⚠️ <b>Tipe:</b> ${payload.alertType}\n` +
    `📝 <b>Detail:</b> ${payload.message}\n` +
    `⏰ <b>Waktu:</b> ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}\n\n` +
    `${footerNote}`

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
  // Cabang Utama
  {
    id: "staff-utama-1",
    branchId: "branch-utama",
    branchName: "Cabang Utama",
    name: "Budi Santoso",
    email: "kasir@ubos.id",
    role: "KASIR",
    phone: "081234567891",
    createdAt: new Date().toISOString(),
  },
]

export async function getUserAssignedBranch(userId?: string, userEmail?: string): Promise<Branch | null> {
  const branches = await getBranches()
  
  // 1. Check if user is staff in Prisma
  try {
    if (userId) {
      const dbUser = await (await import("@/lib/prisma")).prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true, role: true }
      })
      if (dbUser && dbUser.phone) {
        const found = branches.find(b => b.id === dbUser.phone)
        if (found) return found
      }
    }
  } catch (e) {}

  // 2. Check in runtimeStaffs
  if (userEmail) {
    const staff = runtimeStaffs.find(s => s.email.toLowerCase() === userEmail.toLowerCase())
    if (staff) {
      const found = branches.find(b => b.id === staff.branchId)
      if (found) return found
    }
  }

  // Fallback to first branch
  return branches[0] || null
}

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

