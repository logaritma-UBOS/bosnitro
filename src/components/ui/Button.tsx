import React from "react"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  fullWidth?: boolean
}

export function Button({ 
  children, 
  variant = "primary", 
  fullWidth = false, 
  className = "", 
  ...props 
}: ButtonProps) {
  const baseStyle = "min-h-[44px] px-4 font-bold rounded-xl transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
  
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-200",
    danger: "bg-danger-600 text-white hover:bg-danger-700 active:bg-danger-800",
    ghost: "bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100"
  }

  const widthStyle = fullWidth ? "w-full" : ""

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${widthStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
