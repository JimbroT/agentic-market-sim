/**
 * Shared TypeScript types for the explore route.
 *
 * These are intentionally UI-centric (colors, per-round values, drag/resize
 * state). Backend/API schemas live separately in the Python service.
 */
export type PortfolioEntity = {
  id: string;
  label: string;
  color: string;
  accent: string;
  startingBalance: number;
  roundValues: number[];
  avatarUrl?: string;
};

export type RankedEntity = PortfolioEntity & {
  currentValue: number;
  rank: number;
};

export type DragState = {
  offsetX: number;
  offsetY: number;
} | null;

export type ResizeState = {
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
} | null;

export type MarketMetrics = {
  rates: number;
  inflation: number;
  growth: number;
  volatility: number;
  sentiment: number;
};

export type AllocationBreakdown = {
  cash: number;
  bonds: number;
  equities: number;
  commodities: number;
  volatility: number;
};

export type AgentProfile = {
  participantId: string;
  name: string;
  description: string;
  conviction: number;
  riskBudget: number;
  latestAction?: string;
  portfolio: AllocationBreakdown;
};

export type AgentInsight = {
  participant_id: string;
  round: number;
  thought?: string;
  shock_summary?: string;
  action?: string;
  rationale?: string;
  portfolio_total_before?: number;
  portfolio_total_after?: number;
  pnl_delta?: number;
  market_metrics?: MarketMetrics;
  allocation_after?: AllocationBreakdown;
  profile?: AgentProfile;
  key_signals?: string[];
  risks?: string[];
  rejected_alternatives?: string[];
  expected_next_move?: string;
  confidence?: number;
};
