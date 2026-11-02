import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#D4AF37] text-black font-semibold",
        gold:
          "border-[#D4AF37]/40 bg-[#D4AF37]/15 text-[#D4AF37]",
        platinum:
          "border-gray-300/40 bg-gray-200/15 text-gray-200",
        silver:
          "border-gray-400/40 bg-gray-400/15 text-gray-300",
        bronze:
          "border-amber-700/40 bg-amber-800/20 text-amber-400",
        secondary:
          "border-transparent bg-neutral-800 text-neutral-300",
        destructive:
          "border-transparent bg-red-950 text-red-400 border-red-800/50",
        outline: "text-neutral-300 border-neutral-700",
        success:
          "border-emerald-700/40 bg-emerald-950 text-emerald-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

