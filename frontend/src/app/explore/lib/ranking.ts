import type { PortfolioEntity, RankedEntity } from "../types";

/**
 * Safely read a value for a specific integer round.
 */
export function getEntityValue(entity: PortfolioEntity, roundIndex: number) {
  return entity.roundValues[roundIndex] ?? entity.startingBalance;
}

/**
 * Convert current-vs-start into a compact signed label.
 */
export function formatSignedDelta(current: number, starting: number) {
  const delta = current - starting;

  if (delta > 0) return `+${delta.toFixed(0)}`;
  if (delta < 0) return `${delta.toFixed(0)}`;
  return "0";
}

/**
 * Interpolate a portfolio value at any fractional playback progress.
 * Example: progress 1.5 = halfway between round 2 and round 3 values.
 */
export function getInterpolatedEntityValue(
  entity: PortfolioEntity,
  playbackProgress: number
) {
  const maxIndex = Math.max(entity.roundValues.length - 1, 0);
  const clamped = Math.min(Math.max(playbackProgress, 0), maxIndex);

  const lowerIndex = Math.floor(clamped);
  const upperIndex = Math.min(lowerIndex + 1, maxIndex);
  const t = clamped - lowerIndex;

  const lowerValue = getEntityValue(entity, lowerIndex);
  const upperValue = getEntityValue(entity, upperIndex);

  return lowerValue + (upperValue - lowerValue) * t;
}

/**
 * Rank entities at a continuous progress point.
 * Horizontal placement should reflect live interpolated values,
 * not only whole-number rounds.
 */
export function getRankedEntitiesAtProgress(
  entities: PortfolioEntity[],
  playbackProgress: number
): RankedEntity[] {
  return [...entities]
    .map((entity) => ({
      ...entity,
      currentValue: getInterpolatedEntityValue(entity, playbackProgress),
      rank: 0,
    }))
    .sort((a, b) => b.currentValue - a.currentValue)
    .map((entity, index) => ({
      ...entity,
      rank: index,
    }));
}
