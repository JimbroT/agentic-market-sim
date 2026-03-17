import type { MouseEvent as ReactMouseEvent, RefObject } from "react";
import { cn } from "../lib/arena-math";
import { ProgressBar } from "./progress-bar";

type PlaybackPanelProps = {
  panelRef: RefObject<HTMLDivElement | null>;
  position: { x: number; y: number };
  isOpen: boolean;
  onToggle: () => void;
  onDragStart: (event: ReactMouseEvent<HTMLDivElement>) => void;
  displayedRound: number;
  totalRounds: number;
  entityCount: number;
  isPlaying: boolean;
  playbackIntervalMs: number;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  onPlay: () => void;
  onPause: () => void;
};

export function PlaybackPanel({
  panelRef,
  position,
  isOpen,
  onToggle,
  onDragStart,
  displayedRound,
  totalRounds,
  entityCount,
  isPlaying,
  playbackIntervalMs,
  onPrevious,
  onNext,
  onReset,
  onPlay,
  onPause,
}: PlaybackPanelProps) {
  return (
    <div
      ref={panelRef}
      className="pointer-events-auto absolute z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div
        className={cn(
          "overflow-hidden border border-white/10 bg-[#0f172acc] shadow-[0_24px_54px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-[width,height,border-radius] duration-200",
          isOpen ? "w-[340px] rounded-[20px]" : "w-[220px] rounded-full"
        )}
      >
        <div
          onMouseDown={onDragStart}
          className="flex cursor-move items-center justify-between px-4 py-3"
        >
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60a5fa]">
              Playback
            </p>
            <p className="mt-1 truncate text-xs text-[#94a3b8]">
              Drag this panel
            </p>
          </div>

          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onClick={onToggle}
            className="ml-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[#e2e8f0] transition hover:bg-white/10"
          >
            {isOpen ? "Hide" : "Show"}
          </button>
        </div>

        {isOpen ? (
          <div className="px-4 pb-4">
            <div className="mb-4 flex items-center gap-2">
              <button
                type="button"
                onClick={onPrevious}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={isPlaying ? onPause : onPlay}
                className="rounded-lg border border-[#60a5fa]/30 bg-[#1d4ed8]/30 px-3 py-2 text-xs text-white hover:bg-[#1d4ed8]/40"
              >
                {isPlaying ? "Pause" : "Play"}
              </button>

              <button
                type="button"
                onClick={onNext}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
              >
                Next
              </button>

              <button
                type="button"
                onClick={onReset}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white hover:bg-white/10"
              >
                Reset
              </button>
            </div>

            <div className="space-y-2 text-sm text-[#cbd5e1]">
              <div className="flex items-center justify-between">
                <span>Current position</span>
                <span className="font-medium text-white">
                  Round {displayedRound.toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Entities</span>
                <span className="font-medium text-white">{entityCount}</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-medium text-white">
                  {isPlaying ? "Playing" : "Paused"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Round travel</span>
                <span className="font-medium text-white">
                  {playbackIntervalMs} ms
                </span>
              </div>
            </div>

            <ProgressBar
              currentRound={displayedRound - 1}
              totalRounds={totalRounds}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
