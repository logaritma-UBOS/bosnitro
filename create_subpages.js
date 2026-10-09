const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'src/app/admin/pilot/(dashboard)');

// --- TEMPLATES ---

const baseImports = `import { formatRupiah } from '@/lib/format';
export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SaldoWidget from "@/components/team/SaldoWidget";
`;

const checklistImports = `export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChecklistHarian from "@/components/team/ChecklistHarian";
`;

const getTeamMemberLogic = `
  const session = await auth();
  const teamMember = await prisma.teamMember.findUnique({
    where: { email: session?.user?.email || "" },
    include: {
      tasks: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0,0,0,0)),
            lt: new Date(new Date().setHours(23,59,59,999))
          }
        },
        orderBy: { date: 'asc' }
      },
      ledgers: {
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    }
  });

  if (!teamMember) redirect("/login");
`;

const pages = {
  operations: {
    beranda: `${baseImports}
export default async function OperationsBeranda() {
  ${getTeamMemberLogic}
  if (teamMember.role !== "OPERATIONS" && teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      <div className="hidden lg:block">
        <h2 className="text-2xl font-black text-gray-900">Halo, Bana!</h2>
        <p className="text-gray-500 text-sm">Operations, QA & User Care</p>
      </div>
      <div className="lg:hidden mb-2">
        <h2 className="text-lg font-black text-gray-900">Operations, QA & User Care</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
              <h3 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Fokus Utama
              </h3>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Mengawal pengalaman pengguna pertama, menjaga retensi, dan memastikan aplikasi bebas kendala teknis di lapangan.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                Tanggung Jawab Harian & Mingguan
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-800">1. Follow-up Pengguna</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Menghubungi minimal 5 pengguna pasif yang didelegasikan oleh Baim via WA setiap hari dengan pendekatan personal.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">2. Pencatatan Masalah (Issue Logging)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Mendata alasan pengguna pasif serta mencatat error aplikasi langsung ke sistem tiket untuk Reza.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">3. Internal QA & Komunitas</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Menguji rutin fitur baru di HP dan menjawab pertanyaan dasar pengguna di grup WA/Telegram.</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <SaldoWidget balance={teamMember.walletBalance} totalEarned={teamMember.totalEarned} ledgers={teamMember.ledgers} />
        </div>
      </div>
    </div>
  );
}`,
    checklist: `${checklistImports}
export default async function OperationsChecklist() {
  ${getTeamMemberLogic}
  if (teamMember.role !== "OPERATIONS" && teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6 pb-24 lg:pb-8">
      <ChecklistHarian teamMemberId={teamMember.id} tasks={teamMember.tasks} />
    </div>
  );
}`,
    tools: `export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import OperationsClient from "../OperationsClient";

export default async function OperationsTools() {
  ${getTeamMemberLogic}
  if (teamMember.role !== "OPERATIONS" && teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

  const users = await prisma.user.findMany({
    take: 100,
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      <OperationsClient users={users} />

      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-red-100 shadow-sm max-w-2xl mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Log Issue ke Developer</h3>
            <p className="text-xs text-slate-500">Buat tiket kendala teknis (Bug) untuk Reza</p>
          </div>
        </div>
        
        <form className="space-y-4">
          <input type="text" placeholder="Judul / Bagian yang Error (Contoh: Tombol Kasir Macet)..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all" />
          <textarea placeholder="Ceritakan detail kendalanya di sini, dan langkah untuk mereplikasinya..." className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-500 transition-all resize-none"></textarea>
          <button type="button" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md shadow-red-500/20 active:scale-95 text-sm uppercase tracking-wider">Submit Tiket ke Reza</button>
        </form>
      </div>
    </div>
  );
}`
  },
  developer: {
    beranda: `${baseImports}
export default async function DeveloperBeranda() {
  ${getTeamMemberLogic}
  if (teamMember.role !== "DEVELOPER" && teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      <div className="hidden lg:block">
        <h2 className="text-2xl font-black text-gray-900">Halo, Reza!</h2>
        <p className="text-gray-500 text-sm">Lead Software Developer</p>
      </div>
      <div className="lg:hidden mb-2">
        <h2 className="text-lg font-black text-gray-900">Lead Software Developer</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
              <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Fokus Utama
              </h3>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Menjaga stabilitas infrastruktur web aplikasi, menyelesaikan perbaikan sistem (bug), dan mengeksekusi fitur baru secara cepat.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                Tanggung Jawab Harian & Mingguan
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-800">1. Stabilitas & Kecepatan</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Memastikan website frontend dan backend ringan dibuka, aman, serta tidak ada kendala koneksi database.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">2. Antrean Perbaikan (Bug Fixing)</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Menyelesaikan tiket kendala teknis yang dilaporkan oleh Bana dari temuan lapangan.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">3. Implementasi Fitur</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Menerjemahkan alur sistem dan formula dari Tony & Baim menjadi antarmuka web yang rapi dan mudah dipakai pengguna di HP.</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <SaldoWidget balance={teamMember.walletBalance} totalEarned={teamMember.totalEarned} ledgers={teamMember.ledgers} />
        </div>
      </div>
    </div>
  );
}`,
    checklist: `${checklistImports}
export default async function DeveloperChecklist() {
  ${getTeamMemberLogic}
  if (teamMember.role !== "DEVELOPER" && teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6 pb-24 lg:pb-8">
      <ChecklistHarian teamMemberId={teamMember.id} tasks={teamMember.tasks} />
    </div>
  );
}`,
    tools: `export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DeveloperClient from "../DeveloperClient";

export default async function DeveloperTools() {
  ${getTeamMemberLogic}
  if (teamMember.role !== "DEVELOPER" && teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

  const tickets = await prisma.teamTicket.findMany({
    where: { isTechBug: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      <DeveloperClient tickets={tickets} />
      
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Daftar Rencana Fitur</h3>
            <p className="text-xs text-slate-500">Backlog fitur yang antre dikerjakan</p>
          </div>
        </div>
        <div className="text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-sm text-slate-500">Belum ada backlog fitur yang di-assign oleh Baim/Tony hari ini.</p>
        </div>
      </div>
    </div>
  );
}`
  },
  methodology: {
    beranda: `${baseImports}
export default async function MethodologyBeranda() {
  ${getTeamMemberLogic}
  if (teamMember.role !== "METHODOLOGY" && teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      <div className="hidden lg:block">
        <h2 className="text-2xl font-black text-gray-900">Halo, Tony!</h2>
        <p className="text-gray-500 text-sm">Methodology & Knowledge Architect</p>
      </div>
      <div className="lg:hidden mb-2">
        <h2 className="text-lg font-black text-gray-900">Methodology & Knowledge Architect</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
              <h3 className="font-bold text-amber-900 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Fokus Utama
              </h3>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Menjaga kemurnian teori Logaritma (backward mapping) dan menyediakan materi edukasi baku untuk pengguna UBOS.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                Tanggung Jawab Harian & Mingguan
              </h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-800">1. Validasi Logika Engine</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Memastikan formula hitung mundur (margin, HPP, komisi platform) di UBOS tetap presisi dan sesuai kaidah monograf Logaritma.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">2. Penyusunan Materi & Kasus</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Menulis minimal 1 studi kasus riil atau panduan bisnis mingguan untuk disalurkan ke modul edukasi/feed pengguna.</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">3. Konsultasi Keilmuan</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Memberikan arahan konseptual jika ada kebutuhan pengembangan fitur analisis bisnis baru.</p>
              </div>
            </div>
          </div>
        </div>
        <div>
          <SaldoWidget balance={teamMember.walletBalance} totalEarned={teamMember.totalEarned} ledgers={teamMember.ledgers} />
        </div>
      </div>
    </div>
  );
}`,
    checklist: `${checklistImports}
export default async function MethodologyChecklist() {
  ${getTeamMemberLogic}
  if (teamMember.role !== "METHODOLOGY" && teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto space-y-6 pb-24 lg:pb-8">
      <ChecklistHarian teamMemberId={teamMember.id} tasks={teamMember.tasks} />
    </div>
  );
}`,
    tools: `export const dynamic = "force-dynamic";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function MethodologyTools() {
  ${getTeamMemberLogic}
  if (teamMember.role !== "METHODOLOGY" && teamMember.role !== "SUPER_ADMIN") redirect("/admin/pilot");

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-8">
      <div className="bg-white p-5 lg:p-6 rounded-2xl border border-gray-100 shadow-sm max-w-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Input Materi & Studi Kasus</h3>
            <p className="text-xs text-slate-500">Draft tulisan baru untuk diteruskan ke Feed/Edu UI</p>
          </div>
        </div>

        <form className="space-y-4">
          <input type="text" placeholder="Judul Studi Kasus / Panduan..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all" />
          <textarea placeholder="Tulis kerangka atau poin-poin metodologi di sini..." className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none"></textarea>
          <button type="button" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md shadow-purple-500/20 active:scale-95 text-sm uppercase tracking-wider">Simpan Draft Metodologi</button>
        </form>
      </div>
    </div>
  );
}`
  }
};

for (const [role, rolePages] of Object.entries(pages)) {
  fs.writeFileSync(path.join(baseDir, role, 'page.tsx'), rolePages.beranda);
  fs.writeFileSync(path.join(baseDir, role, 'checklist', 'page.tsx'), rolePages.checklist);
  fs.writeFileSync(path.join(baseDir, role, 'tools', 'page.tsx'), rolePages.tools);
}
console.log("Created 9 sub-pages.");
