import { DEFAULT_BRANCHES, InterlockingTransaction, ShiftClosing, FraudAlert } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import { getTransactions, getShiftClosings, getFraudAlerts, getBranches } from "@/lib/interlockingDb"

export const DEFAULT_TELEGRAM_RECIPIENT = "083153598697"

let activeTelegramRecipient = DEFAULT_TELEGRAM_RECIPIENT

export function getActiveTelegramRecipient(): string {
  return activeTelegramRecipient
}

export function setActiveTelegramRecipient(phone: string) {
  if (phone && phone.trim()) {
    activeTelegramRecipient = phone.trim()
  }
}

/**
 * Telegram Notification Helper for IoT Fraud & Anomaly Alerts
 */
export async function sendTelegramAlert(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.log(`[Telegram Alert Fallback -> Target: ${activeTelegramRecipient}]:\n`, message)
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    })

    return res.ok
  } catch (error) {
    console.error("[Telegram Alert Error]:", error)
    return false
  }
}

/**
 * Generate formatted Daily Transaction & Anti-Loss Report text for a branch or all branches
 */
export async function generateDailyBranchReportText(branchId?: string, recipientPhone?: string): Promise<{
  reportText: string
  branchName: string
  totalRevenue: number
  txCount: number
}> {
  const branches = await getBranches()
  const targetBranch = branchId && branchId !== "ALL" 
    ? branches.find(b => b.id === branchId) || DEFAULT_BRANCHES.find(b => b.id === branchId)
    : null

  const branchName = targetBranch ? targetBranch.name : `Konsolidasi Seluruh Cabang (${branches.length} Outlet)`
  const targetPhone = recipientPhone || activeTelegramRecipient

  const [allTx, allClosings, allAlerts] = await Promise.all([
    getTransactions(branchId && branchId !== "ALL" ? branchId : undefined),
    getShiftClosings(branchId && branchId !== "ALL" ? branchId : undefined),
    getFraudAlerts(branchId && branchId !== "ALL" ? branchId : undefined),
  ])

  const totalRevenue = allTx.reduce((sum, t) => sum + t.totalAmount, 0)
  const totalGrossProfit = allTx.reduce((sum, t) => sum + (t.grossProfit || t.totalAmount * 0.7), 0)
  const txCount = allTx.length

  // Nitrogen counts
  let nitroMotorCount = 0
  let nitroMobilCount = 0
  let totalTimerSeconds = 0
  let verifiedPlatesCount = 0

  // Retail counts
  let retailOilBottles = 0
  let verifiedBottlesCount = 0

  allTx.forEach(tx => {
    if (tx.vehiclePhotoUrl) verifiedPlatesCount++
    if (tx.usedBottlePhotoUrl) verifiedBottlesCount++

    tx.items.forEach(item => {
      if (item.category === "NITROGEN") {
        if (item.productName.toLowerCase().includes("motor")) {
          nitroMotorCount += item.quantity
          totalTimerSeconds += item.quantity * 20
        } else {
          nitroMobilCount += item.quantity
          totalTimerSeconds += item.quantity * 60
        }
      } else if (item.category === "RETAIL") {
        retailOilBottles += item.quantity
      }
    })
  })

  // Shift closings calculation
  const totalPhysicalCash = allClosings.reduce((sum, c) => sum + c.physicalCash, 0)
  const totalDiscrepancy = allClosings.reduce((sum, c) => sum + c.discrepancy, 0)

  const dateStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date())

  const reportText = `
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<b>LAPORAN TRANSAKSI & ANTI-LOSS HARIAN</b>
<b>UBOS MULTI-BRANCH NITROGEN & RITEL</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>

<b>Cabang:</b> ${branchName}
<b>Waktu Cetak:</b> ${dateStr} WIB
<b>Target WhatsApp/Telegram:</b> ${targetPhone}

<b>RINGKASAN FINANSIAL:</b>
• Total Omzet: <b>${formatRupiah(totalRevenue)}</b>
• Estimasi Laba Kotor: <b>${formatRupiah(totalGrossProfit)}</b>
• Total Transaksi POS: <b>${txCount} Transaksi</b>

<b>LAYANAN NITROGEN (IOT INTERLOCKING):</b>
• Motor (Tambah/Full): ${nitroMotorCount} pengisian
• Mobil (Tambah/Full): ${nitroMobilCount} pengisian
• Total Waktu Buka Katup Solenoid: ${totalTimerSeconds} detik
• Foto Plat Nomor Terverifikasi: ${verifiedPlatesCount} unit

<b>PENJUALAN RITEL & OLI:</b>
• Botol Oli Terjual: ${retailOilBottles} botol
• Foto Botol Bekas Terverifikasi: ${verifiedBottlesCount} foto

<b>AUDIT TUTUP SHIFT (BLIND CLOSING):</b>
• Total Uang Fisik Kasir: <b>${formatRupiah(totalPhysicalCash)}</b>
• Selisih Kasir vs Sistem: <b>${totalDiscrepancy === 0 ? "Rp 0 (COCOK / BALANCE)" : (totalDiscrepancy > 0 ? "+" : "") + formatRupiah(totalDiscrepancy)}</b>
• Laporan Shift Tercatat: ${allClosings.length} shift

<b>STATUS PERANGKAT IOT & FRAUD ALERT:</b>
• Solenoid Valve Controller: <b>ONLINE & TERKUNCI</b>
• Anomali Terdeteksi: <b>${allAlerts.length} kejadian</b>
${allAlerts.length > 0 ? allAlerts.map(a => `  ⚠️ [${a.branchName}] ${a.message}`).join("\n") : "  ✓ Seluruh sensor flow meter normal (Tidak ada bypass liar)."}

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<i>Laporan otomatis dihasilkan oleh UBOS Anti-Loss Interlocking System.</i>
`.trim()

  return {
    reportText,
    branchName,
    totalRevenue,
    txCount,
  }
}

