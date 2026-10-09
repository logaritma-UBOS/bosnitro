const fs = require('fs');

let content = fs.readFileSync('src/app/riwayat/RiwayatClient.tsx', 'utf8');

// 1. Add state for date filter
const stateTarget = `  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)`;

const stateReplacement = `  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState("today")`;

content = content.replace(stateTarget, stateReplacement);

// 2. Add derived state for filteredSales and update metrics
const metricsTarget = `  // Delegasikan perhitungan bisnis ke Engine (Single Source of Truth)
  const metrics = calculateHistoryMetrics(sales)`;

const metricsReplacement = `  // Filter berdasarkan tanggal
  const filteredSales = sales.filter(sale => {
    const saleDate = new Date(sale.createdAt);
    const now = new Date();
    
    if (dateFilter === "today") {
      return saleDate.getDate() === now.getDate() && 
             saleDate.getMonth() === now.getMonth() && 
             saleDate.getFullYear() === now.getFullYear();
    } else if (dateFilter === "7d") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return saleDate >= sevenDaysAgo;
    } else if (dateFilter === "30d") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return saleDate >= thirtyDaysAgo;
    }
    return true;
  });

  // Delegasikan perhitungan bisnis ke Engine (Single Source of Truth)
  const metrics = calculateHistoryMetrics(filteredSales)`;

content = content.replace(metricsTarget, metricsReplacement);

// 3. Update select to use the state
const selectTarget = `<select className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2">`;
const selectReplacement = `<select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
          >`;

content = content.replace(selectTarget, selectReplacement);

// 4. Update the render loop to map over filteredSales
const mapTarget = `{sales.map(sale => (`;
const mapReplacement = `{filteredSales.map(sale => (`;
content = content.replace(mapTarget, mapReplacement);

// 5. Update empty state check
const emptyTarget = `{sales.length === 0 && (`;
const emptyReplacement = `{filteredSales.length === 0 && (`;
content = content.replace(emptyTarget, emptyReplacement);

// Fix text empty state based on filter
const emptyTextTarget = `<p className="text-gray-500 font-medium">Belum ada transaksi hari ini.</p>`;
const emptyTextReplacement = `<p className="text-gray-500 font-medium">Belum ada transaksi di periode ini.</p>`;
content = content.replace(emptyTextTarget, emptyTextReplacement);


fs.writeFileSync('src/app/riwayat/RiwayatClient.tsx', content);
