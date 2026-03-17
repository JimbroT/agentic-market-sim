/**
 * Semantic node categories used in the explore graph.
 * These colors and labels should stay consistent across the canvas,
 * popup card, and legend.
 */
export type InfluenceNodeType =
  | "shock"
  | "theme"
  | "policy"
  | "company"
  | "asset"
  | "team"
  | "media";

/**
 * Relationship categories used by edges.
 * These tell the viewer why two nodes are connected.
 */
export type InfluenceEdgeType =
  | "causes"
  | "amplifies"
  | "constrains"
  | "exposes"
  | "owns"
  | "reacts_to";

/**
 * Broad layout stages used to place nodes left-to-right.
 * This helps the graph read like a story instead of a random cluster.
 */
export type InfluenceStage =
  | "shock"
  | "transmission"
  | "market"
  | "reaction";

/**
 * Core graph node shape for the explore page.
 * Importance is normalized between 0 and 1 and drives node size.
 */
export type InfluenceNode = {
  id: string;
  label: string;
  type: InfluenceNodeType;
  stage: InfluenceStage;
  x: number;
  y: number;
  color: string;
  importance: number;
  title: string;
  subtitle: string;
  summary: string;
  metadata: Record<string, string>;
  tags: string[];
};

/**
 * Core graph edge shape for the explore page.
 * Strength is normalized between 0 and 1 and drives edge thickness.
 * Primary marks the main explanatory path through the scenario.
 */
export type InfluenceEdge = {
  id: string;
  sourceId: string;
  targetId: string;
  type: InfluenceEdgeType;
  strength: number;
  primary: boolean;
};

/**
 * Shared colors for each node category.
 */
export const influenceNodeColors: Record<InfluenceNodeType, string> = {
  shock: "#d9485f",
  theme: "#7c5cff",
  policy: "#7a7f87",
  company: "#2f9e72",
  asset: "#1d72d2",
  team: "#f59e0b",
  media: "#ff7b3d",
};

/**
 * Legend data rendered in the bottom-left legend card.
 */
export const influenceLegend = [
  { label: "Shock", color: influenceNodeColors.shock },
  { label: "Theme", color: influenceNodeColors.theme },
  { label: "Policy", color: influenceNodeColors.policy },
  { label: "Company", color: influenceNodeColors.company },
  { label: "Asset", color: influenceNodeColors.asset },
  { label: "Team", color: influenceNodeColors.team },
  { label: "Media", color: influenceNodeColors.media },
];

/**
 * Demo influence graph for one simulation scenario.
 * This models a rate-hike shock propagating through themes and policy,
 * then into companies, assets, and finally team behavior.
 */
