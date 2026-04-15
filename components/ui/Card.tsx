import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "parchment" | "stone" | "gold";
}

export function Card({
  className,
  variant = "parchment",
  children,
  ...props
}: CardProps) {
  const variants = {
    parchment: "bg-parchment border-medieval-brown/30",
    stone: "bg-medieval-stone/10 border-medieval-stone/40",
    gold: "bg-medieval-gold/10 border-medieval-gold",
  };

  return (
    <div
      className={cn(
        "rounded-medieval border-2 shadow-medieval p-4",
        "relative overflow-hidden",
        variants[variant],
        className
      )}
      {...props}
    >
      {/* Decorative corner ornaments */}
      <span className="absolute top-1.5 left-1.5 text-medieval-gold/40 text-xs select-none">
        ✦
      </span>
      <span className="absolute top-1.5 right-1.5 text-medieval-gold/40 text-xs select-none">
        ✦
      </span>
      {children}
    </div>
  );
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "mb-3 pb-2 border-b border-medieval-brown/20 flex items-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {}
export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        "font-cinzel font-bold text-medieval-dark text-lg",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}
