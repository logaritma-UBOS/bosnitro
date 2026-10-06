"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function TrackerScript() {
  const pathname = usePathname();

  useEffect(() => {
    // Hanya lacak halaman publik
    const isPublic = pathname === "/" || pathname?.startsWith("/login") || pathname?.startsWith("/register");
    if (!isPublic) return;

    const today = new Date().toDateString();
    const lastTracked = localStorage.getItem("ubos_device_tracked_date");
    
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer
      })
    }).then(res => {
      if (res.ok && lastTracked !== today) {
        localStorage.setItem("ubos_device_tracked_date", today);
      }
    }).catch(() => {});
  }, [pathname]);

  return null;
}

