import { OwnerShell } from "@/components/owner/OwnerComponents"

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <OwnerShell>{children}</OwnerShell>
}
