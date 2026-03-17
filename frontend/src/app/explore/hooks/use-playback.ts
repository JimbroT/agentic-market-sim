"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PortfolioEntity } from "../types";

type UsePlaybackArgs = {
  entities: PortfolioEntity[];
};

/**
 * Time in ms for one full round-to-round transition.
 * This should feel smooth, readable, and not sluggish.
 */
const ROUND_TRAVEL_MS = 3000;

/**
 * Animation frame stepper for continuous playback progress.
 */
export function usePlayback({ entities }: UsePlaybackArgs) {
  const totalRounds = useMemo(
    () => entities[0]?.roundValues.length ?? 0,
    [entities]
  );

  const maxProgress = Math.max(totalRounds - 1, 0);

  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const animationFrameRef = useRef<number | null>(null);
  const previousTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      previousTimestampRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    function tick(timestamp: number) {
      if (previousTimestampRef.current == null) {
        previousTimestampRef.current = timestamp;
      }

      const deltaMs = timestamp - previousTimestampRef.current;
      previousTimestampRef.current = timestamp;

      setPlaybackProgress((previous) => {
        const next = previous + deltaMs / ROUND_TRAVEL_MS;

        if (next >= maxProgress) {
          setIsPlaying(false);
          return maxProgress;
        }

        return next;
      });

      animationFrameRef.current = requestAnimationFrame(tick);
    }

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, maxProgress]);

  function handleNextRound() {
    setIsPlaying(false);
    setPlaybackProgress((previous) => Math.min(Math.ceil(previous + 0.001), maxProgress));
  }

  function handlePreviousRound() {
    setIsPlaying(false);
    setPlaybackProgress((previous) => Math.max(Math.floor(previous - 0.001), 0));
  }

  function handleReset() {
    setIsPlaying(false);
    setPlaybackProgress(0);
  }

  function handlePlay() {
    if (playbackProgress >= maxProgress) {
      setPlaybackProgress(0);
    }

    setIsPlaying(true);
  }

  function handlePause() {
    setIsPlaying(false);
  }

  function handleScrub(nextProgress: number) {
    setIsPlaying(false);
    setPlaybackProgress(Math.min(Math.max(nextProgress, 0), maxProgress));
  }

  const currentRound = Math.floor(playbackProgress);
  const displayedRound = playbackProgress + 1;

  return {
    playbackProgress,
    currentRound,
    displayedRound,
    totalRounds,
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
