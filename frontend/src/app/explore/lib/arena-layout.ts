import { getInterpolatedEntityValue, getRankedEntitiesAtProgress } from "./ranking";
import type { PortfolioEntity } from "../types";

export type ArenaLayoutEntity = {
  id: string;
  label: string;
  color: string;
  accent: string;
  avatarUrl?: string;
  startingBalance: number;
  currentValue: number;
  rank: number;
  leader: boolean;
  movedUp: boolean;
  movedDown: boolean;
  xPercent: number;
  bottomPx: number;
  podiumHeight: number;
};

export const AVATAR_CENTER_OFFSET_PX = 116;

/**
 * Shared arena layout math for both DOM podiums and the shared 3D layer.
 *
 * Tuning notes:
 * - Reduce yTravel so top-ranked entities do not push out of frame.
 * - Raise bottomBase slightly less aggressively.
 * - Keep podium height variation, but make it a bit tighter.
 */
export function getArenaLayoutAtProgress(
  entities: PortfolioEntity[],
  playbackProgress: number,
  bottomOffset: number
): ArenaLayoutEntity[] {
  const ranked = getRankedEntitiesAtProgress(entities, playbackProgress);
  const currentValues = ranked.map((entity) => entity.currentValue);
  const minValue = Math.min(...currentValues);
  const maxValue = Math.max(...currentValues);
  const laneSpacing = 100 / entities.length;

  return ranked.map((entity) => {
    const previousValue =
      playbackProgress > 0
        ? getInterpolatedEntityValue(entity, Math.max(playbackProgress - 0.06, 0))
        : entity.startingBalance;

    const normalizedY =
      maxValue === minValue
        ? 0.5
        : (entity.currentValue - minValue) / (maxValue - minValue);

    const xPercent = laneSpacing * entity.rank + laneSpacing / 2;

    /**
     * Reduced vertical travel so the leader stays visible.
     */
    const yTravel = normalizedY * 170;

    /**
     * Slightly lower base keeps the whole stack inside the viewport.
     */
    const bottomBase = bottomOffset + 34;

    /**
     * Keep podium variation, but reduce the total height range.
     */
    const podiumHeight = 52 + normalizedY * 30;

    return {
      id: entity.id,
      label: entity.label,
      color: entity.color,
      accent: entity.accent,
      avatarUrl: entity.avatarUrl,
      startingBalance: entity.startingBalance,
      currentValue: entity.currentValue,
      rank: entity.rank,
      leader: entity.rank === 0,
      movedUp: entity.currentValue > previousValue + 0.05,
      movedDown: entity.currentValue < previousValue - 0.05,
      xPercent,
      bottomPx: bottomBase + yTravel,
      podiumHeight,
    };
  });
}
