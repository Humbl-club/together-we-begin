import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { useHapticFeedback } from "@/hooks/useHapticFeedback"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 will-change-transform",
  {
    variants: {
      variant: {
        default: "card-accent text-primary hover:scale-105 shadow-sm touch-feedback",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm touch-feedback",
        outline: "button-glass hover:card-secondary text-foreground touch-feedback",
        secondary: "card-secondary text-foreground hover:card-primary touch-feedback",
        ghost: "hover:card-secondary hover:text-foreground touch-feedback",
        link: "text-primary underline-offset-4 hover:underline",
        glass: "button-glass hover:card-secondary touch-feedback",
        subtle: "bg-transparent text-foreground border border-border/50 hover:bg-muted/40 touch-feedback",
        pastel: "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 touch-feedback",
        "ghost-subtle": "text-foreground hover:bg-muted/50 touch-feedback"
      },
      size: {
        xs: "h-8 px-3",
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-lg px-8 touch-target-large",
        icon: "h-10 w-10 touch-target-large",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  haptic?: 'tap' | 'light' | 'medium' | 'heavy'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, haptic, onPointerDown, onClick, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const haptics = useHapticFeedback()
    const triggerHaptic = React.useCallback(() => {
      if (!haptic) return
      if (haptic === 'tap') haptics.tap()
      else haptics.impact(haptic as any)
    }, [haptic, haptics])
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onPointerDown={(e) => { onPointerDown?.(e); if (!e.defaultPrevented) triggerHaptic() }}
        onClick={(e) => { onClick?.(e); }}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
