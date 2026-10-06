"use client"
import { useState, useMemo } from "react"
import { formatRupiah } from "@/lib/format"

export default function PublicStoreClient({ business, settings, products, categories, promos = [] }: { business: any, settings: any, products: any[], categories: any[], promos?: any[] }) {
  const [cart, setCart] = useState<Record<string, { product: any, qty: number }>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeCategory, setActiveCategory] = useState("all")
  
  const bType = business.businessType || "RETAIL"

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev[product.id]
      return {
        ...prev,
        [product.id]: { product, qty: (existing?.qty || 0) + 1 }
      }
    })
  }

  const minCart = (id: string) => {
    setCart(prev => {
      const existing = prev[id]
      if (!existing) return prev
      if (existing.qty <= 1) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return {
        ...prev,
        [id]: { ...existing, qty: existing.qty - 1 }
      }
    })
  }

  const getCartTotal = () => Object.values(cart).reduce((sum, item) => sum + (item.product.sellPrice * item.qty), 0)
  const getCartCount = () => Object.values(cart).reduce((sum, item) => sum + item.qty, 0)

  const openWhatsApp = (customText?: string) => {
    if (!settings.storePhone) {
       alert("Maaf, toko ini belum mengatur nomor WhatsApp penerima pesanan.")
       return
    }
    let phone = settings.storePhone.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '62' + phone.substring(1)
    
    const text = customText || `Halo *${business.name}*!\nSaya ingin bertanya mengenai produk/layanan Anda.`
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  const handleCheckoutWA = () => {
    if (!settings.storePhone) {
       alert("Maaf, toko ini belum mengatur nomor WhatsApp penerima pesanan.")
       return
    }
    
    let text = `Halo *${business.name}*!\n`
    if (bType === "PRINTING") {
      text += `Saya ingin order cetak/copy:\n\n`
    } else if (bType === "JASA") {
      text += `Saya ingin booking layanan berikut:\n\n`
    } else {
      text += `Saya ingin memesan:\n\n`
    }
    
    Object.values(cart).forEach((item, idx) => {
      text += `${idx + 1}. ${item.product.name} (x${item.qty}) - ${formatRupiah(item.product.sellPrice * item.qty)}\n`
    })
    
    text += `\n*Total Estimasi: ${formatRupiah(getCartTotal())}*\n\n`
    
    if (bType === "PRINTING") {
      text += `_Catatan: File dokumen akan saya kirimkan setelah pesan ini._\nMohon info ketersediaannya. Terima kasih!`
    } else if (bType === "JASA") {
      text += `Mohon konfirmasi jadwal ketersediaannya ya. Terima kasih!`
    } else {
      text += `Mohon info ketersediaan dan cara pembayarannya ya. Terima kasih!`
    }
    
    openWhatsApp(text)
  }

  // Group products
  const groupedProducts = useMemo(() => {
    const groups: { id: string, name: string, items: any[] }[] = []
    
    let filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    if (activeCategory !== "all") {
      if (activeCategory === "uncategorized") {
        filteredProducts = filteredProducts.filter(p => !p.categoryId)
      } else {
        filteredProducts = filteredProducts.filter(p => p.categoryId === activeCategory)
      }
    }
    
    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        const items = filteredProducts.filter(p => p.categoryId === cat.id)
        if (items.length > 0) groups.push({ id: cat.id, name: cat.name, items })
      })
    }
    
    const uncategorized = filteredProducts.filter(p => !p.categoryId)
    if (uncategorized.length > 0) {
      groups.push({ id: "uncategorized", name: groups.length > 0 ? "Lainnya" : "Katalog Produk", items: uncategorized })
    }
    return groups
  }, [products, categories, searchQuery, activeCategory])

  if (!settings.storeActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-2">{business.name}</h1>
          <p className="text-gray-500 font-medium">Mohon maaf, toko saat ini sedang tutup atau tidak menerima pesanan sementara.</p>
        </div>
      </div>
    )
  }

  // ==== COMPONENTS ====
  // GoFood Style Add Button
  const GofoodAddButton = ({ p }: { p: any }) => {
    const qty = cart[p.id]?.qty || 0
    if (qty > 0) {
      return (
        <div className="flex items-center justify-between w-24 bg-white border border-green-600 rounded-full overflow-hidden shadow-sm h-8 relative -mt-4 z-10 mx-auto">
          <button onClick={() => minCart(p.id)} className="w-8 h-full flex items-center justify-center text-green-700 font-bold active:bg-green-50">-</button>
          <span className="font-bold text-gray-900 text-sm">{qty}</span>
          <button onClick={() => addToCart(p)} className="w-8 h-full flex items-center justify-center text-green-700 font-bold active:bg-green-50">+</button>
        </div>
      )
    }
    return (
      <button onClick={() => addToCart(p)} className="bg-white border border-green-600 text-green-700 font-bold text-sm px-4 h-8 rounded-full shadow-sm active:scale-95 whitespace-nowrap relative -mt-4 z-10 mx-auto block w-24">
        Tambah
      </button>
    )
  }

  const RetailAddButton = ({ p }: { p: any }) => {
    const qty = cart[p.id]?.qty || 0
    if (qty > 0) {
      return (
        <div className="flex items-center justify-between bg-violet-50 rounded-lg p-1 w-full mt-3">
          <button onClick={() => minCart(p.id)} className="w-8 h-8 rounded bg-white text-violet-700 font-bold shadow-sm">-</button>
          <span className="font-bold text-gray-900">{qty}</span>
          <button onClick={() => addToCart(p)} className="w-8 h-8 rounded bg-violet-600 text-white font-bold shadow-sm">+</button>
        </div>
      )
    }
    return (
      <button onClick={() => addToCart(p)} className="w-full mt-3 bg-violet-100 hover:bg-violet-200 text-violet-700 font-bold text-sm py-2 rounded-lg transition-colors active:scale-95">
        + Keranjang
      </button>
    )
  }

  const PrintingAddButton = ({ p }: { p: any }) => {
    const qty = cart[p.id]?.qty || 0
    if (qty > 0) {
      return (
        <div className="flex items-center justify-between bg-blue-50 rounded-lg p-1 w-full sm:mt-0 mt-3">
          <button onClick={() => minCart(p.id)} className="w-8 h-8 rounded bg-white text-blue-700 font-bold shadow-sm">-</button>
          <span className="font-bold text-gray-900">{qty}</span>
          <button onClick={() => addToCart(p)} className="w-8 h-8 rounded bg-blue-600 text-white font-bold shadow-sm">+</button>
        </div>
      )
    }
    return (
      <button onClick={() => addToCart(p)} className="w-full sm:mt-0 mt-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold text-sm py-2 px-4 rounded-lg transition-colors active:scale-95">
        + Pilih
      </button>
    )
  }

  const JasaAddButton = ({ p }: { p: any }) => {
    const qty = cart[p.id]?.qty || 0
    if (qty > 0) {
      return (
        <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-1 w-full">
          <button onClick={() => minCart(p.id)} className="w-10 h-10 rounded-lg bg-white text-emerald-700 font-bold shadow-sm">-</button>
          <span className="font-bold text-gray-900">{qty} Sesi</span>
          <button onClick={() => addToCart(p)} className="w-10 h-10 rounded-lg bg-emerald-600 text-white font-bold shadow-sm">+</button>
        </div>
      )
    }
    return (
      <button onClick={() => addToCart(p)} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        Pesan Jadwal
      </button>
    )
  }

  // ---- LAYOUT: F&B (GoFood Clone) ----
  const RenderFnB = () => (
    <div className="bg-white min-h-screen pb-28">
      {/* Header Banner */}
      <div className="relative h-48 bg-gradient-to-r from-teal-500 to-emerald-400 overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-400 rounded-full opacity-50 blur-2xl"></div>
        <div className="absolute top-0 right-0 w-60 h-60 bg-yellow-300 rounded-full opacity-20 blur-3xl"></div>
        
        {/* Top actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button onClick={() => window.history.back()} className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </button>
          <div className="flex gap-2">
            <button onClick={() => setIsSearching(!isSearching)} className="w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-transform">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            </button>
            <button onClick={() => setIsFavorite(!isFavorite)} className={`w-10 h-10 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center active:scale-95 transition-colors ${isFavorite ? "text-red-500 bg-white/90" : "text-white"}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>
        
        {isSearching && (
          <div className="absolute top-16 left-4 right-4 z-20">
            <input 
              autoFocus
              type="text" 
              placeholder="Cari produk..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-full py-2.5 px-4 outline-none shadow-lg text-gray-800 text-sm"
            />
          </div>
        )}
      </div>

      {/* Info Card (Floating) */}
      <div className="px-4 relative -mt-12 z-10">
        <div className="bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-3 items-center">
              {business.user?.image && (
                <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100 shadow-sm shrink-0">
                  <img src={business.user.image} alt={business.name} className="w-full h-full object-cover" />
                </div>
              )}
              <h1 className="text-xl font-bold text-gray-900 leading-tight">{business.name}</h1>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" className="shrink-0 ml-2 mt-1"><path d="M9 18l6-6-6-6"/></svg>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-4">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#f97316" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span className="font-bold text-gray-900">4.9</span>
            <span>(1rb+)</span>
          </div>

          <div className="flex bg-gray-100 rounded-full p-1 mb-4">
            <button 
              onClick={() => openWhatsApp(`Halo *${business.name}*, saya mau tanya bagaimana prosedur pemesanan via *Pickup* (Ambil Sendiri)?`)}
              className="flex-1 bg-green-600 text-white text-sm font-bold text-center py-1.5 rounded-full shadow-sm active:scale-95 transition-transform"
            >
              Pickup
            </button>
            <button 
              onClick={() => openWhatsApp(`Halo *${business.name}*, saya mau tanya bagaimana prosedur pengiriman via *Delivery* (Kirim ke Alamat)?`)}
              className="flex-1 text-gray-500 text-sm font-bold text-center py-1.5 flex items-center justify-center gap-1 active:scale-95 transition-transform hover:text-gray-700"
            >
              Delivery <span className="w-3 h-3 border border-gray-400 rounded-full inline-flex items-center justify-center text-[8px] font-normal">i</span>
            </button>
          </div>

          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              20-30 min <span className="text-gray-400 font-normal">(3.71 km)</span>
            </div>
            <button 
              onClick={() => openWhatsApp(`Halo *${business.name}*, apakah saya bisa melakukan pemesanan terjadwal (Pre-order) untuk waktu tertentu?`)}
              className="flex items-center gap-1 text-gray-500 hover:text-green-600 active:scale-95 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Jadwalin <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Promos */}
      {promos && promos.length > 0 && (
        <div className="mt-6 px-4 flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
          {promos.map(promo => (
            <div key={promo.id} className="min-w-[200px] border border-gray-200 rounded-2xl p-3 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 font-bold text-lg">%</div>
              <div>
                <p className="font-bold text-sm text-gray-900">{promo.name}</p>
                {promo.minimumPurchase > 0 && (
                  <p className="text-xs text-gray-500">Min. pembelian {formatRupiah(promo.minimumPurchase)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="w-full h-2 bg-gray-100 mt-2"></div>

      {/* Products List */}
      <div className="px-4 py-6">
        {groupedProducts.length === 0 && searchQuery && (
          <div className="text-center py-10 text-gray-500">
            Produk tidak ditemukan.
          </div>
        )}
        
        {groupedProducts.map((group, gIdx) => (
          <div key={group.id} className="mb-8">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide mb-4">{group.name}</h2>
            
            <div className="flex flex-col">
              {group.items.map((p, pIdx) => (
                <div key={p.id} className="py-4 border-b border-gray-100 border-dashed last:border-0 flex gap-4">
                  <div className="flex-1">
                    {pIdx === 0 && gIdx === 0 && !searchQuery && (
                      <div className="flex items-center gap-1 text-red-600 text-xs font-bold mb-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4v13c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6h-4zM10 4h4v2h-4V4z"/></svg>
                        Sering dibeli lagi
                      </div>
                    )}
                    {(pIdx === 1 && gIdx === 0 && !searchQuery) && (
                      <div className="flex items-center gap-1 text-blue-600 text-xs font-bold mb-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"></path></svg>
                        Rekomendasi
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-base">{p.name.toUpperCase()}</h3>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1 mb-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#f97316" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                      <span className="font-bold text-gray-900">4.8</span>
                      <span>(1rb+)</span>
                    </div>
                    
                    <p className="text-sm font-bold text-gray-900 mt-3">{formatRupiah(p.sellPrice)}</p>
                  </div>
                  
                  <div className="w-28 flex-shrink-0 flex flex-col items-center">
                    <div className="w-28 h-28 bg-gray-100 rounded-2xl overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 18 0H3z"/><path d="M12 3v4"/><path d="M8 4v3"/><path d="M16 4v3"/></svg>
                        </div>
                      )}
                    </div>
                    <GofoodAddButton p={p} />
                    <span className="text-[10px] text-gray-400 mt-1 font-medium">Bisa custom</span>
                  </div>
                </div>
              ))}
            </div>
            {gIdx < groupedProducts.length - 1 && <div className="w-full border-b-[8px] border-gray-50 my-2 -mx-4 px-8"></div>}
          </div>
        ))}
      </div>
    </div>
  )

  // ---- LAYOUT: RETAIL ----
  const RenderRetail = () => (
    <div className="max-w-4xl mx-auto p-4 mt-2">
      {/* Promos */}
      {promos && promos.length > 0 && (
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {promos.map(promo => (
            <div key={promo.id} className="min-w-[240px] bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl p-4 text-white shrink-0 relative overflow-hidden shadow-sm">
              <div className="absolute -right-4 -top-4 opacity-20">
                <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></svg>
              </div>
              <h3 className="font-black text-lg leading-tight relative z-10">{promo.name}</h3>
              <p className="text-violet-100 text-xs mt-2 relative z-10">Gunakan kode: <span className="font-bold bg-white/20 px-2 py-1 rounded tracking-wide">{promo.code}</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Categories Filter */}
      {categories && categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 hide-scrollbar">
          <button 
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeCategory === "all" ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
          >
            Semua
          </button>
          {categories.map(c => (
             <button 
                key={c.id} 
                onClick={() => setActiveCategory(c.id)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeCategory === c.id ? 'bg-violet-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
             >
               {c.name}
             </button>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <input 
            autoFocus
            type="text" 
            placeholder="Cari produk..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-violet-500 shadow-sm text-sm"
          />
        </div>
      )}
      
      {groupedProducts.length === 0 && (
        <div className="text-center py-10 text-gray-500">Produk tidak ditemukan.</div>
      )}
      
      {groupedProducts.map(group => (
        <div key={group.id} className="mb-8">
          <h2 className="text-lg font-black text-gray-900 mb-4 px-1">{group.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
            {group.items.map((p, pIdx) => (
              <div key={p.id} className="bg-white rounded-2xl flex flex-col border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow h-full">
                <div className="w-full aspect-square bg-slate-50 flex items-center justify-center relative group">
                  {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <span className="text-3xl text-slate-300">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </span>}
                  {pIdx === 0 && <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">Terlaris</div>}
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 leading-snug">{p.name}</h3>
                    <p className="text-base font-black text-gray-900 mt-1">{formatRupiah(p.sellPrice)}</p>
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-gray-500 font-medium">
                      <span className="text-yellow-400">★</span> 4.9 <span className="px-1">|</span> Terjual 100+
                    </div>
                  </div>
                  <RetailAddButton p={p} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // ---- LAYOUT: PRINTING ----
  const RenderPrinting = () => (
    <div className="max-w-3xl mx-auto p-4 mt-2">
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-800 mb-6">
        <span className="text-xl shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2-2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </span>
        <div>
          <h4 className="font-bold text-sm">Layanan Cetak Profesional</h4>
          <p className="text-xs mt-1 opacity-80 leading-relaxed">Pilih layanan di bawah, selesaikan pesanan, lalu kirimkan file dokumen Anda (PDF/Word/JPG) melalui WhatsApp yang tertera.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-8">
        <div className="bg-white p-3 rounded-xl border border-blue-100 text-center shadow-sm">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-2 font-black text-sm">1</div>
          <p className="text-xs font-bold text-gray-700">Pilih Layanan</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-100 text-center shadow-sm">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-2 font-black text-sm">2</div>
          <p className="text-xs font-bold text-gray-700">Kirim File</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-blue-100 text-center shadow-sm">
          <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto mb-2 font-black text-sm">3</div>
          <p className="text-xs font-bold text-gray-700">Kami Proses</p>
        </div>
      </div>

      {isSearching && (
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <input 
            type="text" placeholder="Cari layanan cetak..." 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-1 focus:ring-blue-500 shadow-sm text-sm"
          />
        </div>
      )}
      
      {groupedProducts.map(group => (
        <div key={group.id} className="mb-6 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
           <div className="bg-blue-600 px-4 py-3">
             <h2 className="font-bold text-white text-sm uppercase tracking-wide">{group.name}</h2>
           </div>
           <div className="divide-y divide-gray-100">
             {group.items.map(p => (
                <div key={p.id} className="p-4 flex sm:items-center justify-between flex-col sm:flex-row gap-4 hover:bg-slate-50 transition-colors">
                   <div className="flex gap-4 items-center">
                     {p.imageUrl && <img src={p.imageUrl} className="w-16 h-16 rounded-lg object-cover border border-gray-100 shrink-0" />}
                     <div>
                       <h3 className="font-bold text-gray-900">{p.name}</h3>
                       <p className="text-sm font-black text-blue-600 mt-1">{formatRupiah(p.sellPrice)} <span className="text-xs font-normal text-gray-500">/ lbr / pcs</span></p>
                       <p className="text-[11px] text-gray-400 mt-1">Kualitas terjamin, hasil tajam.</p>
                     </div>
                   </div>
                   <div className="sm:w-32 w-full"><PrintingAddButton p={p} /></div>
                </div>
             ))}
           </div>
        </div>
      ))}
    </div>
  )

  // ---- LAYOUT: JASA ----
  const RenderJasa = () => (
    <div className="max-w-3xl mx-auto p-4 mt-2">
      {promos && promos.length > 0 && (
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {promos.map(promo => (
            <div key={promo.id} className="min-w-[240px] bg-emerald-600 rounded-2xl p-4 text-white shrink-0 relative overflow-hidden shadow-sm">
              <div className="absolute -right-2 -bottom-2 opacity-20">
                 <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></svg>
              </div>
              <h3 className="font-black text-lg leading-tight relative z-10">{promo.name}</h3>
              <p className="text-emerald-100 text-xs mt-2 relative z-10">Gunakan kode: <span className="font-bold bg-white/20 px-2 py-1 rounded tracking-wide">{promo.code}</span></p>
            </div>
          ))}
        </div>
      )}

      {isSearching && (
        <div className="mb-6 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </div>
          <input 
            type="text" placeholder="Cari layanan..." 
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-emerald-200 rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm text-sm"
          />
        </div>
      )}
      
      {groupedProducts.map(group => (
        <div key={group.id} className="mb-8">
          <h2 className="text-xl font-black text-gray-900 mb-4 px-1">{group.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {group.items.map(p => (
              <div key={p.id} className="bg-white p-1 rounded-2xl border border-emerald-100 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-all">
                <div className="flex gap-4 p-4">
                  <div className="w-20 h-20 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <span className="text-2xl text-emerald-300">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"></path></svg>
                    </span>}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{p.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-emerald-700 mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded font-medium">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Fleksibel / Sesi
                    </div>
                    <p className="text-sm font-black text-gray-900 mt-2">{formatRupiah(p.sellPrice)}</p>
                  </div>
                </div>
                <div className="px-4 pb-4 border-t border-gray-50 pt-3 mt-auto">
                  <JasaAddButton p={p} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  const userImg = business.user?.image
  
  // Custom header colors based on type
  const getHeaderBg = () => {
    if (bType === 'RETAIL') return 'bg-violet-600'
    if (bType === 'PRINTING') return 'bg-blue-600'
    if (bType === 'JASA') return 'bg-emerald-600'
    return 'bg-white'
  }

  return (
    <div className={`min-h-screen ${bType === 'F&B' ? 'bg-white' : 'bg-gray-50'} pb-28`}>
      {/* HEADER (Non F&B) */}
      {bType !== "F&B" && (
        <header className={`${getHeaderBg()} pt-8 pb-6 px-4 text-center sticky top-0 z-10 shadow-md`}>
          <div className="absolute top-4 left-4 right-4 flex justify-between">
             <button onClick={() => window.history.back()} className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-all">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
             </button>
             <div className="flex gap-2">
                <button onClick={() => setIsSearching(!isSearching)} className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-95 transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                </button>
                <button onClick={() => setIsFavorite(!isFavorite)} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${isFavorite ? "bg-white text-red-500" : "bg-white/20 text-white hover:bg-white/30"}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </button>
             </div>
          </div>
          <div className="w-20 h-20 mt-6 bg-white text-gray-800 font-black text-3xl rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg overflow-hidden border-4 border-white/20">
            {userImg ? (
              <img src={userImg} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              business.name.charAt(0).toUpperCase()
            )}
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">{business.name}</h1>
          {settings.storeDescription && (
            <p className="text-sm font-medium text-white/80 mt-2 max-w-md mx-auto">{settings.storeDescription}</p>
          )}
        </header>
      )}

      {/* CONTENT BASED ON TYPE */}
      {products.length === 0 ? (
        <div className="text-center py-20 px-4">
          <div className="w-20 h-20 mx-auto bg-gray-200 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Belum Ada Produk</h2>
          <p className="text-gray-500 text-sm mt-2">Toko ini belum menambahkan produk ke etalase online.</p>
        </div>
      ) : (
        <>
          {bType === "F&B" && <RenderFnB />}
          {bType === "RETAIL" && <RenderRetail />}
          {bType === "PRINTING" && <RenderPrinting />}
          {bType === "JASA" && <RenderJasa />}
        </>
      )}

      {/* FLOATING ACTION */}
      {getCartCount() > 0 ? (
        <div className={`fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-20`}>
          <div className={`${bType === 'F&B' ? 'bg-green-600 border-green-500' : bType === 'RETAIL' ? 'bg-violet-700 border-violet-600' : bType === 'PRINTING' ? 'bg-blue-700 border-blue-600' : 'bg-emerald-700 border-emerald-600'} text-white rounded-full p-3 px-5 shadow-2xl flex items-center justify-between border`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">
                {getCartCount()}
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] opacity-80 uppercase font-bold tracking-wider leading-none">Total Tagihan</span>
                <span className="font-bold text-lg leading-tight mt-0.5">{formatRupiah(getCartTotal())}</span>
              </div>
            </div>
            <button onClick={handleCheckoutWA} className={`flex items-center gap-2 active:scale-95 transition-transform font-bold bg-white px-4 py-2 rounded-full text-sm ${bType === 'F&B' ? 'text-green-700' : bType === 'RETAIL' ? 'text-violet-700' : bType === 'PRINTING' ? 'text-blue-700' : 'text-emerald-700'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              <span className="inline">Pesan WA</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 z-20">
          <button onClick={() => openWhatsApp()} className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(34,197,94,0.3)] active:scale-95 transition-transform">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </button>
        </div>
      )}
      
      {/* Hide scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  )
}
