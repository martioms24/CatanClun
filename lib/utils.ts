import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("ca-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ordinal(n: number): string {
  if (n === 1) return "1r";
  if (n === 2) return "2n";
  if (n === 3) return "3r";
  return `${n}è`;
}

// Maps player name → public icon path (icon1–icon7 in order of PLAYER_COLORS)
export const PLAYER_ICONS: Record<string, string> = {
  Martí: "/icon1.png",
  Marcel: "/icon2.png",
  Alejandro: "/icon3.png",
  Nacho: "/icon4.png",
  Eudald: "/icon5.png",
  Iván: "/icon6.png",
  Gaba: "/icon7.png",
};

export const PLAYER_COLORS: Record<string, string> = {
  Martí: "#E53E3E",
  Marcel: "#3182CE",
  Alejandro: "#38A169",
  Nacho: "#D69E2E",
  Eudald: "#805AD5",
  Iván: "#DD6B20",
  Gaba: "#14B8A6",
};

export const OFFICIAL_EXTENSIONS = [
  { name: "Inns & Cathedrals", description: "Les posades doblen els punts de camins, les catedrals milloren les ciutats — però puntuen 0 si incompletes" },
  { name: "Traders & Builders", description: "Mercaderies, constructor per torn extra, porc per millor puntuació de camps" },
  { name: "The Princess & The Dragon", description: "El drac devora meeples, la princesa expulsa cavallers, el portal permet col·locar a qualsevol lloc" },
  { name: "The Tower", description: "Les torres capturen meeples rivals per rescatar" },
  { name: "Abbey & Mayor", description: "L'abadia omple forats, força del batlle = escuts, el carro es mou en completar" },
  { name: "Count, King & Robber", description: "El Rei (ciutat més gran) i el Robatari (camí més llarg) puntuen al final" },
  { name: "Bridges, Castles & Bazaars", description: "Ponts amplien camins, castells copien puntuació veïna, basars subhasten fitxes" },
  { name: "Hills & Sheep", description: "El pastor recull ovelles — el llop se les menja; els turons trenquen empats" },
  { name: "Under the Big Top", description: "Gran Circ, piràmides d'acròbates i el meeple del Director de Circ" },
  { name: "The River", description: "Les fitxes de riu formen l'espina dorsal inicial del tauler" },
  { name: "The Cult", description: "Els llocs de culte competeixen contra els monestirs adjacents" },
  { name: "Mage & Witch", description: "El mag dobla la puntuació de trets; la bruixa la redueix a la meitat" },
];

export function getPositionLabel(position: number): string {
  const labels: Record<number, string> = {
    1: "👑 Campió/a",
    2: "🥈 2n/2a",
    3: "🥉 3r/3a",
  };
  return labels[position] ?? `${ordinal(position)}`;
}

export function getPositionColor(position: number): string {
  const colors: Record<number, string> = {
    1: "text-medieval-gold",
    2: "text-medieval-stone",
    3: "text-amber-600",
  };
  return colors[position] ?? "text-medieval-dark";
}
