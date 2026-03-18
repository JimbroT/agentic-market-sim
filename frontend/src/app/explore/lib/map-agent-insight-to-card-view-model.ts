/**
 * frontend/src/app/explore/lib/map-agent-insight-to-card-view-model.ts
 *
 * Maps the raw participant / memory / world state into a UI-friendly view model
 * for AgentThoughtsCard.
 *
 * This patched version is aligned with the new interactive simulation flow:
 * - It imports types from use-simulation.ts.
 * - It reads the new participant fields such as display_name, style, mandate,
 *   latest_action, latest_thesis, and memory.round_summaries.
 * - It treats portfolio values as real dollars rather than old index-style units.
 *
 * Why this file matters:
 * - It isolates UI formatting logic from the visual component itself.
 * - It makes it much easier to evolve the backend schema without rewriting JSX.
 */

import type {
  AgentMemoryEntry,
  Participant,
  WorldState,
} from "../hooks/use-simulation";

type LiveMetrics = {
  portfolioBefore: number;
  portfolioAfter: number;
  pnlDelta: number;
};

type CardViewModel = {
  header: {
    name: string;
    description: string;
    roundLabel: string;
    badges: {
      label: string;
      tone: "neutral" | "positive" | "negative" | "info";
    }[];
  };
  profile: {
    tiles: { label: string; value: string }[];
  };
  scenario: {
    summary: string;
    tiles: { label: string; value: string }[];
  };
  thought: {
    text: string;
    thesis?: string;
    signals: string[];
    risks: string[];
    rejectedAlternatives: string[];
    expectedNextMove?: string;
  };
  decision: {
    action: string;
    rationale?: string;
    pnlLabel: string;
    pnlTone: "positive" | "negative" | "neutral";
    portfolioBeforeLabel: string;
    portfolioAfterLabel: string;
  };
  allocation: {
    rows: { label: string; value: number; displayValue: string }[];
  };
};

function formatDollars(value: number | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number | undefined, digits = 0): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

