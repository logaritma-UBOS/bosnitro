import { NextResponse } from "next/server"
import { getCustomers, upsertCustomer, generateWhatsAppReminderUrl } from "@/lib/crmDb"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const branchId = searchParams.get("branchId") || undefined
    const search = searchParams.get("search") || undefined

    const customers = await getCustomers({ branchId, search })

    return NextResponse.json({
      success: true,
      count: customers.length,
      data: customers,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengambil data CRM" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      name,
      phone,
      vehiclePlate,
      vehicleType,
      branchId,
      branchName,
      serviceType,
      totalSpent,
      notes,
    } = body

    if (!name || !phone || !vehiclePlate) {
      return NextResponse.json(
        { error: "Nama, nomor telepon, dan nomor plat kendaraan wajib diisi" },
        { status: 400 }
      )
    }

    const customer = await upsertCustomer({
      name,
      phone,
      vehiclePlate,
      vehicleType,
      branchId,
      branchName,
      serviceType,
      totalSpent,
      notes,
    })

    const waReminderUrl = generateWhatsAppReminderUrl(customer)

    return NextResponse.json({
      success: true,
      message: "Data pelanggan CRM berhasil disimpan",
      data: customer,
      waReminderUrl,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal menyimpan CRM" }, { status: 500 })
  }
}
