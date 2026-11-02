import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#D4AF37] via-[#F2D675] to-[#D4AF37] text-black font-semibold shadow-gold-sm hover:brightness-105",
        gold:
          "bg-[#D4AF37] text-black font-semibold hover:bg-[#F2D675] shadow-gold-sm",
        goldOutline:
          "border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]",
        secondary:
          "bg-[#1A1A1A] text-white hover:bg-[#262626] border border-neutral-800",
        destructive:
          "bg-red-950/80 text-red-400 hover:bg-red-900/80 border border-red-800/50",
        outline:
          "border border-neutral-800 bg-transparent hover:bg-neutral-900 text-neutral-300 hover:text-white",
        ghost:
          "hover:bg-neutral-900 text-neutral-300 hover:text-white",
        link:
          "text-[#D4AF37] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

