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

export type AllocationBreakdown = {
  cash?: number;
  bonds?: number;
  equities?: number;
  commodities?: number;
  volatility?: number;
};

export type MarketMetrics = {
  rates?: number;
  inflation?: number;
  growth?: number;
  volatility?: number;
  sentiment?: number;
};

export type AgentProfile = {
  participantId?: string;
  participant_id?: string;

  name?: string;

  conviction?: number;

  riskBudget?: number;
  risk_budget?: number;

  portfolio?: AllocationBreakdown;

  latestAction?: string;
  latest_action?: string;

  styleSummary?: string;
  style_summary?: string;
};

export type AgentInsight = {
  participantId?: string;
  participant_id?: string;

  round?: number;

  shockSummary?: string;
  shock_summary?: string;

  thought?: string;
  thesis?: string;

  action?: string;
  rationale?: string;

  keySignals?: string[];
  key_signals?: string[];

  risks?: string[];

  rejectedAlternatives?: string[];
  rejected_alternatives?: string[];

  expectedNextMove?: string;
  expected_next_move?: string;

  confidence?: number;

  marketMetrics?: MarketMetrics;
  market_metrics?: MarketMetrics;

  allocationAfter?: AllocationBreakdown;
  allocation_after?: AllocationBreakdown;

  portfolioTotalBefore?: number;
  portfolio_total_before?: number;

  portfolioTotalAfter?: number;
  portfolio_total_after?: number;

  pnlDelta?: number;
  pnl_delta?: number;

  profile?: AgentProfile;
};

