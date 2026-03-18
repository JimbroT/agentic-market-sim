/**
 * frontend/src/app/explore/components/add-round-panel.tsx
 *
 * Small control panel used to append a new round to an active simulation.
 *
 * This component is responsible for:
 * 1. Collecting the user's round event,
 * 2. Calling the provided addRound handler,
 * 3. Displaying round-specific loading and error state.
 *
 * Why this file matters:
 * - It turns the simulation into an interactive round-by-round experience.
 * - It keeps round submission UI separate from the arena rendering logic.
 */

"use client";

import { useState } from "react";

type AddRoundPanelProps = {
  currentRound: number;
  loading: boolean;
  error: string | null;
  onSubmit: (userEvent: string) => Promise<void> | void;
};

export function AddRoundPanel({
  currentRound,
  loading,
  error,
  onSubmit,
}: AddRoundPanelProps) {
  const [userEvent, setUserEvent] = useState("");

  async function handleSubmit() {
    const trimmed = userEvent.trim();
    if (!trimmed || loading) return;

    await onSubmit(trimmed);
    setUserEvent("");
  }

  return (
    <div className="pointer-events-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-[#020617f2] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#64748b]">
            Next Round
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Add event for round {currentRound + 1}
          </h2>
        </div>

        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#94a3b8]">
          Current round: {currentRound}
        </div>
      </div>

      <textarea
        value={userEvent}
        onChange={(e) => setUserEvent(e.target.value)}
        placeholder='Example: "Regional bank failure, credit spreads widen, investors rush into bonds."'
        className="min-h-[112px] w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-[#e2e8f0] outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
      />

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-[#64748b]">
          This event advances the simulation by exactly one round.
          {error ? (
            <p className="mt-2 text-sm text-[#f87171]">{error}</p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || !userEvent.trim()}
          className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Running Round..." : "Run Round"}
        </button>
      </div>
    </div>
  );
}