export function getDemoInfluenceGraph(): {
  nodes: InfluenceNode[];
  edges: InfluenceEdge[];
} {
  const nodes: InfluenceNode[] = [
    {
      id: "shock-rate-hike",
      label: "Rate hike",
      type: "shock",
      stage: "shock",
      x: 12,
      y: 28,
      color: influenceNodeColors.shock,
      importance: 1,
      title: "Aggressive Rate Hike",
      subtitle: "Shock",
      summary:
        "A policy tightening shock that raises discount rates, pressures growth expectations, and shifts the simulation toward a risk-off posture.",
      metadata: {
        regime: "Risk-off",
        magnitude: "+10",
        horizon: "1 day",
      },
      tags: ["Shock", "Macro", "Rates"],
    },
    {
      id: "theme-risk-off",
      label: "Risk-off",
      type: "theme",
      stage: "transmission",
      x: 30,
      y: 28,
      color: influenceNodeColors.theme,
      importance: 0.94,
      title: "Risk-off Regime",
      subtitle: "Theme",
      summary:
        "A defensive market regime marked by higher volatility, lower sentiment, and reduced appetite for risky assets.",
      metadata: {
        sentiment: "Falling",
        volatility: "Elevated",
        growth: "Weakening",
      },
      tags: ["Theme", "Regime"],
    },
    {
      id: "policy-fed",
      label: "Fed path",
      type: "policy",
      stage: "transmission",
      x: 30,
      y: 14,
      color: influenceNodeColors.policy,
      importance: 0.7,
      title: "Fed Path Expectations",
      subtitle: "Policy",
      summary:
        "The market's evolving expectations for further tightening, pauses, or reversals in policy.",
      metadata: {
        rates: "Higher",
        cuts: "Delayed",
        credibility: "Tightening bias",
      },
      tags: ["Policy", "Rates"],
    },
    {
      id: "theme-ai",
      label: "AI infra",
      type: "theme",
      stage: "transmission",
      x: 46,
      y: 40,
      color: influenceNodeColors.theme,
      importance: 0.66,
      title: "AI Infrastructure",
      subtitle: "Theme",
      summary:
        "A thematic cluster linking semiconductors, compute demand, and platform expectations under tighter financial conditions.",
      metadata: {
        demand: "Strong",
        sensitivity: "Valuation-heavy",
        cycle: "Growth",
      },
      tags: ["Theme", "AI"],
    },
    {
      id: "media-bloomberg",
      label: "Bloomberg",
      type: "media",
      stage: "transmission",
      x: 46,
      y: 16,
      color: influenceNodeColors.media,
      importance: 0.52,
      title: "Bloomberg",
      subtitle: "Media",
      summary:
        "A narrative amplifier that can accelerate market attention and reinforce perceived importance of the shock.",
      metadata: {
        role: "Narrative amplifier",
        reach: "Institutional",
        signal: "High attention",
      },
      tags: ["Media", "Narrative"],
    },
    {
      id: "company-nvda",
      label: "NVIDIA",
      type: "company",
      stage: "market",
      x: 61,
      y: 34,
      color: influenceNodeColors.company,
      importance: 0.83,
      title: "NVIDIA",
      subtitle: "Company",
      summary:
        "A high-duration AI infrastructure company whose valuation can be sensitive to tighter rates and shifting growth expectations.",
      metadata: {
        sector: "Semis",
        sensitivity: "High multiple",
        theme: "AI infra",
      },
      tags: ["Company", "Semis"],
    },
    {
      id: "company-tsmc",
      label: "TSMC",
      type: "company",
      stage: "market",
      x: 68,
      y: 46,
      color: influenceNodeColors.company,
      importance: 0.68,
      title: "TSMC",
      subtitle: "Company",
      summary:
        "A central fabrication node linked to advanced compute demand and downstream semiconductor exposure.",
      metadata: {
        sector: "Foundry",
        theme: "Supply chain",
        dependency: "Advanced chips",
      },
      tags: ["Company", "Foundry"],
    },
    {
      id: "asset-bonds",
      label: "Bonds",
      type: "asset",
      stage: "market",
      x: 58,
      y: 62,
      color: influenceNodeColors.asset,
      importance: 0.74,
      title: "Government Bonds",
      subtitle: "Asset",
      summary:
        "A defensive asset bucket that becomes central as participants rotate away from risk assets.",
      metadata: {
        direction: "Bid",
        role: "Defense",
        duration: "Important",
      },
      tags: ["Asset", "Rates"],
    },
    {
      id: "asset-vol",
      label: "Volatility",
      type: "asset",
      stage: "market",
      x: 70,
      y: 62,
      color: influenceNodeColors.asset,
      importance: 0.78,
      title: "Volatility Exposure",
      subtitle: "Asset",
      summary:
        "An asset bucket that rises in relevance as stress increases and participants hedge against uncertainty.",
      metadata: {
        regime: "Stress",
        direction: "Up",
        role: "Hedge",
      },
      tags: ["Asset", "Hedge"],
    },
    {
      id: "team-macro",
      label: "Macro HF",
      type: "team",
      stage: "reaction",
      x: 86,
      y: 42,
      color: influenceNodeColors.team,
      importance: 0.88,
      title: "Macro Hedge Fund",
      subtitle: "Team",
      summary:
        "A simulation participant rotating toward defense as rates rise and sentiment weakens.",
      metadata: {
        action: "Rotate to defense",
        conviction: "0.85",
        latest: "Cut equities, add bonds",
      },
      tags: ["Team", "Defensive"],
    },
    {
      id: "team-longonly",
      label: "Long-only",
      type: "team",
      stage: "reaction",
      x: 88,
      y: 58,
      color: influenceNodeColors.team,
      importance: 0.76,
      title: "Long-only Fund",
      subtitle: "Team",
      summary:
        "A simulation participant de-risking equity exposure and raising cash under a negative regime shift.",
      metadata: {
        action: "De-risk equities",
        conviction: "0.70",
        latest: "Raise cash",
      },
      tags: ["Team", "Equities"],
    },
    {
      id: "team-vol",
      label: "Vol fund",
      type: "team",
      stage: "reaction",
      x: 84,
      y: 74,
      color: influenceNodeColors.team,
      importance: 0.82,
      title: "Volatility Fund",
      subtitle: "Team",
      summary:
        "A simulation participant increasing volatility exposure as market stress builds.",
      metadata: {
        action: "Add volatility",
        conviction: "0.85",
        latest: "Increase vol allocation",
      },
      tags: ["Team", "Volatility"],
    },
  ];

  const edges: InfluenceEdge[] = [
    {
      id: "e1",
      sourceId: "shock-rate-hike",
      targetId: "theme-risk-off",
      type: "causes",
      strength: 0.98,
      primary: true,
    },
    {
      id: "e2",
      sourceId: "shock-rate-hike",
      targetId: "policy-fed",
      type: "causes",
      strength: 0.84,
      primary: false,
    },
    {
      id: "e3",
      sourceId: "theme-risk-off",
      targetId: "theme-ai",
      type: "constrains",
      strength: 0.68,
      primary: false,
    },
    {
      id: "e4",
      sourceId: "policy-fed",
      targetId: "asset-bonds",
      type: "exposes",
      strength: 0.76,
      primary: false,
    },
    {
      id: "e5",
      sourceId: "theme-risk-off",
      targetId: "asset-vol",
      type: "exposes",
      strength: 0.92,
      primary: true,
    },
    {
      id: "e6",
      sourceId: "theme-ai",
      targetId: "company-nvda",
      type: "exposes",
      strength: 0.84,
      primary: false,
    },
    {
      id: "e7",
      sourceId: "theme-ai",
      targetId: "company-tsmc",
      type: "exposes",
      strength: 0.74,
      primary: false,
    },
    {
      id: "e8",
      sourceId: "media-bloomberg",
      targetId: "theme-risk-off",
      type: "amplifies",
      strength: 0.7,
      primary: false,
    },
    {
      id: "e9",
      sourceId: "company-nvda",
      targetId: "team-longonly",
      type: "owns",
      strength: 0.64,
      primary: false,
    },
    {
      id: "e10",
      sourceId: "asset-bonds",
      targetId: "team-macro",
      type: "reacts_to",
      strength: 0.78,
      primary: false,
    },
    {
      id: "e11",
      sourceId: "asset-vol",
      targetId: "team-vol",
      type: "reacts_to",
      strength: 0.96,
      primary: true,
    },
    {
      id: "e12",
      sourceId: "theme-risk-off",
      targetId: "team-macro",
      type: "reacts_to",
      strength: 0.88,
      primary: false,
    },
    {
      id: "e13",
      sourceId: "theme-risk-off",
      targetId: "team-longonly",
      type: "reacts_to",
      strength: 0.9,
      primary: false,
    },
  ];

  return { nodes, edges };
}
