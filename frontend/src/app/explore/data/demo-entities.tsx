/**
 * Demo dataset for the `/explore` arena.
 *
 * Each entity provides per-round values and (optionally) an avatar URL.
 * Avatars are loaded from `frontend/public/avatars/**` and will fall back to the
 * procedural placeholder if missing.
 */
import type { PortfolioEntity } from "../types";

/**
 * Demo entities for the arena.
 *
 * Important:
 * - Do not set avatarUrl until the actual .glb file exists in /public/avatars.
 * - The shared avatar layer will fall back to the placeholder avatar automatically.
 */
export const demoEntities: PortfolioEntity[] = [
  {
    id: "macro-hf",
    label: "Macro Hedge Fund",
    color: "#f59e0b",
    accent: "#fbbf24",
    startingBalance: 100,
    roundValues: [100, 106, 111, 118, 121],
    avatarUrl: "/avatars/oldman/oldman.gltf",
  },
  {
    id: "long-only",
    label: "Long-Only Fund",
    color: "#2563eb",
    accent: "#60a5fa",
    startingBalance: 100,
    roundValues: [100, 98, 95, 97, 101],
    avatarUrl: "/avatars/Flair/Flair.gltf",
  },
  {
    id: "vol-fund",
    label: "Volatility Fund",
    color: "#7c3aed",
    accent: "#a78bfa",
    startingBalance: 100,
    roundValues: [100, 108, 116, 123, 129],
    avatarUrl: "/avatars/amy/amy.gltf",
  },
  {
    id: "alpha-cap",
    label: "Commodities Fund",
    color: "#059669",
    accent: "#34d399",
    startingBalance: 100,
    roundValues: [100, 103, 105, 104, 110],
    avatarUrl: "/avatars/mouse/mouse.gltf",
  },
  {
    id: "delta-sys",
    label: "Rates Traders",
    color: "#dc2626",
    accent: "#f87171",
    startingBalance: 100,
    roundValues: [100, 97, 92, 89, 91],
    avatarUrl: "/avatars/monster/monster.gltf",
  },
  {
    id: "quant-lab",
    label: "Market Makers",
    color: "#0f766e",
    accent: "#2dd4bf",
    startingBalance: 100,
    roundValues: [100, 101, 104, 109, 115],
    avatarUrl: "/avatars/salsa/salsa.gltf",
  },
  {
    id: "signal-x",
    label: "Retail Traders",
    color: "#9333ea",
    accent: "#c084fc",
    startingBalance: 100,
    roundValues: [100, 99, 102, 108, 112],
    avatarUrl: "/avatars/breakdance/breakdance.gltf",
  },
  {
    id: "deep-value",
    label: "Central Bank Watchers",
    color: "#ea580c",
    accent: "#fb923c",
    startingBalance: 100,
    roundValues: [100, 102, 100, 103, 107],
    avatarUrl: "/avatars/timmy/timmy.gltf",
  },
];
