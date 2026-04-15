import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ordinal(n: number): string {
  const suffixes: Record<number, string> = { 1: "st", 2: "nd", 3: "rd" };
  return `${n}${suffixes[n] ?? "th"}`;
}

export const PLAYER_COLORS: Record<string, string> = {
  Martí: "#E53E3E",      // red
  Marcel: "#3182CE",     // blue
  Alejandro: "#38A169",  // green
  Nacho: "#D69E2E",      // yellow
  Eudald: "#805AD5",     // purple
  Iván: "#DD6B20",       // orange
};

export const OFFICIAL_EXTENSIONS = [
  { name: "Inns & Cathedrals", description: "Inns boost roads, Cathedrals boost cities — but double-or-nothing if incomplete" },
  { name: "Traders & Builders", description: "Trade goods tokens, builder for extra turns, pig for farm bonus" },
  { name: "The Princess & The Dragon", description: "Dragon destroys meeples, portals teleport followers, princess evicts knights" },
  { name: "The Tower", description: "Capture opponent meeples with towers and hold them for ransom" },
  { name: "Abbey & Mayor", description: "Abbey fills gaps, Mayor's strength = pennants, Wagon moves after scoring" },
  { name: "Count, King & Robber", description: "King (largest city) and Robber Baron (longest road) score bonus points at end" },
  { name: "Bridges, Castles & Bazaars", description: "Bridges extend roads, Castles copy scoring, Bazaars auction tiles" },
  { name: "Hills & Sheep", description: "Shepherd herds sheep for points but beware the wolf — Hills break ties" },
  { name: "Under the Big Top", description: "Circus Big Top, acrobat pyramids, and the Ringmaster follower" },
  { name: "The River", description: "River tiles form the starting spine of the board before normal play" },
  { name: "The Cult", description: "Cult places compete against adjacent monasteries — first fully surrounded wins" },
  { name: "Mage & Witch", description: "Mage doubles road/city scoring; Witch halves it" },
];

export function getPositionLabel(position: number): string {
  const labels: Record<number, string> = {
    1: "👑 Champion",
    2: "🥈 2nd",
    3: "🥉 3rd",
  };
  return labels[position] ?? `${position}th`;
}

export function getPositionColor(position: number): string {
  const colors: Record<number, string> = {
    1: "text-medieval-gold",
    2: "text-medieval-stone",
    3: "text-amber-600",
  };
  return colors[position] ?? "text-medieval-dark";
}
