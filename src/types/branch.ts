export type Branch = {
  id: string
  name: string
  location: string
  deviceId?: string | null
  status?: "ONLINE" | "OFFLINE"
  createdAt?: string | Date
}

// 4 Cabang utama sesuai arsitektur backend dashboard owner
export const DEFAULT_BRANCHES: Branch[] = [
  { id: "branch-utama", name: "Cabang Tambun", location: "Jl. Sultan Hasanudin, Tambun Selatan", deviceId: "ESP32-TAMBUN", status: "ONLINE" },
  { id: "branch-cibitung-1", name: "Cabang Cibitung 1", location: "Jl. Teuku Umar No. 12, Cibitung", deviceId: "ESP32-CIBITUNG-1", status: "ONLINE" },
  { id: "branch-cibitung-2", name: "Cabang Cibitung 2", location: "Kawasan Industri MM2100", deviceId: "ESP32-CIBITUNG-2", status: "ONLINE" },
  { id: "branch-cibitung-3", name: "Cabang Cibitung 3", location: "Jl. Raya Fatahillah, Cikarang", deviceId: "ESP32-CIBITUNG-3", status: "ONLINE" },
]

export type StoreProfileSettings = {
  storeName: string
  profileImage: string | null
  telegramPhone: string
  telegramChatId?: string | null
  userEmail?: string
  userName?: string
}

export type ProductCategoryType = "NITROGEN" | "RETAIL" | "LAYANAN_LAINNYA"
export type VehicleType = "MOTOR" | "MOBIL" | null
export type ServiceType = "TAMBAH" | "FULL" | "TAMBAL" | null
export type ServiceVariant = "ISI_BARU" | "ISI_TAMBAH" | "TAMBAL_BAN" | "GANTI_OLI" | "MINYAK_REM" | "TUBLES" | null

export type InterlockingProduct = {
  id: string
  branchId?: string | null
  category: ProductCategoryType
  vehicleType: VehicleType
  serviceType: ServiceType
  variant?: ServiceVariant
  serviceVariant?: ServiceVariant
  name: string
  price: number
  costPrice: number // HPP
  stock: number // Untuk RETAIL / LAYANAN_LAINNYA
  barcode?: string | null
  timerSeconds?: number | null // Durasi solenoid valve aktif (detik) untuk NITROGEN
  requiresPhoto: boolean // Wajib foto audit (Plat / Botol)
  imageUrl?: string | null
  isActive: boolean
}

export type InterlockingTransaction = {
  id: string
  branchId: string
  branchName?: string
  cashierId?: string | null
  cashierName?: string | null
  totalAmount: number
  totalCostPrice?: number
  grossProfit?: number
  vehiclePhotoUrl?: string | null // URL foto plat kendaraan
  usedBottlePhotoUrl?: string | null // URL foto botol oli bekas / pengerjaan
  status: "COMPLETED" | "PENDING" | "CANCELLED"
  paymentMethod: string
  customerPlate?: string | null // Plat Nomor Kendaraan Pelanggan
  customerName?: string | null
  customerPhone?: string | null
  createdAt: string | Date
  items: InterlockingTransactionItem[]
}

export type InterlockingTransactionItem = {
  id?: string
  transactionId?: string
  productId: string
  productName: string
  category: ProductCategoryType
  quantity: number
  price: number
  costPrice: number
  subtotal: number
}

export type FraudAlert = {
  id: string
  branchId: string
  branchName: string
  deviceId: string
  alertType: "UNAUTHORIZED_FLOW" | "TAMPER_DETECTED" | "DISCREPANCY" | "COMPRESSOR_OFF_HOURS"
  message: string
  detectedAt: string | Date
}

export type ShiftClosing = {
  id: string
  branchId: string
  branchName: string
  cashierId: string
  cashierName: string
  physicalCash: number
  systemRevenue: number
  discrepancy: number
  notes?: string | null
  closedAt: string | Date
}

// -------------------------------------------------------------
// HARDWARE INTEGRATION SETTINGS (IoT ESP32, CCTV & BLUETOOTH PRINTER)
// -------------------------------------------------------------
export type HardwareSettings = {
  // 1. IoT Nitrogen (ESP32)
  iotEnabled?: boolean
  esp32Ip: string
  esp32WsUrl?: string
  esp32Token: string
  motorTimerTambah: number // 15 detik
  motorTimerBaru?: number // 30 detik
  motorTimerFull?: number // 35 detik
  mobilTimerTambah: number // 30 detik
  mobilTimerFull: number // 60/90 detik

  // 2. Auto-Capture CCTV / Snapshot
  cctvMethod?: "CAMERA_TABLET" | "CCTV_IP"
  cctvCaptureMode?: "BOTH" | "DEVICE_CAMERA" | "CCTV_IP"
  cctvSnapshotUrl?: string
  cctvEndpointUrl?: string
  cctvUsername?: string
  cctvPassword?: string
  cctvAuthUser?: string
  cctvAuthPass?: string
  autoCaptureOnCheckout?: boolean

  // 3. Mini Bluetooth Thermal Printer
  printerMethod?: "WEB_BLUETOOTH" | "RAWBT_INTENT"
  printerDriverMode?: "WEB_BLUETOOTH" | "RAWBT_INTENT"
  paperSize?: "58mm" | "80mm"
  printerPaperSize?: "58mm" | "80mm"
  bluetoothPrinterName?: string
  bluetoothPrinterMac?: string
  printerStoreHeader?: string
  printerFooterNote?: string
  autoPrintOnSuccess?: boolean
  autoPrintAfterPayment?: boolean

  // 4. Target & Sistem Reward
  monthlyTarget?: number
  dailyTarget?: number
  targetDailyOmzet?: number
  rewardBonusPool?: number
  rewardCriteria?: string
  rewardType?: "NOMINAL" | "PERCENTAGE"
  rewardAmount?: number
  rewardNotes?: string
}

// -------------------------------------------------------------
// CRM & CUSTOMER RETENTION
// -------------------------------------------------------------
export type CustomerCRM = {
  id: string
  name: string
  phone: string
  plateNumber: string
  vehicleType: "MOTOR" | "MOBIL"
  lastServiceDate: string | Date
  lastServiceType: string
  branchId: string
  branchName: string
  totalVisits: number
  totalSpent: number
  createdAt: string | Date
}

// -------------------------------------------------------------
// ANALISIS PENJUALAN 30 HARI & SISTEM REWARD
// -------------------------------------------------------------
export type Analytics30Days = {
  period?: string
  totalRevenue30Days?: number
  totalOmzet30Days?: number
  totalTransactions30Days: number
  actualDailyAverage: number // Total / 30
  targetDailyAverage?: number
  targetDailyOmzet?: number
  targetMonthly?: number
  achievementPercentage: number // (actualDailyAverage / targetDailyAverage) * 100
  isRewardAchieved?: boolean
  isRewardUnlocked?: boolean
  rewardAmount?: number
  rewardBonusPool?: number
  rewardCriteria?: string
  rewardType?: "NOMINAL" | "PERCENTAGE"
  dailyGap?: number
  daysTargetAchieved?: number
  calculatedBonusPool?: number
  statusMessage?: string
  dailyBreakdown?: Array<{
    date: string
    totalOmzet: number
    transactionCount: number
    nitrogenCount: number
    oilCount: number
    targetReached: boolean
  }>
}
