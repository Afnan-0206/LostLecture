import * as React from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  children?: React.ReactNode
  className?: string
  to?: string
  href?: string
  target?: string
  rel?: string
  variant?: "primary" | "secondary" | "dark" | "outline" | "danger" | "success" | "amber"
  size?: "sm" | "md" | "lg"
  icon?: React.ReactNode
  loading?: boolean
}

const variantStyles: Record<string, { base: string; dot: string; hoverText: string }> = {
  primary: {
    base: "border-blue-600 bg-white text-blue-700 hover:text-white",
    dot: "bg-blue-600",
    hoverText: "text-white",
  },
  secondary: {
    base: "border-slate-300 bg-white text-slate-700 hover:text-white",
    dot: "bg-slate-800",
    hoverText: "text-white",
  },
  dark: {
    base: "border-slate-800 bg-slate-900 text-white hover:text-slate-900",
    dot: "bg-white",
    hoverText: "text-slate-900",
  },
  outline: {
    base: "border-slate-200 bg-white text-slate-700 hover:text-blue-600 hover:border-blue-600",
    dot: "bg-blue-50",
    hoverText: "text-blue-700",
  },
  danger: {
    base: "border-red-600 bg-white text-red-600 hover:text-white",
    dot: "bg-red-600",
    hoverText: "text-white",
  },
  success: {
    base: "border-emerald-600 bg-white text-emerald-700 hover:text-white",
    dot: "bg-emerald-600",
    hoverText: "text-white",
  },
  amber: {
    base: "border-amber-500 bg-white text-amber-700 hover:text-white",
    dot: "bg-amber-600",
    hoverText: "text-white",
  },
}

const sizeStyles = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-10 px-5 text-xs font-semibold",
  lg: "h-12 px-6 text-sm font-semibold",
}

export const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(
  (
    {
      text,
      children,
      className,
      to,
      href,
      target,
      rel,
      variant = "primary",
      size = "md",
      icon,
      loading = false,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const content = text || children
    const styles = variantStyles[variant] || variantStyles.primary
    const sizeCls = sizeStyles[size] || sizeStyles.md
    const IconComponent = icon || <ArrowRight className="w-3.5 h-3.5" />

    const inner = (
      <>
        {/* Animated Expanding Dot */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute left-3.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full transition-all duration-300 ease-out group-hover:scale-[38] group-hover:left-1/2 group-hover:-translate-x-1/2 pointer-events-none z-0",
            styles.dot
          )}
        />

        {/* Resting Content: shifted slightly to accommodate dot */}
        <span className="relative z-10 inline-flex items-center gap-1.5 pl-3 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {content}
        </span>

        {/* Hover State: slides into center with Arrow icon */}
        <div className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 opacity-0 translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <span className={cn("font-semibold flex items-center gap-1.5", styles.hoverText)}>
            {content}
            {IconComponent}
          </span>
        </div>
      </>
    )

    const baseClassName = cn(
      "group relative inline-flex items-center justify-center overflow-hidden rounded-xl border font-medium transition-all duration-300 shadow-xs active:scale-[0.98] cursor-pointer select-none",
      sizeCls,
      styles.base,
      (disabled || loading) && "opacity-60 cursor-not-allowed pointer-events-none",
      className
    )

    if (to) {
      return (
        <Link
          to={to}
          className={baseClassName}
          onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        >
          {inner}
        </Link>
      )
    }

    if (href) {
      return (
        <a
          href={href}
          target={target}
          rel={rel}
          className={baseClassName}
          onClick={onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        >
          {inner}
        </a>
      )
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onClick={onClick}
        className={baseClassName}
        {...props}
      >
        {inner}
      </button>
    )
  }
)

InteractiveHoverButton.displayName = "InteractiveHoverButton"

export default InteractiveHoverButton

