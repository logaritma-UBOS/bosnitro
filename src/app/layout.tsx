import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#059669",
};

export const metadata: Metadata = {
  title: "UBOS - UMKM Business Operation System",
  description: "Sistem Operasi Bisnis untuk UMKM Indonesia",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "UBOS",
  },
};

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

import RequireWhatsappModal from "@/components/layout/RequireWhatsappModal"
import TrackerScript from "@/components/layout/TrackerScript"

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null
  let businessId = null
  try {
    session = await auth()
    if (session?.user?.id) {
      const whereClause = (session.user as any).staffBusinessId ? { id: (session.user as any).staffBusinessId } : { userId: session.user.id };
      const business = await prisma.business.findFirst({ where: whereClause })
      if (business) businessId = business.id
    }
  } catch (err) {
    console.warn("RootLayout auth/business fallback:", err)
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${poppins.className} bg-gray-50 antialiased`} suppressHydrationWarning>
        {children}
        
        <RequireWhatsappModal />
        <TrackerScript />
      </body>
    </html>
  );
}
