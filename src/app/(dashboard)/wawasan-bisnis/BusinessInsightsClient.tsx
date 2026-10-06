"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { fetchBusinessInsightsData } from "@/actions/businessInsights"
import { BusinessDiagnosis } from "@/lib/engines/businessDiagnosisEngine"
import { BusinessPattern, Confidence } from "@/lib/engines/patternDetectionEngine"
import { RecommendationAction } from "@/lib/engines/recommendationEngineV2"
import { Badge, BadgeVariant } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { IconWarning, IconIdea, IconInsights, IconChevronDown } from "@/components/ui/Icons"

type InsightResult = {
  diagnoses: BusinessDiagnosis[]
  patterns: BusinessPattern[]
  recommendations: RecommendationAction[]
  confidence: Confidence
  productMixCount: number
}

// Map severity to semantic badge variant
function severityVariant(severity: string): BadgeVariant {
  switch (severity) {
    case "HIGH": return "danger"
    case "MEDIUM": return "warning"
    case "WATCH": return "warning"
    default: return "info"
  }
}

// Map severity to human-readable label
function severityLabel(severity: string): string {
  switch (severity) {
    case "HIGH": return "Perlu Perhatian"
    case "MEDIUM": return "Perlu Ditinjau"
    case "WATCH": return "Pantau"
    default: return "Info"
  }
}

// Map risk level to semantic badge variant
function riskVariant(riskLevel: string): BadgeVariant {
  switch (riskLevel) {
    case "HIGH_RISK": return "danger"
    case "MEDIUM_RISK": return "warning"
    case "LOW_RISK": return "success"
    default: return "neutral"
  }
}

function riskLabel(riskLevel: string): string {
  switch (riskLevel) {
    case "HIGH_RISK": return "Risiko Tinggi"
    case "MEDIUM_RISK": return "Risiko Sedang"
    case "LOW_RISK": return "Risiko Rendah"
    default: return ""
  }
}

