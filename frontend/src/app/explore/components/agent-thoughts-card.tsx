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
import type { AgentInsight } from "../types";

type CardPosition = {
  x: number;
  y: number;
};

type CardSize = {
  width: number;
  height: number;
};

type AgentThoughtsCardProps = {
  insight?: AgentInsight;
  label: string;
  round: number;
  onClose?: () => void;
  position: CardPosition;
  dragConstraintsRef: RefObject<HTMLDivElement | null>;
  onPositionCommit: (next: CardPosition) => void;
  onMeasure: (size: CardSize) => void;
};

function pct(value?: number) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "—";
}

function pnlLabel(value?: number) {
  if (typeof value !== "number") return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}$${(value * 1000).toFixed(0)}`;
}

function metricLabel(value?: number, digits = 2) {
  return typeof value === "number" ? value.toFixed(digits) : "—";
}

function allocationRows(
  allocation?: AgentInsight["allocation_after"]
): Array<[string, number | undefined]> {
  if (!allocation) return [];

  return [
    ["Cash", allocation.cash],
    ["Bonds", allocation.bonds],
    ["Equities", allocation.equities],
    ["Commodities", allocation.commodities],
    ["Volatility", allocation.volatility],
  ];
}

export function AgentThoughtsCard({
  insight,
  label,
  round,
  onClose,
  position,
  dragConstraintsRef,
  onPositionCommit,
  onMeasure,
}: AgentThoughtsCardProps) {
  const profile = insight?.profile;
  const rows = allocationRows(insight?.allocation_after);
  const controls = useDragControls();
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
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
      whileDrag={{
        scale: 1.01,
      }}
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
            <p className="mt-1 text-sm font-semibold text-white">{label}</p>
            <p className="mt-1 text-xs text-[#94a3b8]">
              {profile?.description ?? "Live round analysis"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-white/5 px-2 py-[2px] text-[10px] font-medium text-[#cbd5e1]">
              Round {round}
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
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-[#cbd5e1]">
            Conviction {pct(profile?.conviction)}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-[#cbd5e1]">
            Risk budget {pct(profile?.riskBudget)}
          </span>
          {profile?.latestAction ? (
            <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-1 text-[10px] text-sky-200">
              Latest {profile.latestAction}
            </span>
          ) : null}
        </div>
      </div>

      <div className="max-h-[calc(72vh-132px)] space-y-4 overflow-y-auto px-4 py-4">
        <section className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
            Profile
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#cbd5e1]">
            <div className="rounded-lg bg-black/20 p-2">
              <p className="text-[10px] text-[#64748b]">Cash</p>
              <p className="mt-1 font-medium text-white">
                {pct(profile?.portfolio.cash)}
              </p>
            </div>
            <div className="rounded-lg bg-black/20 p-2">
              <p className="text-[10px] text-[#64748b]">Bonds</p>
              <p className="mt-1 font-medium text-white">
                {pct(profile?.portfolio.bonds)}
              </p>
            </div>
            <div className="rounded-lg bg-black/20 p-2">
              <p className="text-[10px] text-[#64748b]">Equities</p>
              <p className="mt-1 font-medium text-white">
                {pct(profile?.portfolio.equities)}
              </p>
            </div>
            <div className="rounded-lg bg-black/20 p-2">
              <p className="text-[10px] text-[#64748b]">Volatility</p>
              <p className="mt-1 font-medium text-white">
                {pct(profile?.portfolio.volatility)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
            Round scenario
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#cbd5e1]">
            {insight?.shock_summary ?? "No scenario summary for this round yet."}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-black/20 p-2">
              <p className="text-[10px] text-[#64748b]">Rates</p>
              <p className="mt-1 font-medium text-white">
                {metricLabel(insight?.market_metrics?.rates)}
              </p>
            </div>
            <div className="rounded-lg bg-black/20 p-2">
              <p className="text-[10px] text-[#64748b]">Volatility</p>
              <p className="mt-1 font-medium text-white">
                {metricLabel(insight?.market_metrics?.volatility)}
              </p>
            </div>
            <div className="rounded-lg bg-black/20 p-2">
              <p className="text-[10px] text-[#64748b]">Growth</p>
              <p className="mt-1 font-medium text-white">
                {metricLabel(insight?.market_metrics?.growth)}
              </p>
            </div>
            <div className="rounded-lg bg-black/20 p-2">
              <p className="text-[10px] text-[#64748b]">Sentiment</p>
              <p className="mt-1 font-medium text-white">
                {metricLabel(insight?.market_metrics?.sentiment)}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
            Live thought stream
          </p>
          <p className="mt-2 text-xs leading-relaxed text-[#e2e8f0]">
            {insight?.thought ??
              insight?.rationale ??
              "No detailed thought recorded for this round yet."}
          </p>

          {insight?.key_signals?.length ? (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#64748b]">
                Signals
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#cbd5e1]">
                {insight.key_signals.map((signal) => (
                  <li key={signal}>• {signal}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {insight?.risks?.length ? (
            <div className="mt-3">
              <p className="text-[10px] uppercase tracking-[0.16em] text-[#64748b]">
                Risks seen
              </p>
              <ul className="mt-2 space-y-1 text-xs text-[#cbd5e1]">
                {insight.risks.map((risk) => (
                  <li key={risk}>• {risk}</li>
                ))}
              </ul>
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
                {insight?.action ?? "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>PnL delta</span>
              <span
                className={cn(
                  "font-medium",
                  (insight?.pnl_delta ?? 0) > 0 && "text-[#4ade80]",
                  (insight?.pnl_delta ?? 0) < 0 && "text-[#f87171]",
                  (insight?.pnl_delta ?? 0) === 0 && "text-white"
                )}
              >
                {pnlLabel(insight?.pnl_delta)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Portfolio after</span>
              <span className="font-medium text-white">
                {typeof insight?.portfolio_total_after === "number"
                  ? `$${(insight.portfolio_total_after * 1000).toFixed(0)}`
                  : "—"}
              </span>
            </div>
          </div>

          {insight?.rationale ? (
            <p className="mt-3 text-xs leading-relaxed text-[#e2e8f0]">
              {insight.rationale}
            </p>
          ) : null}
        </section>

        {rows.length ? (
          <section className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
              Allocation after
            </p>

            <div className="mt-3 space-y-2">
              {rows.map(([rowLabel, value]) => (
                <div key={rowLabel}>
                  <div className="mb-1 flex items-center justify-between text-[11px] text-[#cbd5e1]">
                    <span>{rowLabel}</span>
                    <span>{pct(value)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-400"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, (value ?? 0) * 100)
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
