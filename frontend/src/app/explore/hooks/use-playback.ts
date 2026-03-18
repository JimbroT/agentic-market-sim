"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PortfolioEntity } from "../types";

type UsePlaybackArgs = {
  entities: PortfolioEntity[];
};

const ROUND_TRAVEL_MS = 3000;

export function usePlayback({ entities }: UsePlaybackArgs) {
  const timelinePointCount = useMemo(
    () => entities[0]?.roundValues.length ?? 0,
    [entities],
  );

  const completedRounds = Math.max(timelinePointCount - 1, 0);
  const maxProgress = completedRounds;

  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    setPlaybackProgress((previous) => Math.min(previous, maxProgress));
  }, [maxProgress]);

  useEffect(() => {
    if (!isPlaying || maxProgress <= 0) {
      previousTimestampRef.current = null;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      return;
    }

    let cancelled = false;

    function tick(timestamp: number) {
      if (cancelled) return;

      if (previousTimestampRef.current == null) {
        previousTimestampRef.current = timestamp;
      }

      const deltaMs = timestamp - previousTimestampRef.current;
      previousTimestampRef.current = timestamp;

      setPlaybackProgress((previous) => {
        const next = previous + deltaMs / ROUND_TRAVEL_MS;

        if (next >= maxProgress) {
          cancelled = true;
          setIsPlaying(false);
          return maxProgress;
        }

        return next;
      });

      if (!cancelled) {
        animationFrameRef.current = requestAnimationFrame(tick);
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      previousTimestampRef.current = null;

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, maxProgress]);

  const handleNextRound = useCallback(() => {
    setIsPlaying(false);
    previousTimestampRef.current = null;
    setPlaybackProgress((previous) =>
      Math.min(Math.floor(previous) + 1, maxProgress),
    );
  }, [maxProgress]);

  const handlePreviousRound = useCallback(() => {
    setIsPlaying(false);
    previousTimestampRef.current = null;
    setPlaybackProgress((previous) =>
      Math.max(Math.ceil(previous) - 1, 0),
    );
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    previousTimestampRef.current = null;
    setPlaybackProgress(0);
  }, []);

  const handlePlay = useCallback(() => {
    previousTimestampRef.current = null;

    setPlaybackProgress((previous) => {
      if (previous >= maxProgress) {
        return Math.max(maxProgress - 1, 0);
      }
      return previous;
    });

    if (maxProgress > 0) {
      setIsPlaying(true);
    }
  }, [maxProgress]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    previousTimestampRef.current = null;
  }, []);

  const handleScrub = useCallback(
    (nextProgress: number) => {
      setIsPlaying(false);
      previousTimestampRef.current = null;
      setPlaybackProgress(Math.min(Math.max(nextProgress, 0), maxProgress));
    },
    [maxProgress],
  );

  const currentRound = Math.floor(playbackProgress);
  const displayedRound = playbackProgress;

  return {
    playbackProgress,
    currentRound,
    displayedRound,
    timelinePointCount,
    completedRounds,
    maxProgress,
    isPlaying,
    roundTravelMs: ROUND_TRAVEL_MS,
    handleNextRound,
    handlePreviousRound,
    handleReset,
    handlePlay,
    handlePause,
    handleScrub,
  };
}
