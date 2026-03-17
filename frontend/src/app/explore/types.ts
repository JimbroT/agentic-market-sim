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

export type AgentInsight = {
  participant_id: string;
  backend_name: string;
  round: number;
  action: string;
  rationale: string;
  shock_summary: string;
  portfolio_total_after: number | null;
  pnl_delta: number | null;
  thought: string;
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
