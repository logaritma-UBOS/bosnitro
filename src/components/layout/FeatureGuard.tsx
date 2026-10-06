"use client"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

export default function FeatureGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(true)

  useEffect(() => {
    const checkTier = async () => {
      try {
        const r = await fetch("/api/user/status")
        const d = await r.json()
        const tier = d.tier || "Starter"

        if (tier === "Starter") {
          const lockedRoutes = ["/pelanggan", "/pengeluaran", "/stok"]
          if (lockedRoutes.some(route => pathname.startsWith(route))) {
            setAllowed(false)
            router.push("/upgrade")
            return
          }
        }
        setAllowed(true)
      } catch (e) {
        setAllowed(true)
      } finally {
        setLoading(false)
      }
    }
    checkTier()
  }, [pathname, router])

  if (!allowed || loading) return null
  
  return <>{children}</>
}
