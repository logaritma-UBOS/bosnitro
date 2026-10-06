import { BusinessDiagnosis, DiagnosisId } from "./businessDiagnosisEngine"
import { Confidence, PatternCategory } from "./patternDetectionEngine"

export type ActionPriority = "SUGGESTION" | "MAINTENANCE" | "CRITICAL"

export type ActionRiskLevel = "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK"

export type RecommendationAction = {
  actionId: string
  title: string
  description: string
  impactArea: PatternCategory
  priority: ActionPriority
  riskLevel: ActionRiskLevel
  relatedDiagnosisId: DiagnosisId
}

export function generateRecommendations(diagnoses: BusinessDiagnosis[], confidence: Confidence): RecommendationAction[] {
  // GUARD: If confidence is LOW, we do not produce actionable recommendations 
  // because the data is too unstable and we don't want to mislead the business.
  if (confidence === "LOW") {
    return []
  }

  const actions: RecommendationAction[] = []
  const seenActionIds = new Set<string>()

  const addAction = (action: RecommendationAction) => {
    if (!seenActionIds.has(action.actionId)) {
      actions.push(action)
      seenActionIds.add(action.actionId)
    }
  }

  for (const diag of diagnoses) {
    switch (diag.diagnosisId) {
      case "REVENUE_MARGIN_DIVERGENCE":
        addAction({
          actionId: "REC_DIVERGENCE_HPP",
          title: "Evaluasi HPP dan Diskon",
          description: "Evaluasi HPP produk dengan kontribusi omzet terbesar dan tinjau struktur diskon yang sedang berjalan.",
          impactArea: "PROFITABILITY",
          priority: "SUGGESTION",
          riskLevel: "HIGH_RISK",
          relatedDiagnosisId: diag.diagnosisId
        })
        break
      
      case "PROFITABILITY_CRISIS":
        addAction({
          actionId: "REC_PROFIT_CRISIS",
          title: "Audit Beban Produksi",
          description: "Periksa kembali margin seluruh produk unggulan. Hentikan sementara diskon besar untuk memulihkan margin kotor.",
          impactArea: "PROFITABILITY",
          priority: "SUGGESTION", // CRITICAL is blocked for MVP
          riskLevel: "HIGH_RISK",
          relatedDiagnosisId: diag.diagnosisId
        })
        break

      case "DEMAND_VOLUME_WEAKENING":
        addAction({
          actionId: "REC_VOLUME_WEAKENING",
          title: "Pertahankan Pelanggan Aktif",
          description: "Fokus pada retensi pelanggan. Tawarkan promosi loyalitas kepada pelanggan setia untuk mengembalikan volume transaksi.",
          impactArea: "TRANSACTION",
          priority: "MAINTENANCE",
          riskLevel: "MEDIUM_RISK",
          relatedDiagnosisId: diag.diagnosisId
        })
        break

      case "VOLUME_UP_VALUE_DOWN":
        addAction({
          actionId: "REC_CROSS_SELL",
          title: "Tingkatkan Nilai Keranjang (Bundling)",
          description: "Evaluasi peluang bundling atau cross-sell untuk meningkatkan nilai rata-rata per transaksi.",
          impactArea: "AOV",
          priority: "SUGGESTION",
          riskLevel: "MEDIUM_RISK",
          relatedDiagnosisId: diag.diagnosisId
        })
        break

      case "VOLUME_DOWN_VALUE_UP":
        addAction({
          actionId: "REC_PREMIUM_FOCUS",
          title: "Maksimalkan Produk Premium",
          description: "Tren menunjukkan pelanggan bersedia membayar lebih. Perkuat display dan persediaan untuk produk margin/omzet tinggi.",
          impactArea: "AOV",
          priority: "MAINTENANCE",
          riskLevel: "LOW_RISK",
          relatedDiagnosisId: diag.diagnosisId
        })
        break

      case "HIGH_REVENUE_LOW_MARGIN_MIX":
        addAction({
          actionId: "REC_REPRICE_HIGH_REV",
          title: "Penyesuaian Harga Produk Laris",
          description: "Produk laris Anda memiliki margin terlalu tipis. Pertimbangkan sedikit penyesuaian harga jual agar profit seimbang.",
          impactArea: "PRODUCT_MIX",
          priority: "SUGGESTION",
          riskLevel: "HIGH_RISK",
          relatedDiagnosisId: diag.diagnosisId
        })
        break

      case "PEAK_HOUR_LOW_MARGIN_MIX":
        // GUARD: Only produce if evidence is actually solid. 
        if (diag.evidence && diag.evidence.length > 0) {
          addAction({
            actionId: "REC_PEAK_PLACEMENT",
            title: "Optimasi Display Jam Ramai",
            description: "Evaluasi penempatan produk dengan margin lebih tinggi pada jam penjualan yang teridentifikasi.",
            impactArea: "TIME",
            priority: "SUGGESTION",
            riskLevel: "MEDIUM_RISK",
            relatedDiagnosisId: diag.diagnosisId
          })
        }
        break
      
      case "POSITIVE_REVENUE_PATTERN":
      case "AOV_VALUE_CHANGE":
        // Usually good news, no immediate corrective action needed other than maintenance
        break
    }
  }

  return actions
}
