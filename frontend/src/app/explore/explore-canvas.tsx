"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePlayback } from "./hooks/use-playback";
import { useDraggablePanel } from "./hooks/use-draggable-panel";
import { useResizableDock } from "./hooks/use-resizable-dock";
import { getTimelineReservedSpace } from "./lib/arena-math";
import { PlaybackPanel } from "./components/playback-panel";
import { PodiumStage } from "./components/podium-stage";
import { StageBackground } from "./components/stage-background";
import { TimelineDock } from "./components/timeline-dock";
import { ArenaAvatarLayer3D } from "./components/arena-avatar-layer-3d";
import { ArenaLegend } from "./components/arena-legend";
import { useSimulationData } from "./hooks/use-simulation-data";

export function ExploreCanvas() {
  const { entities, participants, world, loading, error } =
    useSimulationData();

  const [selectedEntityId, setSelectedEntityId] = useState<string>();
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);
  const [isPlaybackPanelOpen, setIsPlaybackPanelOpen] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const dock = useResizableDock({
    minHeight: 132,
    maxHeight: 260,
  });

  const safeEntities = entities ?? [];

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
  } = usePlayback({ entities: safeEntities });

  const bottomOffset = getTimelineReservedSpace(
    isTimelineOpen,
    dock.size.height
  );

  const draggable = useDraggablePanel({
    containerRef,
    panelRef,
    reservedBottomSpace: bottomOffset,
    defaultPosition: { x: 24, y: 96 },
  });

  const isReady = !loading && entities && entities.length > 0;

  if (!isReady) {
    return (
      <main className="flex min-h-screen flex-col bg-[#020617] text-[#e2e8f0]">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#64748b]">
                Portfolio Simulation
              </p>
              <h1 className="text-sm font-semibold text-white">
                MUMU Arena (Live)
              </h1>
            </div>
          </div>

          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#e2e8f0] hover:border-white/20 hover:bg-white/10"
          >
            Back to playground
          </Link>
        </header>

        <div className="flex flex-1 items-center justify-center px-6">
          {error ? (
            <p className="text-sm text-[#f97373]">
              Failed to run simulation: {error}
            </p>
          ) : (
            <p className="text-sm text-[#94a3b8]">
              Running portfolio simulation…
            </p>
          )}
        </div>
      </main>
    );
  }

  const dockReservedHeight = isTimelineOpen ? dock.size.height + 32 : 76;

  return (
    <main
      ref={containerRef}
      className="relative flex min-h-screen flex-col bg-[#020617] text-[#e2e8f0]"
    >
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#64748b]">
              Portfolio Simulation
            </p>
            <h1 className="text-sm font-semibold text-white">
              MUMU Arena (Live)
            </h1>
          </div>
        </div>

        <Link
          href="/"
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#e2e8f0] hover:border-white/20 hover:bg-white/10"
        >
          Back to playground
        </Link>
      </header>

      <section className="relative flex flex-1 flex-col overflow-hidden">
        <div className="relative flex-1">
          <StageBackground bottomOffset={bottomOffset} />

          <ArenaAvatarLayer3D
            entities={entities}
            playbackProgress={playbackProgress}
            bottomOffset={bottomOffset}
            isPlaying={isPlaying}
          />

          <PodiumStage
            entities={entities}
            playbackProgress={playbackProgress}
            bottomOffset={bottomOffset}
            isPlaying={isPlaying}
            onSelectEntity={setSelectedEntityId}
            onClearSelection={() => setSelectedEntityId(undefined)}
            selectedEntityId={selectedEntityId}
            displayedRound={displayedRound}
            participants={participants ?? []}
            world={world}
          />

          <ArenaLegend />

          <PlaybackPanel
            panelRef={panelRef}
            position={draggable.position}
            isOpen={isPlaybackPanelOpen}
            onToggle={() => setIsPlaybackPanelOpen((v) => !v)}
            onDragStart={draggable.handleDragStart}
            displayedRound={displayedRound}
            totalRounds={totalRounds}
            entityCount={entities.length}
            isPlaying={isPlaying}
            playbackIntervalMs={roundTravelMs}
            onPrevious={handlePreviousRound}
            onNext={handleNextRound}
            onReset={handleReset}
            onPlay={handlePlay}
            onPause={handlePause}
          />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
            <div className="pointer-events-auto border-t border-white/10 bg-[#020617f2] backdrop-blur-xl">
              <TimelineDock
                playbackProgress={playbackProgress}
                displayedRound={displayedRound}
                totalRounds={totalRounds}
                maxProgress={maxProgress}
                isPlaying={isPlaying}
                isOpen={isTimelineOpen}
                width={dock.size.width}
                height={dock.size.height}
                onToggle={() => setIsTimelineOpen((v) => !v)}
                onChange={handleScrub}
                onResizeStart={dock.handleResizeStart}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
