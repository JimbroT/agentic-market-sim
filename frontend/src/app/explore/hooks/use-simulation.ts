/**
 * frontend/src/app/explore/hooks/use-simulation.ts
 *
 * Stateful client hook for the interactive market simulation flow.
 *
 * This hook is responsible for:
 * 1. Initializing a brand-new simulation from a user-authored scenario prompt,
 * 2. Holding the live simulation state in React,
 * 3. Advancing the simulation one round at a time with user-authored events,
 * 4. Exposing frontend-friendly derived entities for the arena / podium UI.
 *
 * Why this file matters:
 * - It replaces the old "fetch once on mount with a hardcoded prompt" pattern.
 * - It gives the page a single source of truth for world state, participants,
 *   round snapshots, events, loading, and error state.
 * - It keeps API orchestration out of the visual components.
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import type { PortfolioEntity } from "../types";

/* -------------------------------------------------------------------------- */
/* Backend-aligned frontend types                                              */
/* -------------------------------------------------------------------------- */

export type AssetAllocation = {
  cash: number;
  equities: number;
  bonds: number;
  commodities: number;
  volatility: number;
};

export type AgentMemoryEntry = {
  round_number: number;
  user_event: string;
  market_read: string;
  thesis: string;
  action: string;
  confidence: number;
  requested_weights: Partial<AssetAllocation>;
  executed_weights: Partial<AssetAllocation>;
  portfolio_value_before: number;
  portfolio_value_after: number;
  pnl_delta: number;
  lesson?: string | null;
};

export type AgentMemory = {
  round_summaries: AgentMemoryEntry[];
  reflection_summary: string;
  persistent_beliefs: string[];
  mistakes_learned: string[];
};

export type Participant = {
  agent_id: string;
  display_name: string;
  role: string;
  mandate: string;
  style: string;
  risk_budget: number;
  portfolio: AssetAllocation;
  memory: AgentMemory;
  latest_action?: string | null;
  latest_thesis?: string | null;
  latest_confidence?: number | null;
};

export type WorldVariables = {
  rates: number;
  inflation: number;
  growth: number;
  volatility: number;
  sentiment: number;
};

export type WorldState = {
  scenario_prompt: string;
  current_round: number;
  regime: string;
  world_variables: WorldVariables;
  market_history: Array<Record<string, unknown>>;
  scenario_summary?: string | null;
  simulation_id?: string | null;
  default_model?: string | null;
};

export type AgentDecision = {
  market_read: string;
  thought: string;
  thesis: string;
  action: string;
  confidence: number;
  risk_flags: string[];
  watch_items: string[];
  target_weights: Array<{
    asset: keyof AssetAllocation;
    weight: number;
    reason: string;
  }>;
};

export type AgentRoundResult = {
  agent_id: string;
  display_name: string;
  role: string;
  decision: AgentDecision;
  requested_weights: AssetAllocation;
  executed_weights: AssetAllocation;
  portfolio_before: AssetAllocation;
  portfolio_after: AssetAllocation;
  portfolio_value_before: number;
  portfolio_value_after: number;
  pnl_delta: number;
  pnl_pct: number;
};

export type RoundSnapshot = {
  round_number: number;
  user_event: string;
  world_before: WorldVariables;
  world_after: WorldVariables;
  agent_results: AgentRoundResult[];
  round_summary?: string | null;
};

export type AgentInsight = {
  agent_id: string;
  display_name: string;
  role: string;
  market_read: string;
  thought: string;
  thesis: string;
  action: string;
  confidence: number;
  risk_flags: string[];
  watch_items: string[];
  requested_weights: Partial<AssetAllocation>;
  executed_weights: Partial<AssetAllocation>;
  pnl_delta: number;
  pnl_pct: number;
};

export type RoundEvent = {
  round: number;
  user_event: string;
};

type InitializeResponse = {
  status: string;
  world_state: WorldState;
  participants: Participant[];
  round_snapshots: RoundSnapshot[];
  agent_insights: AgentInsight[];
  events: RoundEvent[];
  meta?: {
    simulation_id?: string;
    starting_nav?: number;
    model?: string | null;
  };
};

type StepResponse = {
  status: string;
  world_state: WorldState;
  participants: Participant[];
  round_snapshot: RoundSnapshot;
  agent_insights: AgentInsight[];
  event: RoundEvent;
};

