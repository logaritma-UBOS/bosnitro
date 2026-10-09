import { formatRupiah } from "@/lib/format"
import { InterlockingTransaction } from "@/types/branch"

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
  lines.push(row("Cabang:", tx.branchName || "Tambun"))
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
  lines.push("\n\n")

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
 * Opsi A: Direct Web Bluetooth API printing
 */
export async function printDirectWebBluetooth(receiptText: string): Promise<{ success: boolean; message: string }> {
  if (typeof window === "undefined" || !(navigator as any).bluetooth) {
    throw new Error("Web Bluetooth API tidak didukung pada browser ini. Gunakan Chrome di Android/PC atau Opsi RawBT.")
  }

  try {
    const nav = navigator as any
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        "0000ffe0-0000-1000-8000-00805f9b34fb",
        "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      ],
    })

    const server = await device.gatt.connect()
    const services = await server.getPrimaryServices()

    let writeChar = null
    for (const service of services) {
      const chars = await service.getCharacteristics()
      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          writeChar = char
          break
        }
      }
      if (writeChar) break
    }

    if (!writeChar) {
      throw new Error("Karakteristik write Bluetooth thermal printer tidak ditemukan.")
    }

    const data = textToEscPos(receiptText)
    // Chunking to avoid Bluetooth MTU buffer overflow (max 100 bytes per chunk)
    const chunkSize = 100
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize)
      await writeChar.writeValue(chunk)
    }

    return { success: true, message: "Struk berhasil dicetak via Web Bluetooth!" }
  } catch (err: any) {
    if (err.name === "NotFoundError") {
      return { success: false, message: "Pemilihan printer Bluetooth dibatalkan." }
    }
    throw err
  }
}

/**
 * Opsi B: Android RawBT Intent URL Scheme
 */
export function getRawBtIntentUrl(receiptText: string): string {
  if (typeof window === "undefined") return ""
  const base64Data = btoa(unescape(encodeURIComponent(receiptText)))
  return `rawbt:data:text/plain;base64,${base64Data}`
}
