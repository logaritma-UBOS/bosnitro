"use client"
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { formatRupiah } from '@/lib/format'
import { deleteIngredient, deleteProduct } from './actions'

import SupabaseImportModal from './SupabaseImportModal'

export default function KatalogListClient({
  ingredients,
  products,
  productStocks,
  showIngredientsSection,
  ingredientsTitle,
  suppliers
}: {
  ingredients: any[],
  products: any[],
  productStocks: Record<string, number>,
  showIngredientsSection: boolean,
  ingredientsTitle: string,
  suppliers: any[]
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return ingredients;
    return ingredients.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ingredients, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    return products.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  return (
    <div className="space-y-6">
      {showImportModal && <SupabaseImportModal onClose={() => setShowImportModal(false)} />}
      {/* Cari & Filter */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari produk atau bahan..."
          className="w-full lg:w-96 pl-11 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 left-[21.5rem] pr-3.5 hidden lg:flex items-center text-slate-400 hover:text-slate-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {filteredProducts.length === 0 && filteredMaterials.length === 0 && searchQuery && (
        <div className="text-center py-12 text-slate-400 text-sm">
          Tidak ada produk atau bahan yang cocok dengan "{searchQuery}".
        </div>
      )}

      {/* Grid 2-Kolom Desktop */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Kolom Kiri: Bahan/Material (1/3 Lebar Desktop) */}
        {(showIngredientsSection && (filteredMaterials.length > 0 || !searchQuery)) && (
          <div className="lg:w-1/3 space-y-4">
            <div className="flex justify-between items-start mb-1 gap-2">
              <h2 className="text-sm md:text-base font-bold text-gray-800 tracking-wide mt-1 shrink-0">{ingredientsTitle}</h2>
              <div className="flex gap-2 flex-wrap justify-end">
                <Link href="/katalog/bahan/tambah" className="text-primary-700 text-sm font-bold bg-primary-50 px-3 py-1 rounded-lg hover:bg-primary-100 transition-colors">+ Tambah</Link>
              </div>
            </div>

            {filteredMaterials.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                {filteredMaterials.map(ing => {
                  const stockDisplay = ing.trackInventory 
                    ? `${ing.currentStock} ${ing.unit} tersedia` 
                    : `Tidak dilacak`
                  
                  return (
                    <Card key={ing.id} className="h-full border border-gray-100 hover:border-gray-300 transition-colors shadow-sm">
                      <div className="p-3 md:p-4 flex flex-col justify-between h-full">
                        <Link href={`/katalog/bahan/${ing.id}/edit`} className="block min-w-0 mb-2">
                          <p className="font-bold text-gray-900 text-sm md:text-base truncate">{ing.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {stockDisplay} &middot; {formatRupiah(ing.costPerUnit)}/{ing.unit}
                          </p>
                        </Link>
                        <div className="flex justify-between items-center mt-auto pt-2">
                          <Badge variant={ing.trackInventory && ing.currentStock <= 0 ? "danger" : ing.trackInventory && ing.currentStock <= ing.minStock ? "warning" : "success"}>
                            {ing.trackInventory && ing.currentStock <= 0 ? "HABIS" : ing.trackInventory && ing.currentStock <= ing.minStock ? "MENIPIS" : "TERSEDIA"}
                          </Badge>
                          <div className="flex gap-3">
                            <Link href={`/katalog/bahan/${ing.id}/edit`} className="text-primary-600 text-xs font-bold hover:underline">Edit</Link>
                            <button onClick={() => deleteIngredient(ing.id)} className="text-danger-600 text-xs font-bold hover:underline">Hapus</button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic p-3 bg-white rounded-xl border border-dashed border-gray-200">Belum ada {ingredientsTitle.toLowerCase()}.</p>
            )}
          </div>
        )}

        {/* Kolom Kanan: Produk Jualan (2/3 Lebar Desktop) */}
        <div className={showIngredientsSection ? "lg:w-2/3 space-y-4" : "w-full space-y-4"}>
            <div className="flex justify-between items-start mb-1 gap-2">
              <h2 className="text-sm md:text-base font-bold text-gray-800 tracking-wide mt-1 shrink-0">Produk Jualan</h2>
              <div className="flex gap-2 flex-wrap justify-end">
                <button onClick={() => setShowImportModal(true)} className="text-emerald-700 text-sm font-bold bg-emerald-50 px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  <span className="hidden sm:inline">Import</span>
                </button>
                <Link href="/katalog/produk/tambah" className="text-primary-700 text-sm font-bold bg-primary-50 px-3 py-1 rounded-lg hover:bg-primary-100 transition-colors">
                    + Tambah
                  </Link>
              </div>
            </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredProducts.map(prod => {
                const isRetail = !prod.hasBOM && prod.trackInventory;
                const isService = !prod.hasBOM && !prod.trackInventory;
                const isBom = prod.hasBOM;
                return (
                  <Card key={prod.id} className="h-full border border-gray-100 hover:border-gray-300 transition-colors shadow-sm">
                    <div className="p-3 md:p-4 flex flex-col justify-between h-full">
                      <Link href={`/katalog/produk/${prod.id}`} className="flex gap-3 items-start mb-3 group">
                        {prod.imageUrl ? (
                          <div className="relative w-12 h-12 md:w-16 md:h-16 shrink-0">
                            <Image src={prod.imageUrl} alt={prod.name} fill className="object-cover rounded-lg border border-gray-100 group-hover:opacity-90 transition-opacity" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-200 text-gray-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 text-sm md:text-base truncate group-hover:text-primary-700 transition-colors">{prod.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                            Jual {formatRupiah(prod.sellPrice)}
                            {isRetail && ` • Modal ${formatRupiah(prod.calculatedHpp)} • Stok: ${productStocks[prod.id]}`}
                            {isService && ` • Jasa Murni`}
                            {isBom && ` • HPP ${formatRupiah(prod.calculatedHpp)}`}
                          </p>
                        </div>
                      </Link>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-50">
                        <Badge variant="warning">
                          MARGIN {prod.sellPrice > 0 ? Math.round(((prod.sellPrice - prod.calculatedHpp) / prod.sellPrice) * 100) : 0}%
                        </Badge>
                        <div className="flex gap-3">
                          <Link href={isBom ? `/katalog/produk/${prod.id}` : `/katalog/produk/${prod.id}/edit`} className="text-primary-600 text-xs font-bold hover:underline">
                            Edit
                          </Link>
                          <button onClick={() => deleteProduct(prod.id)} className="text-danger-600 text-xs font-bold hover:underline">Hapus</button>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              <p className="text-sm text-gray-500 font-medium">Belum ada produk jualan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
