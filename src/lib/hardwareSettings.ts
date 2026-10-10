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
  printerStoreHeader: "BOSNITRO NITROGEN & SERVICE CENTER",
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

// Global Owner Target & Reward Configuration (Controlled strictly by Owner)
let globalOwnerTargets: Partial<HardwareSettings> = {
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
    esp32Token: "BOSNITRO-UTAMA-KEY-8899",
    cctvSnapshotUrl: "http://192.168.1.180/cgi-bin/snapshot.cgi",
    bluetoothPrinterName: "RPP02N-UTAMA",
  },
}

export async function getHardwareSettings(branchId?: string | null): Promise<HardwareSettings> {
  const targetId = branchId && branchId !== "ALL" ? branchId : "branch-utama"
  if (!branchHardwareMap[targetId]) {
    branchHardwareMap[targetId] = { ...DEFAULT_HARDWARE_SETTINGS }
  }
  // Always overlay synchronized global Owner targets on top of branch-specific hardware
  return {
    ...branchHardwareMap[targetId],
    ...globalOwnerTargets,
  }
}

export async function updateHardwareSettings(
  data: Partial<HardwareSettings>,
  branchId?: string | null
): Promise<HardwareSettings> {
  // If target-related fields are passed, synchronize them globally for ALL branches
  const targetFields = ["monthlyTarget", "dailyTarget", "targetDailyOmzet", "rewardBonusPool", "rewardCriteria", "rewardType", "rewardAmount", "rewardNotes"]
  const hasTargetUpdates = targetFields.some(f => (data as any)[f] !== undefined)

  if (hasTargetUpdates) {
    globalOwnerTargets = {
      ...globalOwnerTargets,
      ...(data.monthlyTarget !== undefined ? { monthlyTarget: data.monthlyTarget } : {}),
      ...(data.dailyTarget !== undefined ? { dailyTarget: data.dailyTarget } : {}),
      ...(data.targetDailyOmzet !== undefined ? { targetDailyOmzet: data.targetDailyOmzet } : {}),
      ...(data.rewardBonusPool !== undefined ? { rewardBonusPool: data.rewardBonusPool } : {}),
      ...(data.rewardCriteria !== undefined ? { rewardCriteria: data.rewardCriteria } : {}),
      ...(data.rewardType !== undefined ? { rewardType: data.rewardType } : {}),
      ...(data.rewardAmount !== undefined ? { rewardAmount: data.rewardAmount } : {}),
      ...(data.rewardNotes !== undefined ? { rewardNotes: data.rewardNotes } : {}),
    }

    // Propagate to all existing branches in map
    for (const bId of Object.keys(branchHardwareMap)) {
      branchHardwareMap[bId] = {
        ...branchHardwareMap[bId],
        ...globalOwnerTargets,
      }
    }
  }

  const targetId = branchId && branchId !== "ALL" ? branchId : "branch-utama"
  if (!branchHardwareMap[targetId]) {
    branchHardwareMap[targetId] = { ...DEFAULT_HARDWARE_SETTINGS, ...globalOwnerTargets }
  }
  branchHardwareMap[targetId] = {
    ...branchHardwareMap[targetId],
    ...data,
    ...globalOwnerTargets,
  }
  return branchHardwareMap[targetId]
}

