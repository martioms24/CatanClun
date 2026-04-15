import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "brown" | "burgundy" | "green" | "stone";
}

export function Badge({
  className,
  variant = "brown",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    gold: "bg-medieval-gold/20 text-medieval-dark border-medieval-gold",
    brown: "bg-medieval-brown/10 text-medieval-brown border-medieval-brown/40",
    burgundy:
      "bg-medieval-burgundy/10 text-medieval-burgundy border-medieval-burgundy/40",
    green:
      "bg-medieval-green/10 text-medieval-green border-medieval-green/40",
    stone: "bg-medieval-stone/10 text-medieval-stone border-medieval-stone/40",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5",
        "text-xs font-cinzel font-semibold",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
