import type { RewardType } from "@/types";

export const REWARDS_CATALOG = [
  {
    type: "birra" as RewardType,
    label: "Birra",
    emoji: "\uD83C\uDF7A",
    cost: 200,
    description: "Tria qui et deu una cervesa",
    needsTarget: true,
    needsDescription: false,
  },
  {
    type: "cubata" as RewardType,
    label: "Cubata",
    emoji: "\uD83C\uDF79",
    cost: 500,
    description: "Tria qui et deu un cubata",
    needsTarget: true,
    needsDescription: false,
  },
  {
    type: "tiktok" as RewardType,
    label: "Ball de TikTok",
    emoji: "\uD83D\uDD7A",
    cost: 1000,
    description: "Un jugador ha de fer el ball de TikTok que tu proposis",
    needsTarget: true,
    needsDescription: true,
  },
  {
    type: "sopar" as RewardType,
    label: "Sopar / Dinar",
    emoji: "\uD83C\uDF7D\uFE0F",
    cost: 1500,
    description: "Tot el grup t'invita a sopar o dinar",
    needsTarget: false,
    needsDescription: false,
  },
] as const;
