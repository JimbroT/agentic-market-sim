"use client";

import {
  motion,
  useDragControls,
  type PanInfo,
} from "framer-motion";
import {
  useLayoutEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { cn } from "../lib/arena-math";
import { mapAgentInsightToCardViewModel } from "../lib/map-agent-insight-to-card-view-model";
import type {
  Participant,
  WorldState,
} from "../hooks/use-simulation-data";

type CardPosition = {
  x: number;
  y: number;
};

type CardSize = {
  width: number;
  height: number;
};

type ParticipantMemoryEntry = Participant["memory"][number];

type LiveMetrics = {
  portfolioBefore: number;
  portfolioAfter: number;
  pnlDelta: number;
};

type AgentThoughtsCardProps = {
  participant: Participant;
  memoryEntry?: ParticipantMemoryEntry;
  world?: WorldState;
  label: string;
  round: number;
  liveMetrics?: LiveMetrics;
  onClose?: () => void;
  position: CardPosition;
  dragConstraintsRef: RefObject<HTMLDivElement | null>;
  onPositionCommit: (next: CardPosition) => void;
  onMeasure: (size: CardSize) => void;
};

function badgeClassName(
  tone: "neutral" | "positive" | "negative" | "info"
) {
  switch (tone) {
    case "positive":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "negative":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    case "info":
      return "border-sky-400/20 bg-sky-400/10 text-sky-200";
    default:
      return "border-white/10 bg-white/5 text-[#cbd5e1]";
  }
}

export function AgentThoughtsCard({
  participant,
  memoryEntry,
  world,
  label,
  round,
  liveMetrics,
  onClose,
  position,
  dragConstraintsRef,
  onPositionCommit,
  onMeasure,
}: AgentThoughtsCardProps) {
  const controls = useDragControls();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const view = mapAgentInsightToCardViewModel(
    participant,
    memoryEntry,
    world,
    label,
    round,
    liveMetrics
  );

  useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const measure = () => {
      onMeasure({
        width: element.offsetWidth,
        height: element.offsetHeight,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [onMeasure]);

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    controls.start(event);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    onPositionCommit({
      x: position.x + info.offset.x,
      y: position.y + info.offset.y,
    });
  };

  return (
    <motion.div
      ref={rootRef}
      drag
      dragListener={false}
      dragControls={controls}
      dragConstraints={dragConstraintsRef}
      dragMomentum={false}
      dragElastic={0.04}
      onDragEnd={handleDragEnd}
      initial={false}
      style={{
        left: position.x,
        top: position.y,
      }}
      whileDrag={{ scale: 1.01 }}
      className="absolute z-30 w-[360px] max-h-[72vh] overflow-hidden rounded-2xl border border-white/10 bg-[#020617]/95 shadow-[0_18px_40px_rgba(0,0,0,0.6)] backdrop-blur-md"
    >
      <div
        onPointerDown={startDrag}
        className="sticky top-0 z-10 cursor-grab border-b border-white/10 bg-[#020617]/95 px-4 py-4 active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
              Agent thoughts
            </p>
            <p className="mt-1 text-sm font-semibold text-white">
              {view.header.name}
            </p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              {view.header.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/5 px-2 py-[2px] text-[10px] font-medium text-[#cbd5e1]">
              {view.header.roundLabel}
            </span>
            <button
              type="button"
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
              className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-[#cbd5e1] hover:bg-white/10"
              aria-label="Close agent thoughts"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {view.header.badges.map((badge) => (
            <span
              key={badge.label}
              className={cn(
                "rounded-full border px-2 py-1 text-[10px]",
                badgeClassName(badge.tone)
              )}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      <div className="max-h-[calc(72vh-132px)] space-y-4 overflow-y-auto px-4 py-4">
        <section className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
            Profile
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#cbd5e1]">
            {view.profile.tiles.map((tile) => (
              <div key={tile.label} className="rounded-lg bg-black/20 p-2">
                <p className="text-[10px] text-[#64748b]">
                  {tile.label}
                </p>
                <p className="mt-1 font-medium text-white">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
            Round scenario
          </p>

          <p className="mt-2 text-xs leading-relaxed text-[#cbd5e1]">
            {view.scenario.summary}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {view.scenario.tiles.map((tile) => (
              <div key={tile.label} className="rounded-lg bg-black/20 p-2">
                <p className="text-[10px] text-[#64748b]">
                  {tile.label}
                </p>
                <p className="mt-1 font-medium text-white">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
            Live thought stream
          </p>

          <p className="mt-2 text-xs leading-relaxed text-[#e2e8f0]">
            {view.thought.text}
          </p>

          {view.thought.thesis ? (
            <div className="mt-3 rounded-lg border border-sky-400/20 bg-sky-400/10 p-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-sky-200">
                Thesis
              </p>
              <p className="mt-1 text-xs leading-relaxed text-sky-50">
                {view.thought.thesis}
              </p>
            </div>
          ) : null}

          {view.thought.signals.length ? (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#64748b]">
                Signals
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#cbd5e1]">
                {view.thought.signals.map((signal) => (
                  <li key={signal}>• {signal}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {view.thought.risks.length ? (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#64748b]">
                Risks seen
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#cbd5e1]">
                {view.thought.risks.map((risk) => (
                  <li key={risk}>• {risk}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {view.thought.rejectedAlternatives.length ? (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#64748b]">
                Rejected alternatives
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#cbd5e1]">
                {view.thought.rejectedAlternatives.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {view.thought.expectedNextMove ? (
            <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#64748b]">
                Expected next move
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#e2e8f0]">
                {view.thought.expectedNextMove}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
            Decision
          </p>

          <div className="mt-2 space-y-2 text-xs text-[#cbd5e1]">
            <div className="flex items-center justify-between">
              <span>Action</span>
              <span className="font-medium text-white">
                {view.decision.action}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>PnL delta</span>
              <span
                className={cn(
                  "font-medium",
                  view.decision.pnlTone === "positive" && "text-[#4ade80]",
                  view.decision.pnlTone === "negative" && "text-[#f87171]",
                  view.decision.pnlTone === "neutral" && "text-white"
                )}
              >
                {view.decision.pnlLabel}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Portfolio before</span>
              <span className="font-medium text-white">
                {view.decision.portfolioBeforeLabel}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span>Portfolio after</span>
              <span className="font-medium text-white">
                {view.decision.portfolioAfterLabel}
              </span>
            </div>
          </div>

          {view.decision.rationale ? (
            <p className="mt-3 text-xs leading-relaxed text-[#e2e8f0]">
              {view.decision.rationale}
            </p>
          ) : null}
        </section>

        {view.allocation.rows.length ? (
          <section className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
              Allocation after
            </p>

            <div className="mt-3 space-y-2">
              {view.allocation.rows.map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[#cbd5e1]">
                    <span>{row.label}</span>
                    <span>{row.displayValue}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-400"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, row.value * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </motion.div>
  );
}
