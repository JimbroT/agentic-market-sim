/**
 * frontend/src/app/explore/components/prompt-entry-screen.tsx
 *
 * Entry screen shown before a simulation has been initialized.
 *
 * This component is responsible for:
 * 1. Letting the user author the initial scenario prompt,
 * 2. Triggering simulation initialization,
 * 3. Displaying any loading or error state from the page-level hook.
 *
 * Why this file matters:
 * - It replaces the old hardcoded prompt flow.
 * - It gives the explore route a proper "start" state before the arena loads.
 */

"use client";

import { useState } from "react";

type PromptEntryScreenProps = {
  loading: boolean;
  error: string | null;
  onSubmit: (prompt: string) => Promise<void> | void;
};

export function PromptEntryScreen({
  loading,
  error,
  onSubmit,
}: PromptEntryScreenProps) {
  const [prompt, setPrompt] = useState("");

  async function handleSubmit() {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    await onSubmit(trimmed);
  }

  return (
    <main className="min-h-screen bg-[#020617] text-[#e2e8f0]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16">
        <div className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#64748b]">
            Portfolio Simulation
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white">
            Start a new market scenario
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#94a3b8]">
            Describe the macro setup you want the 8 agents to start from. For
            example: “Late-cycle economy, sticky inflation, fragile banks, and a
            hawkish Fed.” Once initialized, you can add one user-authored event
            per round.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <label
            htmlFor="scenario-prompt"
            className="mb-3 block text-sm font-medium text-white"
          >
            Scenario prompt
          </label>

          <textarea
            id="scenario-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter the initial market scenario..."
            className="min-h-[180px] w-full rounded-2xl border border-white/10 bg-[#0f172a] px-4 py-3 text-sm text-[#e2e8f0] outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
          />

          {error ? (
            <p className="mt-4 text-sm text-[#f87171]">{error}</p>
          ) : (
            <p className="mt-4 text-xs text-[#64748b]">
              Tip: keep the initial scenario broad, then use round events for
              specific shocks like “bank failure” or “oil spike.”
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-xs text-[#64748b]">
              The simulation will initialize first, then rounds will be added
              interactively.
            </p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Initializing..." : "Run Simulation"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
