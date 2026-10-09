import { formatRupiah } from "@/lib/format"
import { InterlockingTransaction } from "@/types/branch"

/**
 * Common Bluetooth Low Energy (BLE) Thermal Printer Service & Characteristic UUIDs
 * Covers 99% of mini portable thermal printers (POS-58, GOOJPRT, Panda, RPP02N, MPT-II, Iware, Eppos, etc.)
 */
const PRINTER_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb", // POS Standard Service
  "0000ffe0-0000-1000-8000-00805f9b34fb", // HM-10 / CC2541 UART Service
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2", // Common Mini Printer Service
  "49535343-fe7d-4ae5-8fa9-9fafd205e455", // ISSC Transparent UART
  "0000ff00-0000-1000-8000-00805f9b34fb", // Generic Thermal Service
  "0000fee7-0000-1000-8000-00805f9b34fb", // WeChat / Generic BLE Printer
  "0000af30-0000-1000-8000-00805f9b34fb", // Alternative POS Service
  "0000fff0-0000-1000-8000-00805f9b34fb", // Generic POS Service
  "000018f1-0000-1000-8000-00805f9b34fb", // Alternative POS 2
]

// In-memory singleton state for active Web Bluetooth connection
let activeDevice: any = null
let activeServer: any = null
let activeWriteCharacteristic: any = null
let stateListeners: Array<(connected: boolean, deviceName: string | null) => void> = []

export function isBluetoothSupported(): boolean {
  return typeof window !== "undefined" && typeof (navigator as any).bluetooth !== "undefined"
}

export function isBluetoothConnected(): boolean {
  return !!(
    activeDevice &&
    activeDevice.gatt &&
    activeDevice.gatt.connected &&
    activeWriteCharacteristic
  )
}

export function getConnectedDeviceName(): string | null {
  if (isBluetoothConnected() && activeDevice) {
    return activeDevice.name || "Printer Bluetooth"
  }
  return null
}

function notifyStateChange(connected: boolean, deviceName: string | null) {
  stateListeners.forEach((listener) => {
    try {
      listener(connected, deviceName)
    } catch (e) {
      console.error("Bluetooth state listener error:", e)
    }
  })
}

export function subscribeBluetoothState(
  listener: (connected: boolean, deviceName: string | null) => void
): () => void {
  stateListeners.push(listener)
  // Immediately emit current state
  listener(isBluetoothConnected(), getConnectedDeviceName())
  return () => {
    stateListeners = stateListeners.filter((l) => l !== listener)
  }
}

/**
 * Connect to a Mini Bluetooth Thermal Printer
 */
export async function connectBluetoothPrinter(): Promise<{
  success: boolean
  deviceName: string
  message: string
}> {
  if (!isBluetoothSupported()) {
    throw new Error(
      "Web Bluetooth API tidak didukung pada browser ini. Pastikan menggunakan Chrome pada Android atau PC (dan aktifkan Bluetooth & Lokasi/GPS)."
    )
  }

  const nav = navigator as any

  try {
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICES,
    })

    if (!device) {
      throw new Error("Tidak ada perangkat yang dipilih.")
    }

    // Handle sudden disconnect (printer switched off / out of range)
    device.addEventListener("gattserverdisconnected", () => {
      console.log("[Web Bluetooth] Device disconnected:", device.name)
      activeDevice = null
      activeServer = null
      activeWriteCharacteristic = null
      notifyStateChange(false, null)
    })

    const server = await device.gatt.connect()
    const services = await server.getPrimaryServices()

    let foundCharacteristic: any = null

    for (const service of services) {
      try {
        const characteristics = await service.getCharacteristics()
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            foundCharacteristic = char
            break
          }
        }
        if (foundCharacteristic) break
      } catch (err) {
        // continue search
      }
    }

    if (!foundCharacteristic) {
      device.gatt.disconnect()
      throw new Error(
        "Karakteristik write Bluetooth thermal printer tidak ditemukan pada perangkat ini. Pastikan perangkat yang dipilih adalah printer thermal."
      )
    }

    activeDevice = device
    activeServer = server
    activeWriteCharacteristic = foundCharacteristic

    const deviceName = device.name || "Mini Thermal Printer"
    notifyStateChange(true, deviceName)

    return {
      success: true,
      deviceName,
      message: `Printer ${deviceName} berhasil tersambung!`,
    }
  } catch (err: any) {
    if (err.name === "NotFoundError") {
      return { success: false, deviceName: "", message: "Pemilihan printer Bluetooth dibatalkan." }
    }
    throw err
  }
}

/**
 * Disconnect active Bluetooth printer
 */
export function disconnectBluetoothPrinter(): void {
  if (activeDevice && activeDevice.gatt) {
    try {
      activeDevice.gatt.disconnect()
    } catch (e) {
      console.error("Error disconnecting Bluetooth printer:", e)
    }
  }
  activeDevice = null
  activeServer = null
  activeWriteCharacteristic = null
  notifyStateChange(false, null)
}

/**
 * Helper formatting plain text receipt for 58mm (32 characters per line) and 80mm (48 chars)
 */
