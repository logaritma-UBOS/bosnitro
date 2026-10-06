"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Play, Target } from "lucide-react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#fafbfc] pt-12 pb-20 px-4 sm:px-6 lg:px-8 min-h-[90vh] flex flex-col justify-between">
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full text-center relative z-10 my-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold tracking-wide uppercase mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Khusus untuk Anda yang sedang mengejar target
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto"
        >
          Punya Target Besar, Tapi Bingung{" "}
          <span className="text-blue-600 inline-block relative">
            Langkah Nyata
          </span>{" "}
          Untuk Mencapainya?
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
        >
          Berhentilah menebak-nebak. Pendekatan{" "}
          <strong className="text-slate-900 underline decoration-blue-500 decoration-2 underline-offset-4">
            Backward Mapping
          </strong>{" "}
          Logaritma akan membedah target akhir Anda menjadi langkah-langkah harian yang pasti dan terukur.
        </motion.p>

        {/* CTA Group */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20"
        >
          <Link
            href="/onboarding"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Mulai Pemetaan Target</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-7 py-4 rounded-full bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 text-slate-700 font-bold text-sm sm:text-base shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center">
              <Play className="w-3 h-3 fill-current ml-0.5" />
            </div>
            <span>Lihat Cara Kerja Logaritma</span>
          </Link>
        </motion.div>
      </div>

      {/* --- VISUAL ANCHOR: KIRI (CHECKLIST) & KANAN (TARGET CHART) --- */}
      <div className="max-w-5xl mx-auto w-full relative h-40 hidden md:block mt-6">
        {/* 1. Left Floating Card: Daily Checklist */}
        <motion.div
          initial={{ opacity: 0, x: -30, rotate: -12 }}
          animate={{ opacity: 1, x: 0, rotate: -6 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="absolute -top-12 left-0 w-48 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 ring-1 ring-black/5"
        >
          {/* Clipboard Clip */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-amber-400 rounded-t-md shadow-xs border border-amber-500 flex items-center justify-center">
            <div className="w-4 h-1 bg-amber-600 rounded-full" />
          </div>
          
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <div className="h-2 bg-slate-200 rounded-full flex-1" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* 2. Dotted Curved Path */}
        <svg className="absolute top-4 left-44 w-72 h-24 overflow-visible pointer-events-none" fill="none">
          <motion.path
            d="M 10,20 Q 90,80 180,20"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeDasharray="6 6"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
          />
          <polygon points="180,16 190,20 180,24" fill="#3b82f6" />
        </svg>

        {/* 3. Right Floating Elements: Target & Growth Bars */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="absolute -top-20 right-4 flex items-end gap-3"
        >
          {/* Target Icon */}
          <div className="relative -top-12 -left-2 animate-bounce">
            <div className="w-14 h-14 rounded-full bg-blue-600 border-4 border-white shadow-lg flex items-center justify-center text-white">
              <Target className="w-7 h-7" />
            </div>
          </div>

          {/* 3D Growth Bars */}
          <div className="flex items-end gap-2 bg-white/70 backdrop-blur-xs p-3 rounded-2xl border border-slate-100 shadow-xl">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 35 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="w-5 bg-blue-300 rounded-t-lg"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 55 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="w-5 bg-blue-400 rounded-t-lg"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 75 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="w-5 bg-blue-500 rounded-t-lg"
            />
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 100 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="w-6 bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg shadow-md"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
