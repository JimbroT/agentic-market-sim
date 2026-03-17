import type {
  Participant,
  WorldState,
} from "../hooks/use-simulation-data";

type ParticipantMemoryEntry = Participant["memory"][number];

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

export function mapAgentInsightToCardViewModel(
  participant: Participant,
  memoryEntry: ParticipantMemoryEntry | undefined,
  world: WorldState | undefined,
  label: string,
  round: number,
  liveMetrics?: LiveMetrics
): CardViewModel {
  const profile = {
    style: "Multi-asset",
    strategy: "Systematic / discretionary blend",
    regime: world?.regime ?? "unknown",
    conviction: participant.conviction,
    risk_budget: participant.risk_budget,
  };

  const participantName = label || participant.name;

  const headerBadges: CardViewModel["header"]["badges"] = [
    { label: profile.style, tone: "neutral" },
    { label: `Regime: ${profile.regime}`, tone: "info" },
    {
      label: `Conviction ${(profile.conviction * 100).toFixed(0)}%`,
      tone: "positive",
    },
    {
      label: `Risk budget ${(profile.risk_budget * 100).toFixed(0)}%`,
      tone: "info",
    },
  ];

  const worldVars = world?.world_variables;
  const scenarioSummary =
    memoryEntry?.shock_summary ??
    (world
      ? `Round ${round}: ${world.event} in a ${world.regime} regime.`
      : `Round ${round}.`);

  const action =
    memoryEntry?.action ??
    participant.latest_action ??
    "No action recorded.";

  const rationale =
    memoryEntry?.rationale ??
    "No detailed rationale captured for this round.";

  const isInitialRound = round === 0 || !memoryEntry;

  // base discrete values from memory (index units)
  const portfolioAfterRawBase = isInitialRound
    ? 100
    : memoryEntry?.portfolio_total_after;
  const pnlDeltaRawBase = isInitialRound ? 0 : memoryEntry?.pnl_delta;

  const INDEX_NOTIONAL = 1000;

  // convert base to dollars
  const portfolioAfterBase =
    typeof portfolioAfterRawBase === "number"
      ? portfolioAfterRawBase * INDEX_NOTIONAL
      : undefined;

  const pnlDeltaBase =
    typeof pnlDeltaRawBase === "number"
      ? pnlDeltaRawBase * INDEX_NOTIONAL
      : undefined;

  const portfolioBeforeBase =
    isInitialRound ||
    typeof portfolioAfterBase !== "number" ||
    typeof pnlDeltaBase !== "number"
      ? portfolioAfterBase
      : portfolioAfterBase - pnlDeltaBase;

  // if liveMetrics is present, prefer it
  const portfolioAfter =
    liveMetrics?.portfolioAfter ?? portfolioAfterBase;
  const pnlDelta =
    liveMetrics?.pnlDelta ?? pnlDeltaBase;
  const portfolioBefore =
    liveMetrics?.portfolioBefore ?? portfolioBeforeBase;

  const pnlTone: "positive" | "negative" | "neutral" =
    typeof pnlDelta === "number"
      ? pnlDelta > 0
        ? "positive"
        : pnlDelta < 0
        ? "negative"
        : "neutral"
      : "neutral";

  const pnlLabel =
    typeof pnlDelta === "number"
      ? `${pnlDelta > 0 ? "+" : pnlDelta < 0 ? "-" : ""}${formatDollars(
          Math.abs(pnlDelta)
        )}`
      : "—";

  const allocationRows: CardViewModel["allocation"]["rows"] = [
    { label: "Cash", key: "cash" as const },
    { label: "Bonds", key: "bonds" as const },
    { label: "Equities", key: "equities" as const },
    { label: "Commodities", key: "commodities" as const },
    { label: "Volatility", key: "volatility" as const },
  ]
    .map(({ label, key }) => {
      const val = participant.portfolio[key];
      if (typeof val !== "number") return null;
      const pct = val;
      return {
        label,
        value: pct / 100,
        displayValue: `${pct.toFixed(1)}%`,
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
        { label: "Style", value: profile.style },
        {
          label: "Conviction",
          value: `${(profile.conviction * 100).toFixed(0)}%`,
        },
        {
          label: "Risk budget",
          value: `${(profile.risk_budget * 100).toFixed(0)}%`,
        },
        { label: "Regime", value: profile.regime },
      ],
    },
    scenario: {
      summary: scenarioSummary,
      tiles: [
        { label: "Event", value: world?.event ?? "unknown event" },
        { label: "Horizon", value: world?.horizon ?? "1d" },
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
              ? `${worldVars.inflation.toFixed(1)}%`
              : "—",
        },
        {
          label: "Growth",
          value:
            typeof worldVars?.growth === "number"
              ? `${worldVars.growth.toFixed(1)}%`
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
      text: rationale,
      thesis: undefined,
      signals: [],
      risks: [],
      rejectedAlternatives: [],
      expectedNextMove: undefined,
    },
    decision: {
      action,
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