export function formatTextReceipt(
  tx: InterlockingTransaction,
  storeName: string = "UBOS NITROGEN",
  paperSize: "58mm" | "80mm" = "58mm",
  footerText?: string
): string {
  const width = paperSize === "58mm" ? 32 : 42
  const separator = "-".repeat(width)
  const doubleSeparator = "=".repeat(width)

  const center = (text: string) => {
    if (text.length >= width) return text.substring(0, width)
    const leftPad = Math.floor((width - text.length) / 2)
    return " ".repeat(leftPad) + text
  }

  const row = (left: string, right: string) => {
    const spaceCount = Math.max(1, width - left.length - right.length)
    return left + " ".repeat(spaceCount) + right
  }

  const lines: string[] = []
  lines.push(doubleSeparator)
  lines.push(center(storeName.toUpperCase()))
  lines.push(center("OUTLET POS TERINTEGRASI"))
  lines.push(doubleSeparator)
  lines.push(row("No. Struk:", tx.id))
  lines.push(row("Cabang:", tx.branchName || "Cabang Outlet"))
  lines.push(row("Kasir:", tx.cashierName || "Kasir"))
  lines.push(
    row(
      "Waktu:",
      new Date(tx.createdAt).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "short",
        timeStyle: "short",
      })
    )
  )

  if (tx.customerPlate) {
    lines.push(row("Plat Kendaraan:", tx.customerPlate.toUpperCase()))
  }
  if (tx.customerPhone) {
    lines.push(row("No. Pelanggan:", tx.customerPhone))
  }

  lines.push(separator)
  lines.push("RINCIAN TRANSAKSI:")

  tx.items.forEach((item) => {
    lines.push(`${item.quantity}x ${item.productName}`)
    lines.push(row(`   @${formatRupiah(item.price)}`, formatRupiah(item.subtotal)))
  })

  lines.push(separator)
  lines.push(row("TOTAL TAGIHAN:", formatRupiah(tx.totalAmount)))
  lines.push(row("METODE BAYAR:", tx.paymentMethod))
  lines.push(separator)

  lines.push(center(footerText || "Terima Kasih Atas Kunjungan Anda!"))
  lines.push(center("Simpan struk ini sebagai bukti audit."))
  lines.push(doubleSeparator)
  lines.push("\n\n\n")

  return lines.join("\n")
}

/**
 * Converts text into ESC/POS binary buffer
 */
export function textToEscPos(text: string): Uint8Array {
  const encoder = new TextEncoder()
  const textBytes = encoder.encode(text)

  // ESC/POS Init: ESC @ (0x1B, 0x40)
  // Cut paper: GS V 65 0 (0x1D, 0x56, 0x41, 0x00)
  const init = new Uint8Array([0x1b, 0x40])
  const cut = new Uint8Array([0x1d, 0x56, 0x41, 0x00])

  const full = new Uint8Array(init.length + textBytes.length + cut.length)
  full.set(init, 0)
  full.set(textBytes, init.length)
  full.set(cut, init.length + textBytes.length)

  return full
}

/**
 * Send receipt bytes directly to Bluetooth printer
 */
export async function printDirectWebBluetooth(
  receiptText: string
): Promise<{ success: boolean; message: string }> {
  // If not connected yet, try connecting first
  if (!isBluetoothConnected()) {
    const conn = await connectBluetoothPrinter()
    if (!conn.success) {
      return { success: false, message: conn.message }
    }
  }

  if (!activeWriteCharacteristic) {
    throw new Error("Printer belum terhubung atau koneksi terputus. Silakan sambungkan ulang.")
  }

  try {
    const data = textToEscPos(receiptText)
    // Chunking to avoid Bluetooth MTU buffer overflow (max 100 bytes per chunk)
    const chunkSize = 100
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      if (activeWriteCharacteristic.writeValueWithoutResponse) {
        await activeWriteCharacteristic.writeValueWithoutResponse(chunk)
      } else {
        await activeWriteCharacteristic.writeValue(chunk)
      }
      // Small delay between packets to prevent printer buffer overrun
      await new Promise((resolve) => setTimeout(resolve, 25))
    }

    const deviceName = getConnectedDeviceName() || "Printer Bluetooth"
    return {
      success: true,
      message: `Struk berhasil dicetak ke ${deviceName}!`,
    }
  } catch (err: any) {
    console.error("Print write error:", err)
    // If GATT connection failed, reset state
    if (err.message && (err.message.includes("GATT") || err.message.includes("disconnected"))) {
      disconnectBluetoothPrinter()
    }
    throw new Error("Gagal mengirim data cetak ke printer Bluetooth: " + (err.message || ""))
  }
}

/**
 * Test Print Function to verify connection immediately
 */
export async function testPrintBluetooth(
  storeName: string = "UBOS NITROGEN",
  paperSize: "58mm" | "80mm" = "58mm"
): Promise<{ success: boolean; message: string }> {
  const dummyTx: InterlockingTransaction = {
    id: `TEST-${Date.now().toString().slice(-4)}`,
    branchId: "branch-utama",
    branchName: "CABANG UTAMA",
    cashierName: "Uji Coba Sistem",
    totalAmount: 15000,
    paymentMethod: "CASH",
    createdAt: new Date().toISOString(),
    status: "COMPLETED",
    items: [
      {
        productId: "nitro-motor-tambal",
        productName: "Uji Cetak Printer Bluetooth",
        category: "NITROGEN",
        quantity: 1,
        price: 15000,
        costPrice: 0,
        subtotal: 15000,
      },
    ],
  }

  const receipt = formatTextReceipt(dummyTx, storeName, paperSize, "KONEKSI PRINTER BLUETOOTH OK")
  return await printDirectWebBluetooth(receipt)
}

/**
 * Opsi B: Android RawBT Intent URL Scheme fallback
 */
export function getRawBtIntentUrl(receiptText: string): string {
  if (typeof window === "undefined") return ""
  const base64Data = btoa(unescape(encodeURIComponent(receiptText)))
  return `rawbt:data:text/plain;base64,${base64Data}`
}
