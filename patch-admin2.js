const fs = require("fs");

// ============================================================
// 2. UPDATE UsersClient.tsx — tier-aware filters & display
// ============================================================

const usersClientContent = `"use client"
import { useState } from "react"
import { delegateToBana } from "@/actions/superAdminActions"

const TIER_CONFIG: Record<string, { label: string; color: string }> = {
  STARTER:     { label: "Starter",     color: "bg-gray-100 text-gray-600" },
  PRO_BULANAN: { label: "Pro Bulanan", color: "bg-blue-100 text-blue-700" },
  PRO_TAHUNAN: { label: "Pro Tahunan", color: "bg-purple-100 text-purple-700" },
  LIFETIME:    { label: "Lifetime",    color: "bg-amber-100 text-amber-700" },
};

export default function UsersClient({ users }: { users: any[] }) {
    const [filter, setFilter] = useState("ALL");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDelegating, setIsDelegating] = useState(false);

    const filteredUsers = users.filter(u => {
        const daysSinceLogin = u.lastLogin
            ? (new Date().getTime() - new Date(u.lastLogin).getTime()) / (1000 * 3600 * 24)
            : 999;

        if (filter === "STARTER") return u.tier === "STARTER";
        if (filter === "PRO") return u.tier === "PRO_BULANAN";
        if (filter === "VIP") return u.tier === "PRO_TAHUNAN" || u.tier === "LIFETIME";
        if (filter === "PASIF") return u.tier === "STARTER" && (u.crmStatus === "PASIF" || daysSinceLogin > 7);
        return true;
    });

    const toggleSelect = (userId: string) => {
        if (selectedIds.includes(userId)) setSelectedIds(selectedIds.filter(id => id !== userId));
        else setSelectedIds([...selectedIds, userId]);
    }

    const selectAll = () => {
        if (selectedIds.length === filteredUsers.length) setSelectedIds([]);
        else setSelectedIds(filteredUsers.map(u => u.id));
    }

    const handleDelegate = async () => {
        if (selectedIds.length === 0) return;
        setIsDelegating(true);
        await delegateToBana(selectedIds);
        setIsDelegating(false);
        setSelectedIds([]);
        alert("Berhasil didelegasikan ke Bana!");
    }

    const FILTERS = [
        { key: "ALL",     label: "Semua" },
        { key: "STARTER", label: "Starter" },
        { key: "PRO",     label: "Pro Bulanan" },
        { key: "VIP",     label: "Pro Tahunan / Lifetime" },
        { key: "PASIF",   label: "Starter Pasif >7 Hari" },
    ];

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors \${filter === f.key ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"}\`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                
                {selectedIds.length > 0 && (
                    <button 
                        onClick={handleDelegate}
                        disabled={isDelegating}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        Delegasikan ke Bana ({selectedIds.length})
                    </button>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-wider">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={selectedIds.length === filteredUsers.length && filteredUsers.length > 0} onChange={selectAll} className="rounded text-blue-600 focus:ring-blue-500" />
                            </th>
                            <th className="px-4 py-3">User & Nama Usaha</th>
                            <th className="px-4 py-3">Paket</th>
                            <th className="px-4 py-3">Status CRM</th>
                            <th className="px-4 py-3">Login Terakhir</th>
                            <th className="px-4 py-3">Kontak</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredUsers.map(u => {
                            const tierCfg = TIER_CONFIG[u.tier] || TIER_CONFIG.STARTER;
                            return (
                                <tr key={u.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} className="rounded text-blue-600 focus:ring-blue-500" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-gray-900">{u.name || u.email}</p>
                                        <p className="text-[10px] text-gray-500">{u.businesses?.[0]?.name || "Belum ada usaha"}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={\`text-[10px] font-bold px-2 py-1 rounded-md \${tierCfg.color}\`}>
                                            {tierCfg.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={\`text-[10px] font-bold px-2 py-1 rounded-md \${u.crmStatus === "AKTIF" ? "bg-emerald-100 text-emerald-700" : u.crmStatus === "TERKENDALA" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}\`}>
                                            {u.crmStatus || "PASIF"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">
                                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.phone ? (
                                            <a href={\`https://wa.me/\${u.phone.replace(/^0/, "62")}\`} target="_blank" className="text-emerald-600 font-semibold text-xs hover:underline">
                                                {u.phone}
                                            </a>
                                        ) : "-"}
                                    </td>
                                </tr>
                            )
                        })}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Tidak ada data user.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
`;

fs.writeFileSync(
  "C:/Users/USER/.gemini/antigravity/scratch/ubos-v1/src/app/admin/pilot/(dashboard)/users/UsersClient.tsx",
  usersClientContent,
  "utf8"
);
console.log("UsersClient.tsx updated");