export type UseSimulationResult = {
  world: WorldState | null;
  participants: Participant[];
  roundSnapshots: RoundSnapshot[];
  events: RoundEvent[];
  latestAgentInsights: AgentInsight[];
  entities: PortfolioEntity[] | null;
  loading: boolean;
  error: string | null;
  initializeSimulation: (prompt: string, model?: string | null) => Promise<void>;
  addRound: (userEvent: string, model?: string | null) => Promise<void>;
  resetSimulation: () => void;
};

/* -------------------------------------------------------------------------- */
/* UI mapping helpers                                                          */
/* -------------------------------------------------------------------------- */

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

function getPortfolioValue(portfolio: Partial<AssetAllocation> | undefined) {
  if (!portfolio) return 0;
  return (
    (portfolio.cash ?? 0) +
    (portfolio.equities ?? 0) +
    (portfolio.bonds ?? 0) +
    (portfolio.commodities ?? 0) +
    (portfolio.volatility ?? 0)
  );
}

function buildEntitiesFromParticipants(participants: Participant[]): PortfolioEntity[] {
  return participants.map((participant) => {
    const id = toEntityId(participant.agent_id);
    const visuals = ENTITY_VISUALS[id];
    const startingBalance =
      participant.memory.round_summaries[0]?.portfolio_value_before ??
      getPortfolioValue(participant.portfolio);

    const roundValues = [
      startingBalance,
      ...participant.memory.round_summaries.map(
        (entry) => entry.portfolio_value_after ?? startingBalance,
      ),
    ];

    return {
      id,
      label: visuals?.label ?? participant.display_name,
      color: visuals?.color ?? "#2563eb",
      accent: visuals?.accent ?? "#60a5fa",
      avatarUrl: visuals?.avatarUrl,
      startingBalance,
      roundValues,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* API helpers                                                                 */
/* -------------------------------------------------------------------------- */

const API_BASE = "http://localhost:8000";

async function postJson<TResponse>(
  path: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request to ${path} failed`);
  }

  return (await response.json()) as TResponse;
}

/* -------------------------------------------------------------------------- */
/* Hook                                                                        */
/* -------------------------------------------------------------------------- */

export function useSimulation(): UseSimulationResult {
  const [world, setWorld] = useState<WorldState | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roundSnapshots, setRoundSnapshots] = useState<RoundSnapshot[]>([]);
  const [events, setEvents] = useState<RoundEvent[]>([]);
  const [latestAgentInsights, setLatestAgentInsights] = useState<AgentInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeSimulation = useCallback(
    async (prompt: string, model?: string | null) => {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        const message = "Please enter a simulation prompt.";
        setError(message);
        throw new Error(message);
      }
  
      try {
        setLoading(true);
        setError(null);
  
        const data = await postJson<InitializeResponse>("/simulate", {
          prompt: trimmedPrompt,
          ...(model ? { model } : {}),
        });
  
        setWorld(data.world_state);
        setParticipants(data.participants);
        setRoundSnapshots(data.round_snapshots ?? []);
        setEvents(data.events ?? []);
        setLatestAgentInsights(data.agent_insights ?? []);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to initialize simulation.";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [],
  );
  
  const addRound = useCallback(
    async (userEvent: string, model?: string | null) => {
      const trimmedEvent = userEvent.trim();
  
      if (!world) {
        const message = "Initialize a simulation before adding a round.";
        setError(message);
        throw new Error(message);
      }
  
      if (!trimmedEvent) {
        const message = "Please enter an event for the next round.";
        setError(message);
        throw new Error(message);
      }
  
      try {
        setLoading(true);
        setError(null);
  
        const data = await postJson<StepResponse>("/simulate/step", {
          world_state: world,
          participants,
          user_event: trimmedEvent,
          ...(model ? { model } : {}),
        });
  
        setWorld(data.world_state);
        setParticipants(data.participants);
        setRoundSnapshots((prev) => [...prev, data.round_snapshot]);
        setEvents((prev) => [...prev, data.event]);
        setLatestAgentInsights(data.agent_insights ?? []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to add round.";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [participants, world],
  );  

  const resetSimulation = useCallback(() => {
    setWorld(null);
    setParticipants([]);
    setRoundSnapshots([]);
    setEvents([]);
    setLatestAgentInsights([]);
    setLoading(false);
    setError(null);
  }, []);

  const entities = useMemo<PortfolioEntity[] | null>(() => {
    if (!participants.length) return null;
    return buildEntitiesFromParticipants(participants);
  }, [participants]);

  return {
    world,
    participants,
    roundSnapshots,
    events,
    latestAgentInsights,
    entities,
    loading,
    error,
    initializeSimulation,
    addRound,
    resetSimulation,
  };
}
