"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgentInsight, PortfolioEntity } from "../types";

type RawRoundSeries = {
  participant_id: string;
  backend_name: string;
  round_values: number[];
};

type SimulationResponse = {
  status: string;
  agent_insights?: AgentInsight[];
  round_series?: RawRoundSeries[];
};

type UseSimulationDataResult = {
  entities: PortfolioEntity[] | null;
  insights: AgentInsight[];
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
  macrohedgefund: "macro-hf",
  longonlyfund: "long-only",
  volatilityfund: "vol-fund",
  commoditiesfund: "alpha-cap",
  ratestraders: "delta-sys",
  marketmakers: "quant-lab",
  retailtraders: "signal-x",
  centralbankwatchers: "deep-value",
};

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
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
        if (!cancelled) setRawData(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const entities = useMemo<PortfolioEntity[] | null>(() => {
    if (!rawData?.round_series) return null;

    return rawData.round_series.map((series) => {
      const id =
        BACKEND_NAME_TO_ENTITY_ID[normalizeKey(series.backend_name)] ??
        normalizeKey(series.participant_id);

      const visuals = ENTITY_VISUALS[id];
      const startingBalance = 100;
      const roundValues = [startingBalance, ...(series.round_values ?? [])];

      return {
        id,
        label: visuals?.label ?? series.backend_name,
        color: visuals?.color ?? "#2563eb",
        accent: visuals?.accent ?? "#60a5fa",
        avatarUrl: visuals?.avatarUrl,
        startingBalance,
        roundValues,
      };
    });
  }, [rawData]);

  const insights = useMemo<AgentInsight[]>(() => {
    return rawData?.agent_insights ?? [];
  }, [rawData]);

  return { entities, insights, loading, error };
}
