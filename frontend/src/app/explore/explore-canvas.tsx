"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { demoEntities } from "./data/demo-entities";
import { usePlayback } from "./hooks/use-playback";
import { useDraggablePanel } from "./hooks/use-draggable-panel";
import { useResizableDock } from "./hooks/use-resizable-dock";
import { getTimelineReservedSpace, cn } from "./lib/arena-math";
import { PlaybackPanel } from "./components/playback-panel";
import { PodiumStage } from "./components/podium-stage";
import { StageBackground } from "./components/stage-background";
import { TimelineDock } from "./components/timeline-dock";
import { ArenaAvatarLayer3D } from "./components/arena-avatar-layer-3d";
import { ArenaLegend } from "./components/arena-legend";

export default function ExploreCanvas() {
  const containerRef = useRef<HTMLElement | null>(null);
  const playbackPanelRef = useRef<HTMLDivElement | null>(null);

  const entities = useMemo(() => demoEntities, []);

  const {
    playbackProgress,
    displayedRound,
    totalRounds,
    maxProgress,
    isPlaying,
    roundTravelMs,
    handleNextRound,
    handlePreviousRound,
    handleReset,
    handlePlay,
    handlePause,
    handleScrub,
  } = usePlayback({
    entities,
  });

  const [isPlaybackOpen, setIsPlaybackOpen] = useState(true);
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);

  const {
    size: timelineSize,
    resizeState,
    handleResizeStart,
  } = useResizableDock();

  const timelineReservedSpace = getTimelineReservedSpace(
    isTimelineOpen,
    timelineSize.height
  );

  const {
    position: playbackPosition,
    dragState,
    handleDragStart,
  } = useDraggablePanel({
    containerRef,
    panelRef: playbackPanelRef,
    reservedBottomSpace: timelineReservedSpace,
    defaultPosition: { x: 16, y: 110 },
  });

  return (
    <main
      className={cn(
        "h-screen overflow-hidden bg-[#020617] text-[#f8fafc]",
        (dragState || resizeState) && "select-none"
      )}
    >
      <header className="flex h-14 items-center justify-between border-b border-white/10 bg-[#020617]/82 px-4 backdrop-blur-xl">
        <Link
          href="/"
          className="text-[15px] font-semibold tracking-[0.12em] text-white"
        >
          MUMU
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-white">Explore</span>
          <span className="hidden text-sm text-[#94a3b8] sm:inline">
            Mascot podium playback
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePreviousRound}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#cbd5e1] shadow-sm transition hover:bg-white/10"
          >
            Previous
          </button>

          {!isPlaying ? (
            <button
              type="button"
              onClick={handlePlay}
              className="rounded-xl bg-[#2563eb] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#1d4ed8]"
            >
              Play
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePause}
              className="rounded-xl bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#7c3aed]"
            >
              Pause
            </button>
          )}

          <button
            type="button"
            onClick={handleNextRound}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#cbd5e1] shadow-sm transition hover:bg-white/10"
          >
            Next
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#cbd5e1] shadow-sm transition hover:bg-white/10"
          >
            Reset
          </button>
        </div>
      </header>

      <section
        ref={containerRef}
        className="relative h-[calc(100vh-56px)] overflow-hidden"
      >
        <StageBackground bottomOffset={timelineReservedSpace} />

        <div className="absolute left-4 top-4 z-20 max-w-[420px]">
            <p className="text-lg font-medium text-white">
                Portfolio Mascot Arena
            </p>

            <p className="mt-2 text-sm text-[#94a3b8]">
                Live simulation playback across ranked portfolio entities.
            </p>
        </div>

        <ArenaLegend />


        <ArenaAvatarLayer3D
            entities={entities}
            playbackProgress={playbackProgress}
            maxProgress={maxProgress}
            bottomOffset={timelineReservedSpace}
            isPlaying={isPlaying}
        />

        <PodiumStage
            entities={entities}
            playbackProgress={playbackProgress}
            bottomOffset={timelineReservedSpace}
            isPlaying={isPlaying}
        />

        <PlaybackPanel
          panelRef={playbackPanelRef}
          position={playbackPosition}
          isOpen={isPlaybackOpen}
          onToggle={() => setIsPlaybackOpen((previous) => !previous)}
          onDragStart={handleDragStart}
          displayedRound={displayedRound}
          totalRounds={totalRounds}
          entityCount={entities.length}
          isPlaying={isPlaying}
          playbackIntervalMs={roundTravelMs}
        />

        <TimelineDock
          playbackProgress={playbackProgress}
          displayedRound={displayedRound}
          totalRounds={totalRounds}
          maxProgress={maxProgress}
          isPlaying={isPlaying}
          isOpen={isTimelineOpen}
          width={timelineSize.width}
          height={timelineSize.height}
          onToggle={() => setIsTimelineOpen((previous) => !previous)}
          onChange={handleScrub}
          onResizeStart={handleResizeStart}
        />
      </section>
    </main>
  );
}
