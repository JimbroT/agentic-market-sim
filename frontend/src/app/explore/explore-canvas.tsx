"use client";

import { useEffect, useRef, useState } from "react";
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
import { AddRoundPanel } from "./components/add-round-panel";
import type { PortfolioEntity } from "./types";
import type {
  AgentInsight,
  Participant,
  WorldState,
} from "./hooks/use-simulation";

type ExploreCanvasProps = {
  entities: PortfolioEntity[] | null;
  participants: Participant[];
  world: WorldState | null;
  latestAgentInsights: AgentInsight[];
  loading: boolean;
  error: string | null;
  onAddRound: (userEvent: string) => Promise<void>;
};

type NotificationState = {
  title: string;
  message: string;
} | null;

export function ExploreCanvas({
  entities,
  participants,
  world,
  latestAgentInsights,
  loading,
  error,
  onAddRound,
}: ExploreCanvasProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string>();
  const [isTimelineOpen, setIsTimelineOpen] = useState(true);
  const [isPlaybackPanelOpen, setIsPlaybackPanelOpen] = useState(true);
  const [isAddRoundOpen, setIsAddRoundOpen] = useState(true);
  const [notification, setNotification] = useState<NotificationState>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const hasMountedRoundsRef = useRef(false);
  const prevTotalRoundsRef = useRef(0);

  const dock = useResizableDock({
    minHeight: 132,
    maxHeight: 260,
  });

  const stageEntities = entities ?? [];

  const {
    playbackProgress,
    displayedRound,
    timelinePointCount,
    completedRounds,
    maxProgress,
    isPlaying,
    roundTravelMs,
    handleNextRound,
    handlePreviousRound,
    handleReset,
    handlePlay,
    handlePause,
    handleScrub,
  } = usePlayback({ entities: stageEntities });
  

  const bottomOffset = getTimelineReservedSpace(
    isTimelineOpen,
    dock.size.height,
  );

  const draggable = useDraggablePanel({
    containerRef,
    panelRef,
    reservedBottomSpace: bottomOffset,
    defaultPosition: { x: 24, y: 96 },
  });

  async function handleAddRound(userEvent: string) {
    try {
      await onAddRound(userEvent);
      setIsAddRoundOpen(false);
    } catch {
      setIsAddRoundOpen(true);
    }
  }

  useEffect(() => {
    if (!hasMountedRoundsRef.current) {
      hasMountedRoundsRef.current = true;
      prevTotalRoundsRef.current = timelinePointCount;
      return;
    }
  
    if (timelinePointCount > prevTotalRoundsRef.current) {
      const previousTimelinePointCount = prevTotalRoundsRef.current;
      const previousMaxProgress = Math.max(previousTimelinePointCount - 1, 0);
      const completedRound =
        world?.current_round ?? Math.max(timelinePointCount - 1, 0);
  
      setNotification({
        title: `Round ${completedRound} complete`,
        message: `Playback now includes ${completedRounds} completed rounds.`,
      });
  
      setIsAddRoundOpen(false);
  
      handlePause();
      handleScrub(previousMaxProgress);
  
      const timer = window.setTimeout(() => {
        handlePlay();
      }, 120);
  
      prevTotalRoundsRef.current = timelinePointCount;
      return () => window.clearTimeout(timer);
    }
  
    prevTotalRoundsRef.current = timelinePointCount;
  }, [
    timelinePointCount,
    completedRounds,
    world?.current_round,
    handlePause,
    handlePlay,
    handleScrub,
  ]);
  

  const isReady = !loading && !!world && stageEntities.length > 0;

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
            <p className="mt-1 text-xs text-[#64748b]">
              {world?.scenario_prompt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#94a3b8] md:block">
            Regime: {world?.regime ?? "neutral"} • Round {world?.current_round ?? 0}
          </div>

          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[#e2e8f0] hover:border-white/20 hover:bg-white/10"
          >
            Back to playground
          </Link>
        </div>
      </header>

      {notification ? (
        <div className="pointer-events-none absolute right-6 top-24 z-50">
          <div className="pointer-events-auto w-[320px] rounded-2xl border border-sky-400/20 bg-[#020617f2] p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">
                  {notification.title}
                </p>
                <p className="mt-1 text-xs leading-6 text-[#94a3b8]">
                  {notification.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setNotification(null)}
                className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-[#cbd5e1] hover:bg-white/10"
                aria-label="Dismiss notification"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="relative flex flex-1 flex-col overflow-hidden">
        <div className="relative flex-1">
          <StageBackground bottomOffset={bottomOffset} />

          <ArenaAvatarLayer3D
            entities={stageEntities}
            playbackProgress={playbackProgress}
            bottomOffset={bottomOffset}
            isPlaying={isPlaying}
          />

          <PodiumStage
            entities={stageEntities}
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
            totalRounds={completedRounds}
            entityCount={stageEntities.length}
            isPlaying={isPlaying}
            playbackIntervalMs={roundTravelMs}
            onPrevious={handlePreviousRound}
            onNext={handleNextRound}
            onReset={handleReset}
            onPlay={handlePlay}
            onPause={handlePause}
          />

          <div
            className="pointer-events-none absolute inset-x-0 z-30 px-6"
            style={{ bottom: dockReservedHeight + 20 }}
          >
            <div className="mx-auto">
              {isAddRoundOpen ? (
                <AddRoundPanel
                  currentRound={world?.current_round ?? 0}
                  loading={loading}
                  error={error}
                  onSubmit={handleAddRound}
                />
              ) : (
                <div className="pointer-events-auto flex justify-center">
                  <button
                    type="button"
                    onClick={() => setIsAddRoundOpen(true)}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-[#020617f2] px-5 py-2.5 text-sm font-medium text-[#e2e8f0] shadow-xl backdrop-blur-xl transition hover:border-white/20 hover:bg-white/10"
                  >
                    Add Next Round
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40">
            <div className="pointer-events-auto border-t border-white/10 bg-[#020617f2] backdrop-blur-xl">
              <TimelineDock
              playbackProgress={playbackProgress}
              displayedRound={displayedRound}
              completedRounds={completedRounds}
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
