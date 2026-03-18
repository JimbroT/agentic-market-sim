/**
 * frontend/src/app/explore/types.ts
 *
 * Shared UI-centric TypeScript types for the explore route.
 *
 * This file is intentionally focused on presentation-layer data, not backend API
 * contracts. Backend-aligned request/response and simulation state types now live
 * in `hooks/use-simulation.ts`, where the interactive simulation store is defined.
 *
 * Why this file matters:
 * - It keeps visual components lightweight and UI-focused.
 * - It avoids re-defining backend response types in multiple places.
 * - It preserves a small shared surface for arena layout / playback logic.
 *
 * Migration note:
 * - Older versions of this file included legacy AgentInsight / AgentProfile
 *   shapes from the previous one-shot backend flow.
 * - Those are intentionally removed here to reduce confusion.
 * - Components that need backend-aligned participant/world/insight data should
 *   import those types directly from `./hooks/use-simulation`.
 */

export type PortfolioEntity = {
  /**
   * Stable UI entity id used by the arena layout / selection system.
   * This is not necessarily the same as the backend's `agent_id`.
   */
  id: string;

  /**
   * Human-readable label shown in the podium / selection UI.
   */
  label: string;

  /**
   * Primary and accent colors used for the podium card and highlight state.
   */
  color: string;
  accent: string;

  /**
   * Starting portfolio value at round 0.
   */
  startingBalance: number;

  /**
   * Portfolio value timeline used by playback.
   * Convention:
   * - index 0 = starting balance before any user-added rounds
   * - index n = portfolio value after round n
   */
  roundValues: number[];

  /**
   * Optional 3D avatar asset path used by the arena scene.
   */
  avatarUrl?: string;
};

export type RankedEntity = PortfolioEntity & {
  /**
   * Interpolated current value for the current playback position.
   */
  currentValue: number;

  /**
   * Rank among all visible entities at the current playback position.
   */
  rank: number;
};

export type DragState =
  | {
      offsetX: number;
      offsetY: number;
    }
  | null;

export type ResizeState =
  | {
      startX: number;
      startY: number;
      startWidth: number;
      startHeight: number;
    }
  | null;
