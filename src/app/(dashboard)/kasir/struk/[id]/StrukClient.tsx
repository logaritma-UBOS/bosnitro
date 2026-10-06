"use client"
import { formatNumber, formatRupiah } from '@/lib/format';

import Link from "next/link"

type StrukClientProps = {
  sale: any
  business: any
}

export default function StrukClient({ sale, business }: StrukClientProps) {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center justify-start print-wrapper">
      
      {/* Container Kertas Struk */}
      <div className="receipt-container w-full max-w-xs sm:max-w-sm bg-white shadow-xl p-4 mx-auto rounded-lg">
        
        {/* Header Struk */}
        <div className="text-center mb-4">
          <h1 className="font-bold text-lg uppercase">{business.name}</h1>
          {business.settings?.storeAddress && (
            <p className="text-xs text-gray-700 whitespace-pre-wrap">{business.settings.storeAddress}</p>
          )}
          {business.settings?.storePhone && (
            <p className="text-xs text-gray-700">{business.settings.storePhone}</p>
          )}
        </div>

        <div className="border-b border-dashed border-gray-400 mb-3 print:border-black"></div>

        {/* Info Transaksi */}
        <div className="mb-3 text-xs text-gray-800">
          <div className="flex justify-between">
            <span>No:</span>
            <span className="font-mono">{sale.receiptNumber || sale.clientTransactionId.substring(0, 14)}</span>
          </div>
          <div className="flex justify-between">
            <span>Waktu:</span>
            <span>{new Date(sale.createdAt).toLocaleString("id-ID")}</span>
          </div>
          <div className="flex justify-between">
            <span>Metode:</span>
            <span>{sale.paymentMethod}</span>
          </div>
        </div>

        <div className="border-b border-dashed border-gray-400 mb-3 print:border-black"></div>

        {/* Item List */}
        <div className="mb-3">
          {sale.saleItems.map((item: any) => (
            <div key={item.id} className="mb-2 text-xs text-gray-800 flex flex-col">
              <span className="font-medium truncate">{item.product.name}</span>
              <div className="flex justify-between mt-0.5">
                <span>{item.quantity} x {formatNumber(item.priceAtSale)}</span>
                <span className="font-bold">{formatNumber((item.quantity * item.priceAtSale))}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-b border-dashed border-gray-400 mb-3 print:border-black"></div>

        {/* Total & Payment */}
        <div className="mb-4 text-xs text-gray-900">
          {sale.discount > 0 && (
            <>
              <div className="flex justify-between text-gray-600 mb-1">
                <span>Subtotal</span>
                <span>{formatRupiah((sale.totalAmount + sale.discount))}</span>
              </div>
              <div className="flex justify-between text-green-700 mb-1">
                <span>Diskon Promo</span>
                <span>- {formatRupiah(sale.discount)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between font-bold mb-1">
            <span>TOTAL</span>
            <span>{formatRupiah(sale.totalAmount)}</span>
          </div>

          {sale.paymentMethod === "CASH" && (
            <>
              <div className="flex justify-between text-gray-700">
                <span>Tunai</span>
                <span>{formatRupiah((sale.cashReceived || sale.totalAmount))}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Kembali</span>
                <span>{formatRupiah((sale.changeAmount || 0))}</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 mt-6 print:mt-4">
          <p>{business.settings?.receiptFooter || "Terima kasih atas kunjungannya!"}</p>
        </div>
        
        <div className="h-4"></div> {/* Spacing untuk printer */}
      </div>

      {/* Action Buttons (Not Printed) */}
      <div className="w-full max-w-xs sm:max-w-sm mt-6 flex flex-col gap-3 print:hidden mx-auto">
        <button 
          onClick={handlePrint}
          className="w-full py-3 bg-primary-700 text-white font-bold rounded-xl shadow-lg hover:bg-primary-800 transition-colors"
        >
          Cetak Struk
        </button>
        <a 
          href={`https://wa.me/?text=${encodeURIComponent(`Halo! Terima kasih telah berbelanja di ${business?.name || "Toko"}.\n\nTotal Tagihan: ${formatRupiah(sale.totalAmount)}\nMetode Pembayaran: ${sale.paymentMethod}\n\nLihat e-struk Anda di sini:\n${typeof window !== 'undefined' ? window.location.href : ''}`)}`} 
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 bg-[#25D366] text-white font-bold rounded-xl shadow-lg hover:bg-[#1ebd5a] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Kirim via WhatsApp
        </a>
        <Link 
          href="/kasir"
          className="w-full py-3 bg-white text-gray-800 border border-gray-200 font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors text-center block"
        >
          Transaksi Baru
        </Link>
      </div>

      {/* CSS Layout Fix for Thermal Printers */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            margin: 0;
            size: 58mm auto;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            width: 100% !important;
          }
          .print-wrapper {
            min-height: 0 !important;
            height: auto !important;
            background-color: white !important;
            padding: 0 !important;
            display: block !important;
          }
          .receipt-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 4mm !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-family: monospace !important;
            color: black !important;
          }
          /* Hide global floating buttons like WhatsApp during print */
          .fixed, [class*="fixed"], iframe {
            display: none !important;
          }
        }
      `}} />
    </div>
  )
}
