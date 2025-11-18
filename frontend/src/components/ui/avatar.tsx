import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva("relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-white text-center leading-none", {
  variants: {
    intent: {
      default: "border-slate-200 bg-slate-50 text-slate-700",
      success: "border-emerald-200 bg-emerald-50 text-emerald-700",
      warning: "border-amber-200 bg-amber-50 text-amber-700",
      error: "border-rose-200 bg-rose-50 text-rose-700",
    },
    size: {
      default: "h-10 w-10",
      sm: "h-8 w-8",
      lg: "h-12 w-12",
    },
  },
  defaultVariants: {
    intent: "default",
    size: "default",
  },
})

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(({ className, intent, size, ...props }, ref) => (
  <div ref={ref} className={cn(avatarVariants({ intent, size, className }))} {...props} />
))
Avatar.displayName = "Avatar"

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}
const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(({ className, ...props }, ref) => (
  <img
    ref={ref}
    className={cn("h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = "AvatarImage"

export interface AvatarFallbackProps
  extends React.HTMLAttributes<HTMLSpanElement> {}
const AvatarFallback = React.forwardRef<HTMLSpanElement, AvatarFallbackProps>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    className={cn("flex h-full w-full items-center justify-center text-xs font-semibold uppercase", className)}
    {...props}
  />
))
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
