export type Branch = {
  id: string
  name: string
  location: string
  createdAt?: string | Date
}

export const DEFAULT_BRANCHES: Branch[] = [
  { id: "branch-tambun-1", name: "Tambun 1", location: "Jl. Sultan Hasanudin, Tambun Selatan" },
  { id: "branch-tambun-2", name: "Tambun 2", location: "Jl. Rawa Kalong, Tambun Utara" },
  { id: "branch-cibitung-1", name: "Cibitung 1", location: "Jl. Raya Fatahillah, Cibitung" },
  { id: "branch-cibitung-2", name: "Cibitung 2", location: "Jl. Selang Cau, Wanasari, Cibitung" },
]

export type ProductCategoryType = "NITROGEN" | "RETAIL"
export type VehicleType = "MOTOR" | "MOBIL" | null
export type ServiceType = "TAMBAH" | "FULL" | null

export type InterlockingProduct = {
  id: string
  branchId?: string | null
  category: ProductCategoryType
  vehicleType: VehicleType
  serviceType: ServiceType
  name: string
  price: number
  costPrice: number // HPP
  stock: number // Untuk RETAIL
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
  vehiclePhotoUrl?: string | null // Cloudinary URL foto plat kendaraan
  usedBottlePhotoUrl?: string | null // Cloudinary URL foto botol oli bekas
  status: "COMPLETED" | "PENDING" | "CANCELLED"
  paymentMethod: string
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
  alertType: "UNAUTHORIZED_FLOW" | "TAMPER_DETECTED" | "DISCREPANCY"
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
