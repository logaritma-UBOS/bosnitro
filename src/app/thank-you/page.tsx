import Link from "next/link";
import { auth } from "@/auth";
import { syncUserMayarPayment } from "@/lib/mayarSync";

export const dynamic = "force-dynamic";

export default async function ThankYouPage() {
  let tierInfo: any = null;

  try {
    const session = await auth();
    if (session?.user?.email) {
      // Sinkronisasi seketika dari API Mayar agar status user langsung aktif tanpa jeda
      const result = await syncUserMayarPayment(session.user.email, session.user.id);
      if (result?.tierStatus) {
        tierInfo = result.tierStatus;
      }
    }
  } catch (e) {
    console.error("[THANK YOU PAGE SYNC ERROR]:", e);
  }

  const isLifetime = tierInfo?.tier === "Lifetime";
  const planTitle = isLifetime ? "Lifetime Founder Pass Aktif" : tierInfo?.tier ? `Paket ${tierInfo.tier} Aktif` : "Paket Pro Aktif";

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full animate-in zoom-in-95 duration-300">
        <div className="text-6xl mb-4">{isLifetime ? "👑" : "🎉"}</div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Pembayaran Berhasil!</h1>
        <div className="inline-block bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 mb-4">
          ✓ {planTitle}
        </div>
        <p className="text-slate-600 mb-8 text-sm leading-relaxed">
          {isLifetime 
            ? "Terima kasih banyak atas dukungan Anda. Akses Lifetime seumur hidup telah aktif dan seluruh fitur premium kini terbuka tanpa batas."
            : "Terima kasih banyak atas pembayaran Anda. Fitur premium UBOS telah aktif dan siap digunakan untuk memajukan bisnis Anda."}
        </p>
        <Link href="/" className="block w-full bg-emerald-600 text-white font-black py-4 px-6 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all">
          Masuk ke Dasbor Bisnis
        </Link>
      </div>
    </div>
  );
}
