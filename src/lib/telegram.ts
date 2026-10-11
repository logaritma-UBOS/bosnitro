import { DEFAULT_BRANCHES, InterlockingTransaction, ShiftClosing, FraudAlert, Branch, SYSTEM_DEFAULT_TELEGRAM_BOT_TOKEN, SYSTEM_DEFAULT_BOT_USERNAME } from "@/types/branch"
import { formatRupiah } from "@/lib/format"
import { getTransactions, getShiftClosings, getFraudAlerts, getBranches, recordFraudAlert } from "@/lib/interlockingDb"

export { SYSTEM_DEFAULT_TELEGRAM_BOT_TOKEN, SYSTEM_DEFAULT_BOT_USERNAME }
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
 * Automatically resolves bot token using default system bot token if not set.
 */
export async function sendTelegramAlert(
  message: string,
  businessId?: string,
  targetChatId?: string,
  customBotToken?: string
): Promise<boolean> {
  const botToken = customBotToken || SYSTEM_DEFAULT_TELEGRAM_BOT_TOKEN
  let destinationChatId = targetChatId || (businessId ? undefined : activeTelegramChatId)

  // 1. Check database for tenant-specific or global chat ID
  if (!destinationChatId) {
    try {
      const { prisma } = await import("@/lib/prisma")
      if (businessId) {
        const sysChat = await prisma.systemSetting.findUnique({
          where: { key: `${businessId}_store_telegram_chat_id` },
        })
        if (sysChat?.value) destinationChatId = sysChat.value
      }
      if (!destinationChatId) {
        const sysChat = await prisma.systemSetting.findUnique({
          where: { key: "store_telegram_chat_id" },
        })
        if (sysChat?.value) destinationChatId = sysChat.value
      }
    } catch (e) {}
  }

  // 2. Fallbacks
  if (!destinationChatId) {
    destinationChatId = activeTelegramChatId || process.env.TELEGRAM_CHAT_ID || undefined
  }

  if (!destinationChatId) {
    console.log(
      `[Telegram Alert Fallback -> Target Phone: ${activeTelegramRecipient} | ChatId: none]:\n`,
      message
    )
    return false
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: destinationChatId,
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
 * Dispatch Emergency Alert when an IoT Device is Dead / Offline / Anomaly Detected
 */
export async function sendIoTAnomalyAlert({
  branchId,
  branchName,
  deviceId,
  status = "OFFLINE",
  reason,
  businessId,
  targetChatId,
}: {
  branchId: string
  branchName: string
  deviceId: string
  status?: "OFFLINE" | "ANOMALY" | "DISCONNECTED"
  reason?: string
  businessId?: string
  targetChatId?: string
}): Promise<boolean> {
  const dateStr = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "medium",
  }).format(new Date())

  const alertMsg = `🚨 <b>PERINGATAN SISTEM ANOMALI - PERANGKAT IOT MATI (OFFLINE)</b>\n\n` +
    `📍 <b>Cabang:</b> ${branchName}\n` +
    `📟 <b>Device ID:</b> <code>${deviceId}</code>\n` +
    `🔴 <b>Status:</b> <b>PERANGKAT MATI / TIDAK MERESPONS</b>\n` +
    `⚠️ <b>Detail Anomali:</b> ${reason || "Koneksi terputus ke modul ESP32 solenoid valve. Perangkat tidak merespons perintah kontrol."}\n` +
    `⏰ <b>Waktu Terdeteksi:</b> ${dateStr} WIB\n\n` +
    `<i>Tindakan: Mohon segera periksa sambungan adaptor daya ESP32 dan koneksi WiFi outlet di ${branchName}.</i>`

  // Record into audit DB
  recordFraudAlert({
    businessId,
    branchId,
    deviceId,
    alertType: "DEVICE_OFFLINE",
    message: `Perangkat ${deviceId} (${branchName}) terdeteksi OFFLINE: ${reason || "Koneksi modul ESP32 terputus"}`,
  }).catch(console.error)

  return sendTelegramAlert(alertMsg, businessId, targetChatId)
}

