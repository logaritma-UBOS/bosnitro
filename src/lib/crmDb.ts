import { CustomerCRM } from "@/types/branch"

let runtimeCustomers: CustomerCRM[] = [
  {
    id: "cust-1",
    name: "Pak Bambang",
    phone: "081234567890",
    plateNumber: "B 2345 KZ",
    vehicleType: "MOBIL",
    lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(), // 2 bulan lalu
    lastServiceType: "Ganti Oli Shell AX7 & Nitrogen Full",
    branchId: "branch-utama",
    branchName: "Cabang Tambun",
    totalVisits: 5,
    totalSpent: 350000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
  },
  {
    id: "cust-2",
    name: "Mas Dimas",
    phone: "085712345678",
    plateNumber: "B 4567 TBD",
    vehicleType: "MOTOR",
    lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 hari lalu
    lastServiceType: "Ganti Oli MPX2 & Tambah Nitrogen",
    branchId: "branch-utama",
    branchName: "Cabang Tambun",
    totalVisits: 8,
    totalSpent: 480000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
  },
  {
    id: "cust-3",
    name: "Ibu Ratna",
    phone: "087890123456",
    plateNumber: "B 6789 TY",
    vehicleType: "MOTOR",
    lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(), // 2 minggu lalu
    lastServiceType: "Isi Angin Baru Nitrogen & Cairan Tubles",
    branchId: "branch-cibitung-1",
    branchName: "Cabang Cibitung 1",
    totalVisits: 3,
    totalSpent: 75000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
  {
    id: "cust-4",
    name: "Pak Hendra",
    phone: "081398765432",
    plateNumber: "B 9981 SAA",
    vehicleType: "MOBIL",
    lastServiceDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(), // 3 bulan lalu
    lastServiceType: "Ganti Oli Castrol & Kuras Nitrogen",
    branchId: "branch-cibitung-2",
    branchName: "Cabang Cibitung 2",
    totalVisits: 6,
    totalSpent: 620000,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 240).toISOString(),
  },
]

export async function getCustomers(filter?: { branchId?: string; search?: string }): Promise<CustomerCRM[]> {
  let list = [...runtimeCustomers]
  if (filter?.branchId && filter.branchId !== "ALL") {
    list = list.filter((c) => c.branchId === filter.branchId)
  }
  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase().trim()
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.plateNumber.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
    )
  }
  return list
}

export async function upsertCustomer(data: {
  name: string
  phone: string
  plateNumber?: string
  vehiclePlate?: string
  vehicleType: "MOTOR" | "MOBIL"
  serviceType: string
  branchId: string
  branchName: string
  amount?: number
  totalSpent?: number
  notes?: string
}): Promise<CustomerCRM> {
  const plate = (data.plateNumber || data.vehiclePlate || "").trim().toUpperCase()
  const cleanPhone = (data.phone || "").trim()
  const spent = data.amount ?? data.totalSpent ?? 0

  const existingIdx = runtimeCustomers.findIndex(
    (c) => (plate && c.plateNumber.toUpperCase() === plate) || (cleanPhone && cleanPhone !== "-" && c.phone === cleanPhone)
  )

  if (existingIdx >= 0) {
    const existing = runtimeCustomers[existingIdx]
    const updated: CustomerCRM = {
      ...existing,
      name: data.name.trim() || existing.name,
      phone: cleanPhone || existing.phone,
      plateNumber: plate || existing.plateNumber,
      vehicleType: data.vehicleType || existing.vehicleType,
      lastServiceDate: new Date().toISOString(),
      lastServiceType: data.serviceType || existing.lastServiceType,
      branchId: data.branchId || existing.branchId,
      branchName: data.branchName || existing.branchName,
      totalVisits: existing.totalVisits + 1,
      totalSpent: existing.totalSpent + spent,
    }
    runtimeCustomers[existingIdx] = updated
    return updated
  }

  const newCust: CustomerCRM = {
    id: `cust-${Date.now().toString().slice(-6)}`,
    name: data.name.trim() || `Pelanggan ${plate || "Setia"}`,
    phone: cleanPhone || "-",
    plateNumber: plate || "B 0000 PRO",
    vehicleType: data.vehicleType || "MOTOR",
    lastServiceDate: new Date().toISOString(),
    lastServiceType: data.serviceType,
    branchId: data.branchId,
    branchName: data.branchName,
    totalVisits: 1,
    totalSpent: spent,
    createdAt: new Date().toISOString(),
  }

  runtimeCustomers.unshift(newCust)
  return newCust
}

export function generateWhatsAppReminderUrl(customer: CustomerCRM, storeName: string = "UBOS"): string {
  const cleanPhone = customer.phone.replace(/[^0-9]/g, "")
  const indonesianPhone = cleanPhone.startsWith("0") ? "62" + cleanPhone.slice(1) : cleanPhone

  const diffDays = Math.floor(
    (Date.now() - new Date(customer.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const message = `Halo Kak ${customer.name || "Pelanggan Setia"}, salam dari *${storeName} (${customer.branchName})*! 🚗💨\n\nKendaraan Anda dengan Plat *${customer.plateNumber}* tercatat servis terakhir *${diffDays} hari yang lalu* (${customer.lastServiceType}).\n\nSudah waktunya cek tekanan murni nitrogen atau ganti oli berkala agar performa mesin dan kenyamanan berkendara tetap maksimal.\n\nKunjungi outlet kami hari ini dan dapatkan pengecekan gratis tekanan ban. Sampai jumpa di bengkel!`

  return `https://wa.me/${indonesianPhone}?text=${encodeURIComponent(message)}`
}
