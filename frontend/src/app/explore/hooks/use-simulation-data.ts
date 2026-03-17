"use client";

import { useEffect, useMemo, useState } from "react";
import type { PortfolioEntity } from "../types";

type ParticipantMemoryEntry = {
  type?: string;
  round?: number;
  shock_summary?: string;
  action?: string;
  rationale?: string;
  portfolio_total_after?: number;
  pnl_delta?: number;
};

export type Participant = {
  name: string;
  portfolio: {
    cash: number;
    bonds: number;
    equities: number;
    commodities: number;
    volatility: number;
  };
  conviction: number;
  risk_budget: number;
  memory: ParticipantMemoryEntry[];
  latest_action: string;
};

export type WorldState = {
  event: string;
  regime: string;
  horizon: string;
  timeline_mode: string;
  current_round: number;
  world_variables: {
    rates: number;
    inflation: number;
    growth: number;
    volatility: number;
    sentiment: number;
  };
  participants: Participant[];
};

type SimulationResponse = {
  status: string;
  result: {
    world_state: WorldState;
  };
};

type UseSimulationDataResult = {
  entities: PortfolioEntity[] | null;
  participants: Participant[];
  world: WorldState | null;
  loading: boolean;
  error: string | null;
};

const ENTITY_VISUALS: Record<
  string,
  {
    label: string;
    color: string;
    accent: string;
    avatarUrl?: string;
  }
> = {
  "macro-hf": {
    label: "Macro Hedge Fund",
    color: "#2563eb",
    accent: "#60a5fa",
    avatarUrl: "/avatars/oldman/oldman.gltf",
  },
  "long-only": {
    label: "Long-Only Fund",
    color: "#0f766e",
    accent: "#2dd4bf",
    avatarUrl: "/avatars/amy/amy.gltf",
  },
  "vol-fund": {
    label: "Volatility Fund",
    color: "#7c3aed",
    accent: "#a78bfa",
    avatarUrl: "/avatars/monster/monster.gltf",
  },
  "alpha-cap": {
    label: "Commodities Fund",
    color: "#b45309",
    accent: "#f59e0b",
    avatarUrl: "/avatars/salsa/salsa.gltf",
  },
  "delta-sys": {
    label: "Rates Traders",
    color: "#475569",
    accent: "#94a3b8",
    avatarUrl: "/avatars/mouse/mouse.gltf",
  },
  "quant-lab": {
    label: "Market Makers",
    color: "#be123c",
    accent: "#fb7185",
    avatarUrl: "/avatars/breakdance/breakdance.gltf",
  },
  "signal-x": {
    label: "Retail Traders",
    color: "#16a34a",
    accent: "#4ade80",
    avatarUrl: "/avatars/timmy/timmy.gltf",
  },
  "deep-value": {
    label: "Central Bank Watchers",
    color: "#1d4ed8",
    accent: "#38bdf8",
    avatarUrl: "/avatars/Flair/Flair.gltf",
  },
};

const BACKEND_NAME_TO_ENTITY_ID: Record<string, string> = {
  macro_hedge_fund: "macro-hf",
  long_only_fund: "long-only",
  volatility_fund: "vol-fund",
  commodities_fund: "alpha-cap",
  rates_traders: "delta-sys",
  market_makers: "quant-lab",
  retail_traders: "signal-x",
  central_bank_watchers: "deep-value",
};

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function toEntityId(raw?: string) {
  const normalized = normalizeKey(raw ?? "");
  return BACKEND_NAME_TO_ENTITY_ID[normalized] ?? normalized;
}

export function useSimulationData(): UseSimulationDataResult {
  const [rawData, setRawData] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("http://localhost:8000/simulate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt:
              "Raise interest rates by 10 and keep geopolitics peaceful over the next day.",
          }),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || "Simulation request failed");
        }

        const data = (await response.json()) as SimulationResponse;
        if (!cancelled) {
          setRawData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const world = useMemo<WorldState | null>(() => {
    return rawData?.result?.world_state ?? null;
  }, [rawData]);

  const participants = useMemo<Participant[]>(() => {
    return world?.participants ?? [];
  }, [world]);

  const entities = useMemo<PortfolioEntity[] | null>(() => {
    if (!world) return null;

    return world.participants.map((p) => {
      const id = toEntityId(p.name);
      const visuals = ENTITY_VISUALS[id];
      const startingBalance = 100;

      const memoryRounds = p.memory.filter(
        (m) => typeof m.round === "number"
      );
      const sortedRounds = memoryRounds.sort(
        (a, b) => (a.round ?? 0) - (b.round ?? 0)
      );

      const roundValues = [
        startingBalance,
        ...sortedRounds.map(
          (m) => m.portfolio_total_after ?? startingBalance
        ),
      ];

      return {
        id,
        label: visuals?.label ?? p.name,
        color: visuals?.color ?? "#2563eb",
        accent: visuals?.accent ?? "#60a5fa",
        avatarUrl: visuals?.avatarUrl,
        startingBalance,
        roundValues,
      };
    });
  }, [world]);

  return { entities, participants, world, loading, error };
}