/**
 * Generate formatted Daily Transaction & Anti-Loss Report text for Owner Dashboard
 * Includes multi-branch breakdown, latest transactions, audit & fraud, and IoT controller status.
 */
export async function generateDailyBranchReportText(
  branchId?: string,
  recipientPhone?: string,
  businessId?: string
): Promise<{
  reportText: string
  branchName: string
  totalRevenue: number
  txCount: number
}> {
  const branches = await getBranches(businessId)
  const isConsolidated = !branchId || branchId === "ALL"

  const targetBranch = !isConsolidated
    ? branches.find((b) => b.id === branchId) || DEFAULT_BRANCHES.find((b) => b.id === branchId)
    : null

  const branchName = targetBranch
    ? targetBranch.name
    : `Konsolidasi Seluruh Cabang (${branches.length} Outlet)`
  const targetPhone = recipientPhone || activeTelegramRecipient

  const [allTx, allClosings, allAlerts] = await Promise.all([
    getTransactions(branchId && branchId !== "ALL" ? branchId : undefined, businessId),
    getShiftClosings(branchId && branchId !== "ALL" ? branchId : undefined, businessId),
    getFraudAlerts(branchId && branchId !== "ALL" ? branchId : undefined, businessId),
  ])

  const totalRevenue = allTx.reduce((sum, t) => sum + t.totalAmount, 0)
  const totalGrossProfit = allTx.reduce((sum, t) => sum + (t.grossProfit || t.totalAmount * 0.7), 0)
  const txCount = allTx.length

  // Nitrogen & Retail metrics
  let nitroMotorCount = 0
  let nitroMobilCount = 0
  let totalTimerSeconds = 0
  let verifiedPlatesCount = 0
  let retailOilBottles = 0
  let verifiedBottlesCount = 0

  allTx.forEach((tx) => {
    if (tx.vehiclePhotoUrl) verifiedPlatesCount++
    if (tx.usedBottlePhotoUrl) verifiedBottlesCount++

    tx.items.forEach((item) => {
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

  let reportText = ""

  if (isConsolidated) {
    // ===== DASHBOARD OWNER: KONSOLIDASI MULTI-CABANG =====
    const branchPerformanceLines = branches
      .map((b) => {
        const bTxs = allTx.filter((t) => t.branchId === b.id)
        const bRev = bTxs.reduce((sum, t) => sum + t.totalAmount, 0)
        const bClosings = allClosings.filter((c) => c.branchId === b.id)

        let bMotor = 0
        let bMobil = 0
        let bOli = 0
        bTxs.forEach((t) => {
          t.items.forEach((item) => {
            if (item.category === "NITROGEN") {
              if (item.productName.toLowerCase().includes("motor")) bMotor += item.quantity
              else bMobil += item.quantity
            } else if (item.category === "RETAIL") {
              bOli += item.quantity
            }
          })
        })

        const statusIot = b.status === "OFFLINE" ? "🔴 MATI (OFFLINE)" : "🟢 ONLINE & VALVE READY"
        const devId = b.deviceId || "ESP32-CONTROLLER"
        const shiftStatus = bClosings.length > 0
          ? `Kasir ${bClosings[0].cashierName} (Fisik: ${formatRupiah(bClosings[0].physicalCash)}, Selisih: ${bClosings[0].discrepancy === 0 ? "Rp 0" : formatRupiah(bClosings[0].discrepancy)})`
          : "Shift Aktif"

        return `📍 <b>${b.name}</b> (${b.location || "Outlet"})
  ├ Status IoT: <b>${statusIot}</b> [<code>${devId}</code>]
  ├ Omzet Cabang: <b>${formatRupiah(bRev)}</b> (${bTxs.length} transaksi)
  ├ Layanan: ${bMotor} motor, ${bMobil} mobil, ${bOli} botol oli
  └ Status Shift: ${shiftStatus}`
      })
      .join("\n\n")

    // Latest transactions across branches
    const latestTxs = allTx.slice(0, 8)
    const latestTxLines = latestTxs.length > 0
      ? latestTxs
          .map((t) => {
            const time = new Date(t.createdAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Jakarta",
            })
            const plate = t.customerPlate || "-"
            const itemsStr = t.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")
            return `• [${time} WIB] <b>${t.branchName}</b> | Plat: <code>${plate}</code> | ${itemsStr} | <b>${formatRupiah(t.totalAmount)}</b> (${t.paymentMethod}) - Kasir: ${t.cashierName}`
          })
          .join("\n")
      : "• Belum ada transaksi tercatat hari ini."

    // Fraud alerts
    const fraudLines = allAlerts.length > 0
      ? allAlerts
          .slice(0, 5)
          .map((a) => {
            const time = new Date(a.detectedAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Jakarta",
            })
            return `⚠️ [${time} WIB] <b>${a.branchName}</b>: ${a.message}`
          })
          .join("\n")
      : "✓ Seluruh sensor flow meter normal (Tidak ada aliran liar / bypass katup)."

    // IoT Controller Statuses & Anomalies
    const iotStatusLines = branches
      .map((b) => {
        if (b.status === "OFFLINE") {
          return `🔴 <b>${b.name}: PERANGKAT IOT MATI (OFFLINE)!</b> Segera cek daya/WiFi gerai.`
        }
        return `🟢 <b>${b.name}:</b> Modul ${b.deviceId || "ESP32"} Online (Solenoid Interlocking Siap)`
      })
      .join("\n")

    reportText = `
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
📊 <b>LAPORAN KONSOLIDASI OWNER & MULTI-CABANG</b>
🏢 <b>BOSNITRO ANTI-LOSS INTERLOCKING SYSTEM</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>

<b>Cakupan:</b> ${branchName}
<b>Waktu Cetak:</b> ${dateStr} WIB
<b>Target Laporan:</b> ${targetPhone}

<b>💰 RINGKASAN FINANSIAL (AKUMULASI SELURUH CABANG):</b>
• Total Omzet: <b>${formatRupiah(totalRevenue)}</b>
• Estimasi Laba Kotor: <b>${formatRupiah(totalGrossProfit)}</b>
• Total Transaksi POS: <b>${txCount} Transaksi</b>
• Total Uang Fisik Kasir: <b>${formatRupiah(totalPhysicalCash)}</b>
• Selisih Kasir vs Sistem: <b>${totalDiscrepancy === 0 ? "Rp 0 (COCOK / BALANCE)" : (totalDiscrepancy > 0 ? "+" : "") + formatRupiah(totalDiscrepancy)}</b>

<b>🏪 RINCIAN PERFORMA DARI MASING-MASING CABANG:</b>
${branchPerformanceLines}

<b>🧾 RIWAYAT TRANSAKSI TERAKHIR DARI MASING-MASING CABANG:</b>
${latestTxLines}

<b>🚨 AUDIT & FRAUD DETECTION (ANTI-LOSS):</b>
• Anomali Terdeteksi: <b>${allAlerts.length} Kejadian</b>
${fraudLines}

<b>📟 STATUS PERANGKAT IOT & SISTEM ANOMALI CABANG:</b>
${iotStatusLines}

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<i>Laporan otomatis dihasilkan oleh BOSNITRO Anti-Loss Interlocking System.</i>
`.trim()
  } else {
    // ===== LAPORAN CABANG SPESIFIK =====
    const latestTxs = allTx.slice(0, 6)
    const latestTxLines = latestTxs.length > 0
      ? latestTxs
          .map((t) => {
            const time = new Date(t.createdAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Jakarta",
            })
            const plate = t.customerPlate || "-"
            const itemsStr = t.items.map((i) => `${i.quantity}x ${i.productName}`).join(", ")
            return `• [${time} WIB] Plat: <code>${plate}</code> | ${itemsStr} | <b>${formatRupiah(t.totalAmount)}</b> (${t.paymentMethod}) - Kasir: ${t.cashierName}`
          })
          .join("\n")
      : "• Belum ada transaksi tercatat di cabang ini."

    const iotDevice = targetBranch?.deviceId || "ESP32-CONTROLLER"
    const isOffline = targetBranch?.status === "OFFLINE"

    reportText = `
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
📍 <b>LAPORAN TRANSAKSI & OPERASIONAL CABANG</b>
🏢 <b>BOSNITRO - ${branchName.toUpperCase()}</b>
<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>

<b>Lokasi Gerai:</b> ${targetBranch?.location || "-"}
<b>Waktu Cetak:</b> ${dateStr} WIB
<b>Status Perangkat IoT:</b> ${isOffline ? "🔴 <b>MATI (OFFLINE)</b>" : "🟢 <b>ONLINE & VALVE READY</b>"} (<code>${iotDevice}</code>)

<b>RINGKASAN FINANSIAL CABANG:</b>
• Total Omzet: <b>${formatRupiah(totalRevenue)}</b>
• Estimasi Laba Kotor: <b>${formatRupiah(totalGrossProfit)}</b>
• Total Transaksi Kasir: <b>${txCount} Transaksi</b>

<b>LAYANAN NITROGEN (IOT INTERLOCKING):</b>
• Motor (Tambah/Full): ${nitroMotorCount} ban
• Mobil (Tambah/Full): ${nitroMobilCount} ban
• Total Waktu Solenoid Terbuka: ${totalTimerSeconds} detik
• Foto Plat Nomor Terverifikasi: ${verifiedPlatesCount} unit

<b>PENJUALAN RITEL & OLI:</b>
• Botol Oli Terjual: ${retailOilBottles} botol
• Foto Botol Bekas Terverifikasi: ${verifiedBottlesCount} foto

<b>AUDIT TUTUP SHIFT (BLIND CLOSING):</b>
• Total Uang Fisik Kasir: <b>${formatRupiah(totalPhysicalCash)}</b>
• Selisih Kasir vs Sistem: <b>${totalDiscrepancy === 0 ? "Rp 0 (COCOK / BALANCE)" : (totalDiscrepancy > 0 ? "+" : "") + formatRupiah(totalDiscrepancy)}</b>
• Laporan Shift Tercatat: ${allClosings.length} shift

<b>RIWAYAT TRANSAKSI TERAKHIR:</b>
${latestTxLines}

<b>STATUS ANOMALI & FRAUD SENSOR:</b>
${allAlerts.length > 0 ? allAlerts.map((a) => `⚠️ ${a.message}`).join("\n") : "✓ Normal: Sensor flow meter & katup solenoid interlocking aman."}

<b>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</b>
<i>Laporan otomatis dihasilkan oleh BOSNITRO Anti-Loss Interlocking System.</i>
`.trim()
  }

  return {
    reportText,
    branchName,
    totalRevenue,
    txCount,
  }
}

/**
 * Dispatch Daily Branch / Consolidated Report to Telegram Bot
 * Automatically uses system default bot token if user has not configured a custom one.
 */
export async function sendDailyBranchReportTelegram(
  branchId?: string,
  targetRecipient?: string,
  targetChatId?: string,
  customBotToken?: string,
  businessId?: string
): Promise<{
  success: boolean
  sentAutomatic?: boolean
  status?: "SENT_AUTOMATIC" | "TELEGRAM_API_ERROR" | "NEED_CHAT_ID" | "PREPARED"
  message: string
  reportText: string
  cleanText: string
  shareUrl: string
  whatsappUrl: string
}> {
  const recipient = targetRecipient || activeTelegramRecipient
  let destinationChatId =
    targetChatId || (businessId ? undefined : activeTelegramChatId)

  // Resolve Chat ID from DB if missing
  if (!destinationChatId) {
    try {
      const { prisma } = await import("@/lib/prisma")
      if (businessId) {
        const sysChat = await prisma.systemSetting.findUnique({
          where: { key: `${businessId}_store_telegram_chat_id` },
        })
        if (sysChat?.value) destinationChatId = sysChat.value
      }
      if (!destinationChatId) {
        const sysChat = await prisma.systemSetting.findUnique({
          where: { key: "store_telegram_chat_id" },
        })
        if (sysChat?.value) destinationChatId = sysChat.value
      }
    } catch (e) {}
  }

  if (!destinationChatId) {
    destinationChatId = activeTelegramChatId || process.env.TELEGRAM_CHAT_ID || undefined
  }

  // Resolve Bot Token: Custom -> Tenant -> Global -> Default System Token
  let botToken = customBotToken
  if (!botToken) {
    try {
      const { prisma } = await import("@/lib/prisma")
      if (businessId) {
        const sysToken = await prisma.systemSetting.findUnique({
          where: { key: `${businessId}_store_telegram_bot_token` },
        })
        if (sysToken?.value) botToken = sysToken.value
      }
      if (!botToken) {
        const sysToken = await prisma.systemSetting.findUnique({
          where: { key: "store_telegram_bot_token" },
        })
        if (sysToken?.value) botToken = sysToken.value
      }
    } catch (e) {}
  }

  if (!botToken) {
    botToken = process.env.TELEGRAM_BOT_TOKEN || SYSTEM_DEFAULT_TELEGRAM_BOT_TOKEN
  }

  const { reportText, branchName } = await generateDailyBranchReportText(
    branchId,
    recipient,
    businessId
  )

  // Clean plain text without HTML tags for fallback URL sharing
  const cleanTextForUrl = reportText.replace(/<[^>]*>/g, "").trim()
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent("https://bosnitro.logaritma.id")}&text=${encodeURIComponent(cleanTextForUrl)}`

  let waPhone = recipient.replace(/[^0-9]/g, "")
  if (waPhone.startsWith("0")) waPhone = "62" + waPhone.substring(1)
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${waPhone}&text=${encodeURIComponent(cleanTextForUrl)}`

  // Send automatically via Telegram Bot API
  if (destinationChatId) {
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
          message: `✓ Laporan "${branchName}" berhasil terkirim otomatis ke Grup Telegram (${destinationChatId}) via @${SYSTEM_DEFAULT_BOT_USERNAME}!`,
          reportText,
          cleanText: cleanTextForUrl,
          shareUrl,
          whatsappUrl,
        }
      } else {
        const errJson = await res.json().catch(() => ({}))
        const errorDesc =
          errJson.description || res.statusText || "Gagal menghubungi Telegram API"
        return {
          success: false,
          sentAutomatic: false,
          status: "TELEGRAM_API_ERROR",
          message: `Gagal mengirim otomatis: ${errorDesc}. Pastikan bot @${SYSTEM_DEFAULT_BOT_USERNAME} telah diundang ke grup (${destinationChatId}) dan memiliki izin kirim pesan.`,
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
        message: `Koneksi Telegram error: ${error.message}. Silakan periksa jaringan Anda.`,
        reportText,
        cleanText: cleanTextForUrl,
        shareUrl,
        whatsappUrl,
      }
    }
  }

  // If chat ID is missing
  return {
    success: true,
    sentAutomatic: false,
    status: "NEED_CHAT_ID",
    message: `ID Chat / Grup Telegram belum diisi. Masukkan ID Grup di Pengaturan Bisnis/Toko agar laporan "${branchName}" terkirim otomatis.`,
    reportText,
    cleanText: cleanTextForUrl,
    shareUrl,
    whatsappUrl,
  }
}
