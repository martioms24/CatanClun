import type { QuedadaType } from "@/types";

export const QUEDADA_TYPES = [
  { type: "default" as QuedadaType, label: "Quedada", emoji: "\uD83E\uDD1D", points: 4 },
  { type: "escalar" as QuedadaType, label: "Escalar", emoji: "\uD83E\uDDD7", points: 10 },
  { type: "festa" as QuedadaType, label: "Sortir de festa", emoji: "\uD83C\uDF89", points: 15 },
  { type: "platja" as QuedadaType, label: "Platja", emoji: "\uD83C\uDFD6\uFE0F", points: 10 },
  { type: "barbacoa" as QuedadaType, label: "Barbacoa", emoji: "\uD83D\uDD25", points: 10 },
  { type: "custom" as QuedadaType, label: "Personalitzat", emoji: "\u2728", points: 0 },
] as const;

export function getQuedadaTypeInfo(type: QuedadaType) {
  return QUEDADA_TYPES.find((t) => t.type === type) ?? QUEDADA_TYPES[0];
}
