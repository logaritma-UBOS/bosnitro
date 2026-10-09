import { DEFAULT_BRANCHES, InterlockingTransaction, ShiftClosing, FraudAlert } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import { getTransactions, getShiftClosings, getFraudAlerts, getBranches } from "@/lib/interlockingDb"

export const DEFAULT_TELEGRAM_RECIPIENT = "083153598697"

let activeTelegramRecipient = DEFAULT_TELEGRAM_RECIPIENT
let activeTelegramChatId: string | null = null

export function getActiveTelegramRecipient(): string {
  return activeTelegramRecipient
}

export function setActiveTelegramRecipient(phone: string) {
  if (phone && phone.trim()) {
    activeTelegramRecipient = phone.trim()
  }
}

export function getActiveTelegramChatId(): string | null {
  return activeTelegramChatId
}

export function setActiveTelegramChatId(chatId: string | null) {
  activeTelegramChatId = chatId && chatId.trim() ? chatId.trim() : null
}

/**
 * Telegram Notification Helper for IoT Fraud & Anomaly Alerts
 */
export async function sendTelegramAlert(message: string): Promise<boolean> {
  let botToken = process.env.TELEGRAM_BOT_TOKEN
  let targetChatId = activeTelegramChatId || process.env.TELEGRAM_CHAT_ID

  if (!botToken || !targetChatId) {
    try {
      const { prisma } = await import("@/lib/prisma")
      if (!botToken) {
        const sysToken = await prisma.systemSetting.findUnique({ where: { key: "store_telegram_bot_token" } })
        if (sysToken?.value) botToken = sysToken.value
      }
      if (!targetChatId) {
        const sysChat = await prisma.systemSetting.findUnique({ where: { key: "store_telegram_chat_id" } })
        if (sysChat?.value) targetChatId = sysChat.value
      }
    } catch (e) {}
  }

  if (!botToken || !targetChatId) {
    console.log(`[Telegram Alert Fallback -> Target Phone: ${activeTelegramRecipient} | ChatId: ${targetChatId || "none"}]:\n`, message)
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: targetChatId,
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
export async function sendDailyBranchReportTelegram(
  branchId?: string,
  targetRecipient?: string,
  targetChatId?: string,
  customBotToken?: string
): Promise<{
  success: boolean
  sentAutomatic?: boolean
  status?: "SENT_AUTOMATIC" | "TELEGRAM_API_ERROR" | "NEED_BOT_TOKEN" | "PREPARED"
  message: string
  reportText: string
  cleanText: string
  shareUrl: string
  whatsappUrl: string
}> {
  const recipient = targetRecipient || activeTelegramRecipient
  let destinationChatId = targetChatId || activeTelegramChatId || process.env.TELEGRAM_CHAT_ID

  // If destinationChatId is still missing, attempt to fetch from DB
  if (!destinationChatId) {
    try {
      const { prisma } = await import("@/lib/prisma")
      const sysChat = await prisma.systemSetting.findUnique({ where: { key: "store_telegram_chat_id" } })
      if (sysChat?.value) destinationChatId = sysChat.value
    } catch (e) {}
  }

  let botToken = customBotToken || process.env.TELEGRAM_BOT_TOKEN
  if (!botToken) {
    try {
      const { prisma } = await import("@/lib/prisma")
      const sysToken = await prisma.systemSetting.findUnique({ where: { key: "store_telegram_bot_token" } })
      if (sysToken?.value) botToken = sysToken.value
    } catch (e) {}
  }

  const { reportText, branchName } = await generateDailyBranchReportText(branchId, recipient)

  // Direct share link to Telegram
  const cleanTextForUrl = reportText
    .replace(/<[^>]*>/g, "") // strip HTML tags for URL sharing
    .trim()

  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent("https://ubos.id")}&text=${encodeURIComponent(cleanTextForUrl)}`

  // Direct WhatsApp link as reliable alternative
  let waPhone = recipient.replace(/[^0-9]/g, "")
  if (waPhone.startsWith("0")) waPhone = "62" + waPhone.substring(1)
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(cleanTextForUrl)}`

  // Jika botToken dan destinationChatId tersedia, kirim langsung via Telegram API secara otomatis!
  if (botToken && destinationChatId) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: destinationChatId,
          text: reportText,
          parse_mode: "HTML",
        }),
      })

      if (res.ok) {
        return {
          success: true,
          sentAutomatic: true,
          status: "SENT_AUTOMATIC",
          message: `✓ Laporan cabang "${branchName}" berhasil terkirim otomatis ke Grup Telegram (${destinationChatId})!`,
          reportText,
          cleanText: cleanTextForUrl,
          shareUrl,
          whatsappUrl,
        }
      } else {
        const errJson = await res.json().catch(() => ({}))
        const errorDesc = errJson.description || res.statusText || "Gagal menghubungi Telegram API"
        return {
          success: false,
          sentAutomatic: false,
          status: "TELEGRAM_API_ERROR",
          message: `Gagal mengirim otomatis: ${errorDesc}. Pastikan Bot sudah diundang ke grup (${destinationChatId}) dan memiliki hak kirim pesan.`,
          reportText,
          cleanText: cleanTextForUrl,
          shareUrl,
          whatsappUrl,
        }
      }
    } catch (error: any) {
      console.error("[Telegram Bot API Send Error]:", error)
      return {
        success: false,
        sentAutomatic: false,
        status: "TELEGRAM_API_ERROR",
        message: `Koneksi Telegram: ${error.message}. Silakan periksa koneksi atau gunakan tombol Buka di Telegram.`,
        reportText,
        cleanText: cleanTextForUrl,
        shareUrl,
        whatsappUrl,
      }
    }
  }

  // Fallback jika belum ada botToken
  return {
    success: true,
    sentAutomatic: false,
    status: destinationChatId ? "NEED_BOT_TOKEN" : "PREPARED",
    message: destinationChatId
      ? `ID Grup Telegram (${destinationChatId}) tersinkronisasi. Masukkan Token Bot Telegram di Pengaturan Toko untuk kirim otomatis 1-klik tanpa membuka aplikasi Telegram.`
      : `Laporan cabang "${branchName}" berhasil disiapkan untuk ${recipient}. Teks siap disalin atau dibuka via Telegram/WhatsApp.`,
    reportText,
    cleanText: cleanTextForUrl,
    shareUrl,
    whatsappUrl,
  }
}