export default function BusinessInsightsClient() {
  const [result, setResult] = useState<InsightResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetchBusinessInsightsData()
        if (res.error) {
          setError(res.error)
          return
        }
        if (res.success && res.diagnoses) {
          setResult({
            diagnoses: res.diagnoses as BusinessDiagnosis[],
            patterns: res.patterns as BusinessPattern[],
            recommendations: res.recommendations as RecommendationAction[],
            confidence: res.confidence as Confidence,
            productMixCount: res.productMixCount as number
          })
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* --- DESKTOP HEADER --- */}
      <div className="hidden md:block bg-white border-b border-slate-200 px-4 lg:px-8 py-4 mb-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1">
              &larr; Kembali ke Beranda
            </Link>
            <div className="flex items-center gap-2">
              <IconInsights className="w-6 h-6 text-primary-700" />
              <h1 className="text-xl font-bold text-slate-900">Wawasan Bisnis</h1>
            </div>
            <p className="text-slate-500 text-xs mt-1">Diagnosis performa 30 hari terakhir</p>
          </div>
        </div>
      </div>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden bg-primary-700 text-white p-4 pb-6 shrink-0 rounded-b-3xl shadow-sm z-10 relative">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
            &larr; Beranda
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <IconInsights className="w-7 h-7 text-white/80" />
          <div>
            <h1 className="text-xl font-bold leading-tight">Wawasan Bisnis</h1>
            <p className="text-primary-100 text-xs mt-0.5">Diagnosis performa 30 hari terakhir</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 mt-4 md:mt-0 relative z-20">
        {/* ERROR STATE */}
        {error && (
          <div className="bg-danger-50 text-danger-700 p-4 rounded-xl text-sm border border-danger-100 font-medium flex items-start gap-2 mb-4">
            <IconWarning className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-700 rounded-full animate-spin mb-4" />
            <p className="text-slate-500 text-sm font-medium">Menganalisis pola transaksi...</p>
          </div>
        ) : !result ? (
          // EMPTY STATE
          <Card>
            <CardContent className="py-10 text-center">
              <IconInsights className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-900 font-bold mb-1">Gagal memuat data</p>
              <p className="text-slate-500 text-sm">Pastikan ada transaksi dalam 30 hari terakhir.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEVEL 1: STATUS BISNIS — Confidence Guard (FULL WIDTH) */}
            {result.confidence === "LOW" && (
              <div className="lg:col-span-12 bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
                <IconWarning className="w-6 h-6 text-warning-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-base font-bold text-warning-800">Data Belum Mencukupi</p>
                  <p className="text-sm text-warning-700 mt-0.5">Butuh lebih banyak transaksi untuk membaca pola bisnis secara akurat.</p>
                </div>
              </div>
            )}

            {/* KOLOM KIRI: DIAGNOSIS (2/3 width on desktop) */}
            <div className="lg:col-span-8 space-y-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Diagnosis Prioritas</h2>

              {result.diagnoses.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-sm text-slate-500">Tidak ada diagnosis signifikan pada periode ini.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {result.diagnoses.map((diag, idx) => {
                    const relatedRecs = result.recommendations.filter(r => r.relatedDiagnosisId === diag.diagnosisId)

                    return (
                      <Card key={idx} className="overflow-hidden border-slate-200 shadow-sm">
                        <CardContent className="p-5">
                          {/* Diagnosis Header */}
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <h3 className="text-base font-bold text-slate-900 leading-tight flex-1">{diag.title}</h3>
                            <Badge variant={severityVariant(diag.severity)}>
                              {severityLabel(diag.severity)}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-slate-600 leading-relaxed mb-4">{diag.description}</p>

                          {/* LEVEL 4: RECOMMENDATIONS */}
                          {relatedRecs.length > 0 && (
                            <div className="bg-info-50 border border-info-100 rounded-xl p-4 mt-2">
                              <div className="flex items-center gap-2 mb-3">
                                <IconIdea className="w-5 h-5 text-info-600 shrink-0" />
                                <p className="text-xs font-bold text-info-800 uppercase tracking-wider">Rekomendasi Tindakan</p>
                              </div>
                              <div className="space-y-3">
                                {relatedRecs.map((rec) => (
                                  <div key={rec.actionId} className="bg-white p-3 rounded-lg border border-info-100 shadow-sm">
                                    <div className="flex justify-between items-start gap-2 mb-1.5">
                                      <p className="text-sm font-bold text-slate-900 leading-tight flex-1">{rec.title}</p>
                                      {rec.riskLevel && (
                                        <Badge variant={riskVariant(rec.riskLevel)}>
                                          {riskLabel(rec.riskLevel)}
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed">{rec.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* KOLOM KANAN: BUKTI DATA & DETAIL (1/3 width on desktop) */}
            <div className="lg:col-span-4 space-y-4">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Metrik & Bukti Data</h2>
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
                {result.diagnoses.map((diag, idx) => (
                  diag.evidence && diag.evidence.length > 0 && (
                    <div key={idx} className="pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                      <p className="text-xs font-bold text-slate-800 mb-2">{diag.title}</p>
                      <div className="space-y-2">
                        {diag.evidence.map((ev, eIdx) => (
                          <div key={eIdx} className="flex justify-between items-center text-sm">
                            <span className="text-slate-600">{ev.metric}</span>
                            <Badge variant={ev.changePercentage > 0 ? "success" : ev.changePercentage < 0 ? "danger" : "neutral"}>
                              {ev.changePercentage > 0 ? "↑" : ev.changePercentage < 0 ? "↓" : "–"}{Math.abs(Math.round(ev.changePercentage))}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
                
                {result.diagnoses.every(d => !d.evidence || d.evidence.length === 0) && (
                  <p className="text-sm text-slate-500 italic">Tidak ada perubahan metrik drastis.</p>
                )}
              </div>

              {/* LEVEL 5: TECHNICAL DETAIL */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 mt-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pola Mentah Terdeteksi</h3>
                {result.patterns.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada sinyal yang terdeteksi.</p>
                ) : (
                  <ul className="space-y-2">
                    {result.patterns.map((p, pIdx) => (
                      <li key={pIdx} className="text-xs text-slate-700 flex flex-col gap-1 pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                        <span className="font-semibold">{p.patternId.replace(/_/g, " ")}</span>
                        <span className="text-slate-400">{p.severity}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