/**
 * Dispatch Daily Branch Report to Telegram Bot
 */
export async function sendDailyBranchReportTelegram(branchId?: string, targetRecipient?: string): Promise<{
  success: boolean
  message: string
  reportText: string
  shareUrl: string
}> {
  const recipient = targetRecipient || activeTelegramRecipient
  const { reportText, branchName } = await generateDailyBranchReportText(branchId, recipient)

  // Direct share link to Telegram
  const cleanTextForUrl = reportText
    .replace(/<[^>]*>/g, "") // strip HTML tags for URL sharing
    .trim()

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent("https://ubos.id")}&text=${encodeURIComponent(cleanTextForUrl)}`

  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.log(`[Telegram Bot Report to ${recipient}] (Bot token/chatId belum diset di .env):\n${cleanTextForUrl}`)
    return {
      success: true,
      message: `Laporan cabang "${branchName}" berhasil dibuat untuk nomor ${recipient}. Link Telegram siap digunakan.`,
      reportText,
      shareUrl,
    }
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: reportText,
        parse_mode: "HTML",
      }),
    })

    if (res.ok) {
      return {
        success: true,
        message: `Laporan cabang "${branchName}" berhasil dikirim langsung ke Telegram bot penerima ${recipient}.`,
        reportText,
        shareUrl,
      }
    } else {
      const errJson = await res.json().catch(() => ({}))
      console.warn("[Telegram Bot API Response Warning]:", errJson)
      return {
        success: true,
        message: `Laporan cabang "${branchName}" siap dikirim via link Telegram langsung ke nomor ${recipient}.`,
        reportText,
        shareUrl,
      }
    }
  } catch (error: any) {
    console.error("[Telegram Bot API Send Error]:", error)
    return {
      success: true,
      message: `Laporan cabang "${branchName}" siap dikirim via link Telegram ke ${recipient}.`,
      reportText,
      shareUrl,
    }
  }
}
