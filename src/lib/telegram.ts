/**
 * Telegram Notification Helper for IoT Fraud & Anomaly Alerts
 */
export async function sendTelegramAlert(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.log("[Telegram Alert Fallback]:", message)
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
