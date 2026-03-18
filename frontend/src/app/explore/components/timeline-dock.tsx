import type { MouseEvent as ReactMouseEvent } from "react";
import { cn } from "../lib/arena-math";

type TimelineDockProps = {
  playbackProgress: number;
  displayedRound: number;
  completedRounds: number;
  maxProgress: number;
  isPlaying: boolean;
  isOpen: boolean;
  width: number;
  height: number;
  onToggle: () => void;
  onChange: (nextProgress: number) => void;
  onResizeStart: (event: ReactMouseEvent<HTMLButtonElement>) => void;
};

export function TimelineDock({
  playbackProgress,
  displayedRound,
  completedRounds,
  maxProgress,
  isPlaying,
  isOpen,
  width,
  height,
  onToggle,
  onChange,
  onResizeStart,
}: TimelineDockProps) {
  const livePercent =
    maxProgress <= 0 ? 0 : (playbackProgress / maxProgress) * 100;

  return (
    <div
      className="absolute bottom-4 left-1/2 z-30 -translate-x-1/2"
      style={{ width: isOpen ? `${width}px` : "280px" }}
    >
      <div
        className={cn(
          "relative overflow-hidden border border-white/10 bg-[#0f172acc] shadow-[0_22px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-[height,width,border-radius] duration-200",
          isOpen ? "rounded-[22px]" : "rounded-full",
        )}
        style={{ height: isOpen ? `${height}px` : "56px" }}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60a5fa]">
              Timeline
            </p>
            <p className="mt-1 truncate text-xs text-[#94a3b8]">
              {isPlaying ? "Live playback" : "Manual scrub"} · Position{" "}
              {displayedRound.toFixed(2)} of {completedRounds}
            </p>
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="ml-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[#e2e8f0] transition hover:bg-white/10"
          >
            {isOpen ? "Hide" : "Show"}
          </button>
        </div>

        {isOpen ? (
          <div className="px-4 pb-5">
            <input
              type="range"
              min={0}
              max={maxProgress}
              step={0.001}
              value={playbackProgress}
              onChange={(event) => onChange(Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#3b82f6]"
            />

            <div className="mt-3 flex justify-between text-[11px] text-[#64748b]">
              {Array.from({ length: completedRounds + 1 }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "transition-colors",
                    Math.abs(playbackProgress - index) < 0.5 &&
                      "font-semibold text-[#60a5fa]",
                  )}
                >
                  {index === 0 ? "Start" : index}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-[#94a3b8]">
              <span>Live progress</span>
              <span>{livePercent.toFixed(1)}%</span>
            </div>

            <button
              type="button"
              aria-label="Resize timeline"
              onMouseDown={onResizeStart}
              className="absolute bottom-2 right-2 h-5 w-5 cursor-nwse-resize rounded-sm"
            >
              <span className="absolute bottom-0.5 right-0.5 h-3 w-3 border-b-2 border-r-2 border-[#64748b]" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
