import React from "react"

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "primary"

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const baseStyle = "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 inline-flex items-center gap-1 uppercase tracking-wider"
  
  const variants = {
    primary: "bg-primary-50 text-primary-800 border-primary-200",
    success: "bg-success-50 text-success-800 border-success-200",
    warning: "bg-warning-50 text-warning-800 border-warning-200",
    danger: "bg-danger-50 text-danger-800 border-danger-200",
    info: "bg-info-50 text-info-800 border-info-200",
    neutral: "bg-gray-100 text-gray-700 border-gray-200"
  }

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}