function sentenceCase(value: string | undefined): string {
  if (!value) return "Unknown";
  const normalized = value.replace(/_/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function totalPortfolioValue(portfolio: Participant["portfolio"] | undefined): number {
  if (!portfolio) return 0;
  return (
    (portfolio.cash ?? 0) +
    (portfolio.equities ?? 0) +
    (portfolio.bonds ?? 0) +
    (portfolio.commodities ?? 0) +
    (portfolio.volatility ?? 0)
  );
}

export function mapAgentInsightToCardViewModel(
  participant: Participant,
  memoryEntry: AgentMemoryEntry | undefined,
  world: WorldState | undefined,
  label: string,
  round: number,
  liveMetrics?: LiveMetrics,
): CardViewModel {
  const participantName = label || participant.display_name;
  const regime = world?.regime ?? "unknown";

  const profile = {
    style: participant.style || "Multi-asset",
    strategy: participant.role || participant.mandate || "Market participant",
    regime,
    conviction:
      typeof participant.latest_confidence === "number"
        ? participant.latest_confidence
        : undefined,
    riskBudget: participant.risk_budget,
  };

  const headerBadges: CardViewModel["header"]["badges"] = [
    { label: sentenceCase(profile.style), tone: "neutral" },
    { label: `Regime: ${sentenceCase(profile.regime)}`, tone: "info" },
    {
      label: `Risk budget ${formatPercent(profile.riskBudget, 0)}`,
      tone: "info",
    },
  ];

  if (typeof profile.conviction === "number") {
    headerBadges.push({
      label: `Confidence ${formatPercent(profile.conviction, 0)}`,
      tone: profile.conviction >= 0.65 ? "positive" : "neutral",
    });
  }

  const worldVars = world?.world_variables;

  const scenarioSummary =
    memoryEntry?.user_event
      ? `Round ${round}: ${memoryEntry.user_event}`
      : world?.scenario_prompt
        ? `Round ${round}: ${world.scenario_prompt}`
        : `Round ${round}.`;

  const action =
    memoryEntry?.action ??
    participant.latest_action ??
    "No action recorded.";

  const rationale =
    memoryEntry?.market_read ??
    participant.latest_thesis ??
    "No detailed rationale captured for this round.";

  const thoughtText =
    memoryEntry?.market_read ??
    participant.latest_thesis ??
    participant.memory.reflection_summary ??
    "No thought stream available for this round.";

  const thesis =
    memoryEntry?.thesis ??
    participant.latest_thesis ??
    undefined;

  const portfolioAfterBase =
    typeof memoryEntry?.portfolio_value_after === "number"
      ? memoryEntry.portfolio_value_after
      : totalPortfolioValue(participant.portfolio);

  const pnlDeltaBase =
    typeof memoryEntry?.pnl_delta === "number"
      ? memoryEntry.pnl_delta
      : 0;

  const portfolioBeforeBase =
    typeof memoryEntry?.portfolio_value_before === "number"
      ? memoryEntry.portfolio_value_before
      : portfolioAfterBase - pnlDeltaBase;

  const portfolioAfter =
    liveMetrics?.portfolioAfter ?? portfolioAfterBase;

  const pnlDelta =
    liveMetrics?.pnlDelta ?? pnlDeltaBase;

  const portfolioBefore =
    liveMetrics?.portfolioBefore ?? portfolioBeforeBase;

  const pnlTone: "positive" | "negative" | "neutral" =
    pnlDelta > 0 ? "positive" : pnlDelta < 0 ? "negative" : "neutral";

  const pnlLabel =
    typeof pnlDelta === "number"
      ? `${pnlDelta > 0 ? "+" : pnlDelta < 0 ? "-" : ""}${formatDollars(
          Math.abs(pnlDelta),
        )}`
      : "—";

  const executedWeights = memoryEntry?.executed_weights;

  const allocationRows: CardViewModel["allocation"]["rows"] = [
    { label: "Cash", key: "cash" as const },
    { label: "Bonds", key: "bonds" as const },
    { label: "Equities", key: "equities" as const },
    { label: "Commodities", key: "commodities" as const },
    { label: "Volatility", key: "volatility" as const },
  ]
    .map(({ label, key }) => {
      const value = executedWeights?.[key];
      if (typeof value !== "number") return null;

      return {
        label,
        value,
        displayValue: `${(value * 100).toFixed(1)}%`,
      };
    })
    .filter(Boolean) as CardViewModel["allocation"]["rows"];

  return {
    header: {
      name: participantName,
      description: profile.strategy,
      roundLabel: `Round ${round}`,
      badges: headerBadges,
    },
    profile: {
      tiles: [
        { label: "Style", value: sentenceCase(profile.style) },
        { label: "Role", value: participant.role },
        {
          label: "Risk budget",
          value: formatPercent(profile.riskBudget, 0),
        },
        { label: "Regime", value: sentenceCase(profile.regime) },
      ],
    },
    scenario: {
      summary: scenarioSummary,
      tiles: [
        {
          label: "Scenario",
          value: world?.scenario_summary ?? world?.scenario_prompt ?? "—",
        },
        {
          label: "Current round",
          value: typeof world?.current_round === "number"
            ? String(world.current_round)
            : "—",
        },
        {
          label: "Rates",
          value:
            typeof worldVars?.rates === "number"
              ? `${worldVars.rates.toFixed(2)}%`
              : "—",
        },
        {
          label: "Inflation",
          value:
            typeof worldVars?.inflation === "number"
              ? `${worldVars.inflation.toFixed(2)}%`
              : "—",
        },
        {
          label: "Growth",
          value:
            typeof worldVars?.growth === "number"
              ? `${worldVars.growth.toFixed(2)}%`
              : "—",
        },
        {
          label: "Volatility",
          value:
            typeof worldVars?.volatility === "number"
              ? worldVars.volatility.toFixed(2)
              : "—",
        },
        {
          label: "Sentiment",
          value:
            typeof worldVars?.sentiment === "number"
              ? worldVars.sentiment.toFixed(2)
              : "—",
        },
      ],
    },
    thought: {
      text: thoughtText,
      thesis,
      signals: [],
      risks: [],
      rejectedAlternatives: [],
      expectedNextMove: memoryEntry?.lesson ?? undefined,
    },
    decision: {
      action: sentenceCase(action),
      rationale,
      pnlLabel,
      pnlTone,
      portfolioBeforeLabel: formatDollars(portfolioBefore),
      portfolioAfterLabel: formatDollars(portfolioAfter),
    },
    allocation: {
      rows: allocationRows,
    },
  };
}
