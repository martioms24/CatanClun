import Image from "next/image";
import { cn, PLAYER_ICONS } from "@/lib/utils";

interface MeepleIconProps {
  color?: string;
  className?: string;
  size?: number;
  /** If provided, shows the player's photo icon instead of the SVG meeple */
  name?: string;
}

export function MeepleIcon({
  color = "#8B4513",
  className,
  size = 32,
  name,
}: MeepleIconProps) {
  const iconSrc = name ? PLAYER_ICONS[name] : undefined;

  if (iconSrc) {
    return (
      <Image
        src={iconSrc}
        alt={name!}
        width={size}
        height={size}
        className={cn("rounded-full object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 40"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("drop-shadow-sm", className)}
    >
      {/* Head */}
      <circle cx="16" cy="6" r="5.5" />
      {/* Body */}
      <path d="M8 14 C8 11 12 10 16 10 C20 10 24 11 24 14 L26 24 L20 22 L20 38 L12 38 L12 22 L6 24 Z" />
    </svg>
  );
}

interface MeepleAvatarProps {
  name: string;
  color: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { px: 32, text: "text-xs", ring: "w-8 h-8" },
  md: { px: 40, text: "text-sm", ring: "w-10 h-10" },
  lg: { px: 56, text: "text-base", ring: "w-14 h-14" },
};

export function MeepleAvatar({
  name,
  color,
  size = "md",
  className,
}: MeepleAvatarProps) {
  const s = sizeMap[size];
  const hasIcon = !!PLAYER_ICONS[name];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center border-2 overflow-hidden",
          s.ring
        )}
        style={{
          backgroundColor: color + "22",
          borderColor: color,
        }}
      >
          <MeepleIcon color={color} size={hasIcon ? s.px : s.px * 0.7} name={name} />
      </div>
      <span className={cn("font-cinzel font-semibold text-medieval-dark", s.text)}>
        {name}
      </span>
    </div>
  );
}
