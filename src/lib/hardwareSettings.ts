import { HardwareSettings } from "@/types/branch"

const DEFAULT_HARDWARE_SETTINGS: HardwareSettings = {
  // 1. IoT ESP32 Nitrogen
  iotEnabled: true,
  esp32Ip: "192.168.1.150:81",
  esp32WsUrl: "ws://192.168.1.150:81",
  esp32Token: "UBOS-SECURE-KEY-8899",
  motorTimerTambah: 15,
  motorTimerBaru: 30,
  motorTimerFull: 35,
  mobilTimerTambah: 30,
  mobilTimerFull: 60,

  // 2. Auto-Capture CCTV / Snapshot
  cctvMethod: "CAMERA_TABLET",
  cctvCaptureMode: "BOTH",
  cctvSnapshotUrl: "http://192.168.1.180/cgi-bin/snapshot.cgi",
  cctvEndpointUrl: "http://192.168.1.180/cgi-bin/snapshot.cgi",
  cctvUsername: "admin",
  cctvPassword: "password123",
  cctvAuthUser: "admin",
  cctvAuthPass: "admin123",
  autoCaptureOnCheckout: true,

  // 3. Mini Bluetooth Thermal Printer
  printerMethod: "WEB_BLUETOOTH",
  printerDriverMode: "WEB_BLUETOOTH",
  paperSize: "58mm",
  printerPaperSize: "58mm",
  bluetoothPrinterName: "RPP02N / MPT-II",
  bluetoothPrinterMac: "66:32:B1:88:9F:12",
  printerStoreHeader: "UBOS NITROGEN & SERVICE CENTER",
  printerFooterNote: "Terima kasih atas kunjungan Anda! Simpan struk ini sebagai bukti audit.",
  autoPrintOnSuccess: true,
  autoPrintAfterPayment: true,

  // 4. Target & Sistem Reward Omzet Harian
  monthlyTarget: 75000000,
  dailyTarget: 2500000,
  targetDailyOmzet: 2500000,
  rewardBonusPool: 2000000,
  rewardCriteria: "DAILY_AVG_TARGET",
  rewardType: "NOMINAL",
  rewardAmount: 2000000,
  rewardNotes: "Bonus apresiasi tim cabang per bulan jika rata-rata omzet harian 30 hari melampaui target.",
}

// Runtime in-memory store
let runtimeHardwareSettings: HardwareSettings = { ...DEFAULT_HARDWARE_SETTINGS }

export async function getHardwareSettings(): Promise<HardwareSettings> {
  return runtimeHardwareSettings
}

export async function updateHardwareSettings(data: Partial<HardwareSettings>): Promise<HardwareSettings> {
  runtimeHardwareSettings = {
    ...runtimeHardwareSettings,
    ...data,
  }
  return runtimeHardwareSettings
}
