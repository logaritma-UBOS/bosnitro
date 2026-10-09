const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/stok/StokClient.tsx', 'utf8');

// 1. Add searchQuery state
code = code.replace(
    `const [supplierId, setSupplierId] = useState("")`,
    `const [supplierId, setSupplierId] = useState("")
    const [searchQuery, setSearchQuery] = useState("")`
);

// 2. Add search input and filter logic
const searchHtml = `
                <div className="space-y-3 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                  <div className="flex flex-col gap-2 px-2 pt-1 mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase">Daftar Barang (Isi Jumlahnya)</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Cari produk/bahan..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
`;

code = code.replace(
    `<div className="space-y-3 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                  <label className="block text-xs font-bold text-gray-500 uppercase px-2 pt-1 mb-1">Daftar Barang (Isi Jumlahnya)</label>`,
    searchHtml
);

// Update filter condition
const filterCode = `.filter((item: any) => (!supplierId || item.supplierId === supplierId) && (!searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase())))`;
code = code.replace(/\.filter\(\(item: any\) => !supplierId \|\| item\.supplierId === supplierId\)/g, filterCode);

fs.writeFileSync('src/app/(dashboard)/stok/StokClient.tsx', code);
console.log("Updated StokClient with search query");
