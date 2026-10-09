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

// Multi-tenant in-memory hardware configuration map keyed by branchId
const branchHardwareMap: Record<string, HardwareSettings> = {
  "branch-utama": {
    ...DEFAULT_HARDWARE_SETTINGS,
    esp32Ip: "192.168.1.150:81",
    esp32WsUrl: "ws://192.168.1.150:81",
    esp32Token: "UBOS-TAMBUN-KEY-8899",
    cctvSnapshotUrl: "http://192.168.1.180/cgi-bin/snapshot.cgi",
    bluetoothPrinterName: "RPP02N-TAMBUN",
  },
  "branch-cibitung-1": {
    ...DEFAULT_HARDWARE_SETTINGS,
    esp32Ip: "192.168.2.150:81",
    esp32WsUrl: "ws://192.168.2.150:81",
    esp32Token: "UBOS-CIBITUNG1-KEY-8899",
    cctvSnapshotUrl: "http://192.168.2.180/cgi-bin/snapshot.cgi",
    bluetoothPrinterName: "RPP02N-CIBITUNG1",
  },
  "branch-cibitung-2": {
    ...DEFAULT_HARDWARE_SETTINGS,
    esp32Ip: "192.168.3.150:81",
    esp32WsUrl: "ws://192.168.3.150:81",
    esp32Token: "UBOS-CIBITUNG2-KEY-8899",
    cctvSnapshotUrl: "http://192.168.3.180/cgi-bin/snapshot.cgi",
    bluetoothPrinterName: "RPP02N-CIBITUNG2",
  },
  "branch-cibitung-3": {
    ...DEFAULT_HARDWARE_SETTINGS,
    esp32Ip: "192.168.4.150:81",
    esp32WsUrl: "ws://192.168.4.150:81",
    esp32Token: "UBOS-CIBITUNG3-KEY-8899",
    cctvSnapshotUrl: "http://192.168.4.180/cgi-bin/snapshot.cgi",
    bluetoothPrinterName: "RPP02N-CIBITUNG3",
  },
}

export async function getHardwareSettings(branchId?: string | null): Promise<HardwareSettings> {
  const targetId = branchId && branchId !== "ALL" ? branchId : "branch-utama"
  if (!branchHardwareMap[targetId]) {
    branchHardwareMap[targetId] = { ...DEFAULT_HARDWARE_SETTINGS }
  }
  return branchHardwareMap[targetId]
}

export async function updateHardwareSettings(
  data: Partial<HardwareSettings>,
  branchId?: string | null
): Promise<HardwareSettings> {
  const targetId = branchId && branchId !== "ALL" ? branchId : "branch-utama"
  if (!branchHardwareMap[targetId]) {
    branchHardwareMap[targetId] = { ...DEFAULT_HARDWARE_SETTINGS }
  }
  branchHardwareMap[targetId] = {
    ...branchHardwareMap[targetId],
    ...data,
  }
  return branchHardwareMap[targetId]
}
