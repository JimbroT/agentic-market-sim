/**
 * frontend/src/app/explore/hooks/use-simulation-data.ts
 *
 * Legacy compatibility shim for older explore components.
 *
 * This file previously:
 * - auto-fetched a hardcoded simulation on mount,
 * - expected the old backend response shape,
 * - exported Participant / WorldState types tied to the legacy data model.
 *
 * That behavior no longer matches the new interactive simulation architecture.
 *
 * New role of this file:
 * - Re-export the new shared helper `toEntityId`,
 * - Provide a deprecated hook that returns an empty state and a clear warning,
 * - Avoid accidental use of the old one-shot simulation flow.
 *
 * Why keep this file at all?
 * - Some existing components may still import from this path.
 * - Keeping a compatibility shim is safer than leaving the old hardcoded logic
 *   around while the frontend is being migrated.
 *
 * Recommended long-term plan:
 * - Update all remaining imports to use `useSimulation` from `./use-simulation`
 * - Then delete this file entirely.
 */

"use client";

import { useEffect } from "react";
import type { PortfolioEntity } from "../types";
import type {
  Participant,
  WorldState,
} from "./use-simulation";
import { toEntityId } from "./use-simulation";

export type { Participant, WorldState };
export { toEntityId };

type UseSimulationDataResult = {
  entities: PortfolioEntity[] | null;
  participants: Participant[];
  world: WorldState | null;
  loading: boolean;
  error: string | null;
};

/**
 * Deprecated compatibility hook.
 *
 * Important:
 * - This hook no longer fetches data.
 * - The new explore flow should use `useSimulation()` at the page level.
 * - Returning an inert state is safer than silently running the legacy API path.
 */
export function useSimulationData(): UseSimulationDataResult {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[useSimulationData] Deprecated: use `useSimulation()` from './use-simulation' instead.",
      );
    }
  }, []);

  return {
    entities: null,
    participants: [],
    world: null,
    loading: false,
    error:
      "useSimulationData is deprecated. Migrate this component to use the page-level useSimulation hook.",
  };
}
