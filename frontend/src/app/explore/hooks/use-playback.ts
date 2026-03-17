"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PortfolioEntity } from "../types";

type UsePlaybackArgs = {
  entities: PortfolioEntity[];
};

const ROUND_TRAVEL_MS = 3000;

export function usePlayback({ entities }: UsePlaybackArgs) {
  // entities[0].roundValues = [start, round1, round2, round3]
  const totalRounds = useMemo(
    () => entities[0]?.roundValues.length ?? 0,
    [entities]
  );

  // internal domain 0..(totalRounds - 1) → 0..3
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
    setPlaybackProgress((previous) =>
      Math.min(Math.floor(previous + 1), maxProgress)
    );
  }

  function handlePreviousRound() {
    setIsPlaying(false);
    setPlaybackProgress((previous) =>
      Math.max(Math.ceil(previous - 1), 0)
    );
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
    setPlaybackProgress(
      Math.min(Math.max(nextProgress, 0), maxProgress)
    );
  }

  const continuousRound = playbackProgress;      // 0..3
  const currentRound = Math.floor(continuousRound);
  const displayedRound = continuousRound;

  // UI: 1..4 label space (so you can show "Round 1.00 of 4")
  const uiRound = displayedRound + 1;            // 1..4
  const uiRoundTotal = maxProgress + 1;          // 4

  return {
    playbackProgress,
    currentRound,
    displayedRound,
    uiRound,
    uiRoundTotal,
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
