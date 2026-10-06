import { formatNumber, formatRupiah } from "@/lib/format";
export const dynamic = "force-dynamic";
import { getCustomerIntelligence } from "@/actions/customer";
import { redirect } from "next/navigation";
import Link from "next/link";
import AddCustomerButton from "./AddCustomerButton";

export default async function PelangganPage() {
  const { intelligence, error } = await getCustomerIntelligence();

  if (error || !intelligence) {
    return <div className="p-4">Gagal memuat data pelanggan.</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "BARU":
        return "bg-blue-100 text-blue-700";
      case "AKTIF":
        return "bg-green-100 text-green-700";
      case "LOYAL":
        return "bg-purple-100 text-purple-700";
      case "MULAI_TIDAK_AKTIF":
        return "bg-orange-100 text-orange-700";
      case "BERISIKO":
        return "bg-orange-100 text-orange-700";
      case "TIDAK_AKTIF":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-primary-600 mb-1 inline-block"
          >
            ← Kembali ke Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Customer Intelligence
          </h1>
          <p className="text-gray-500">
            Analisis perilaku pelanggan berdasarkan histori transaksi.
          </p>
        </div>
        <AddCustomerButton />
      </div>

      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium border-b border-gray-100">
            <tr>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Segment</th>
              <th className="p-4">Status Transaksi</th>
              <th className="p-4">Total Trx</th>
              <th className="p-4">Total Nilai</th>
              <th className="p-4">Terakhir Beli</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {intelligence.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-400">
                  Belum ada pelanggan.
                </td>
              </tr>
            ) : (
              intelligence.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.phone || "-"}</p>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(c.marketingSegment)}`}
                    >
                      {c.marketingSegment.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {c.derivedStatus.replace(/_/g, " ")}
                  </td>
                  <td className="p-4 font-medium">{c.totalTransactions}</td>
                  <td className="p-4">
                    {formatRupiah(c.totalSpent)}
                    <div className="text-xs text-gray-400">
                      Rata2: {formatRupiah(Math.round(c.averageSpent))}
                    </div>
                  </td>
                  <td className="p-4">
                    {c.daysSinceLastTransaction !== null ? (
                      <>{c.daysSinceLastTransaction} hari lalu</>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="md:hidden flex flex-col gap-4 pb-20">
        {intelligence.length === 0 ? (
          <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
            Belum ada pelanggan.
          </div>
        ) : (
          intelligence.map((c) => (
            <div
              key={c.id}
              className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900 text-lg">{c.name}</p>
                  <p className="text-xs text-gray-500">
                    {c.phone || "Tanpa Nomor HP"}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(c.marketingSegment)}`}
                >
                  {c.marketingSegment.replace(/_/g, " ")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs">
                <div>
                  <p className="text-gray-400 mb-0.5 font-medium">Status</p>
                  <p className="font-bold text-gray-700">
                    {c.derivedStatus.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5 font-medium">Terakhir</p>
                  <p className="font-bold text-gray-700">
                    {c.daysSinceLastTransaction !== null
                      ? `${c.daysSinceLastTransaction} hari lalu`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5 font-medium">Total Trx</p>
                  <p className="font-bold text-gray-900">
                    {c.totalTransactions}x
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 mb-0.5 font-medium">
                    Total Belanja
                  </p>
                  <p className="font-bold text-emerald-700">
                    {formatRupiah(c.totalSpent)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
