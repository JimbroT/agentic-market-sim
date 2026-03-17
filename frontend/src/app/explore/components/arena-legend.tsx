"use client";

/**
 * Small collapsible legend/help overlay for the explore arena.
 *
 * This is intentionally self-contained state so it can be toggled without
 * coupling to the main playback controller.
 */
import { useState } from "react";

export function ArenaLegend() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-50">
      {!isOpen ? (
        <button
          type="button"
          aria-label="Show legend"
          onClick={() => setIsOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#0f172acc] text-[#60a5fa] shadow-[0_18px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl transition hover:bg-white/10"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <circle cx="10" cy="10" r="6.5" />
            <path d="M10 8v4" />
            <path d="M10 5.8h.01" />
          </svg>
        </button>
      ) : (
        <div className="w-[260px] overflow-hidden rounded-[20px] border border-white/10 bg-[#0f172acc] shadow-[0_18px_40px_rgba(0,0,0,0.32)] backdrop-blur-xl">
          <div className="flex h-12 items-center justify-between px-3">
            <button
              type="button"
              aria-label="Hide legend"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[#60a5fa] transition hover:bg-white/10"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="10" cy="10" r="6.5" />
                <path d="M10 8v4" />
                <path d="M10 5.8h.01" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-[#e2e8f0] transition hover:bg-white/10"
            >
              Hide
            </button>
          </div>

          <div className="px-4 pb-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#60a5fa]">
              Arena legend
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#4ade80]" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Vertical movement
                  </p>
                  <p className="text-xs text-[#94a3b8]">
                    Higher position means stronger portfolio value.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#60a5fa]" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Horizontal movement
                  </p>
                  <p className="text-xs text-[#94a3b8]">
                    Left-to-right order reflects current ranking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 h-2.5 w-2.5 rounded-full bg-[#facc15]" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Leader effects
                  </p>
                  <p className="text-xs text-[#94a3b8]">
                    Glow and crown highlight the top-ranked entity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
