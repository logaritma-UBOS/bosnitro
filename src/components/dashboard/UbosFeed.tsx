"use client";
import { useState, useEffect } from "react";

export default function UbosFeed({ position = "bottom" }: { position?: "top" | "bottom" }) {
  const [isVIP, setIsVIP] = useState(false);
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<any>(null);
  const [realDonors, setRealDonors] = useState<any[]>([]);
  const [currentDonor, setCurrentDonor] = useState(0);
  const [allDonors, setAllDonors] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/user/status")
      .then(r => r.json())
      .then(data => {
        setIsVIP(data.isVIP);
        
        fetch("/api/feed/articles").then(r => r.json()).then(a => {
          // Filter articles based on VIP status
          setArticles(a);
          
          // Fetch real donors for ALL users (so VIPs can see the thank you feed too)
          fetch("/api/feed/donors").then(r => r.json()).then(rd => {
             if (rd && rd.length > 0) {
               setAllDonors(rd);
             }
             setLoading(false);
          }).catch(() => setLoading(false));
        }).catch(() => setLoading(false));
      }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading) {
      const interval = setInterval(() => {
        setCurrentDonor((prev) => (prev + 1) % allDonors.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [loading, allDonors.length]);

  if (loading) return null;

  if (position === "top") {
    if (!isVIP) {
      return (
        <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-2xl p-4 mb-6 border border-amber-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              <span className="text-xl">⭐</span>
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-sm">Paket Starter (Batas 15 Produk)</h3>
              <p className="text-amber-800 text-xs mt-1">Buka Kuota Unlimited Katalog & Rekomendasi AI Bisnis Harian seharga Rp49rb/bulan.</p>
            </div>
          </div>
          <a href="/upgrade" className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-lg text-center transition-colors">
            Tingkatkan Sekarang
          </a>
        </div>
      );
    }
    return null;
  }

  if (position === "bottom" && articles.length > 0) {
    const vipArticles = articles.filter(a => a.audience === 'VIP_ONLY');
    const freeArticles = articles.filter(a => a.audience === 'ALL');

    const renderList = (list: any[]) => {
      if (list.length === 0) return null;
      if (list.length === 1) {
        const item = list[0];
        return item.imageUrl ? (
          <div 
            onClick={() => setActiveArticle(item)}
            className="cursor-pointer rounded-2xl overflow-hidden shadow-lg border border-slate-200 relative group"
          >
            <img src={item.imageUrl} alt={item.title} className="w-full aspect-video h-auto object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
            <div className="absolute bottom-3 left-3 flex gap-2">
              <span className={`text-[10px] font-black px-2 py-1 rounded ${item.audience === 'VIP_ONLY' ? 'bg-amber-500 text-amber-950' : 'bg-blue-600 text-white'}`}>
                {item.audience === 'VIP_ONLY' ? 'VIP' : 'INFO'}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-5 shadow-lg text-white transition-all duration-300">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[10px] font-black px-2 py-1 rounded ${item.audience === 'VIP_ONLY' ? 'bg-amber-500 text-amber-950' : 'bg-blue-500 text-blue-50'}`}>
                {item.audience === 'VIP_ONLY' ? 'VIP INSIGHT' : 'INFO'}
              </span>
              <span className="text-xs font-medium text-slate-300">{item.category}</span>
            </div>
            <h3 className="font-bold text-lg mb-1 leading-tight">{item.title}</h3>
            <div 
              className={`text-sm text-slate-300 whitespace-pre-line ${expandedId === item.id ? '' : 'line-clamp-2'}`}
              dangerouslySetInnerHTML={{ __html: item.content }}
            />
            <button 
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
              className="mt-4 text-xs font-bold text-indigo-300 hover:text-white transition-colors"
            >
              {expandedId === item.id ? "TUTUP KONTEN \u2191" : "BACA SELENGKAPNYA \u2192"}
            </button>
          </div>
        );
      }

      return (
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            @keyframes bounceRight {
              0%, 100% { transform: translateX(0); }
              50% { transform: translateX(4px); }
            }
            .animate-bounce-right {
              animation: bounceRight 1s ease-in-out infinite;
            }
          `}} />
          {list.map((item, index) => {
            return item.imageUrl ? (
              <div 
                key={item.id} 
                onClick={() => setActiveArticle(item)}
                className="snap-start flex-shrink-0 cursor-pointer rounded-2xl overflow-hidden shadow-lg border border-slate-200 relative group flex flex-col w-[75vw] max-w-[300px] aspect-video"
              >
                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded ${item.audience === 'VIP_ONLY' ? 'bg-amber-500 text-amber-950' : 'bg-blue-600 text-white'}`}>
                    {item.audience === 'VIP_ONLY' ? 'VIP' : 'INFO'}
                  </span>
                </div>
              </div>
            ) : (
              <div 
                key={item.id} 
                className="snap-start flex-shrink-0 bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-4 shadow-lg text-white flex flex-col w-[40vw] max-w-[200px] h-44 relative"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[8px] font-black px-2 py-1 rounded ${item.audience === 'VIP_ONLY' ? 'bg-amber-500 text-amber-950' : 'bg-blue-500 text-blue-50'}`}>
                    {item.audience === 'VIP_ONLY' ? 'VIP' : 'INFO'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-400 truncate">{item.category}</span>
                </div>
                <h3 className="font-bold text-sm mb-2 leading-snug line-clamp-2">{item.title}</h3>
                <div 
                  className={`text-[10px] text-slate-300 whitespace-pre-line ${expandedId === item.id ? '' : 'line-clamp-3'} flex-grow`}
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
                <button 
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="mt-2 text-[9px] font-bold text-indigo-300 hover:text-white transition-colors text-left"
                >
                  {expandedId === item.id ? "TUTUP" : "BACA FULL"}
                </button>
              </div>
            )
          })}
        </div>
      );
    };

    return (
      <div className="mt-8 space-y-8">
        {isVIP && vipArticles.length > 0 && (
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-sm font-black text-amber-600 uppercase tracking-widest">Konten Feed Premium</h3>
                <p className="text-xs text-slate-500 mt-1">Wawasan bisnis premium eksklusif untuk tenant VIP.</p>
              </div>
              {vipArticles.length > 1 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 animate-bounce-right mt-1 shrink-0">
                  GESER <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
              )}
            </div>
            {renderList(vipArticles)}
          </div>
        )}

        {freeArticles.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">Info & Panduan UBOS</h3>
              {freeArticles.length > 1 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 animate-bounce-right shrink-0">
                  GESER <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </div>
              )}
            </div>
            {renderList(freeArticles)}
          </div>
        )}

        {/* Article Modal Overlay */}
        {activeArticle && (
          <div className="fixed inset-0 z-[85] flex justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black px-2 py-1 rounded ${activeArticle.audience === 'VIP_ONLY' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'}`}>
                    {activeArticle.audience === 'VIP_ONLY' ? 'VIP INSIGHT' : 'INFO'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">{activeArticle.category}</span>
                </div>
                <button 
                  onClick={() => setActiveArticle(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              
              {/* Body */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {activeArticle.imageUrl && (
                  <img src={activeArticle.imageUrl} alt={activeArticle.title} className="w-full aspect-video h-auto object-cover" />
                )}
                <div className="p-5 sm:p-8">
                  <h2 className="text-2xl font-black text-slate-900 mb-6">{activeArticle.title}</h2>
                  <div 
                    className="text-slate-700 leading-relaxed text-sm sm:text-base [&>a]:text-blue-600 [&>a:hover]:text-blue-500 [&>a]:font-bold [&>a]:underline whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: activeArticle.content }} /> {activeArticle.ctaUrl && <div className="mt-8"><a href={activeArticle.ctaUrl} target="_blank" className="inline-block bg-blue-600 text-white font-bold py-3 px-6 rounded-xl">Akses Tautan</a></div>} </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}

