"use client";

/**
 * DOM-based podium layer for the explore arena.
 */
import { motion, type Transition } from "framer-motion";
import { cn } from "../lib/arena-math";
import { getArenaLayoutAtProgress } from "../lib/arena-layout";
import type { PortfolioEntity, AgentInsight } from "../types";

type PodiumStageProps = {
  entities: PortfolioEntity[];
  playbackProgress: number;
  bottomOffset: number;
  isPlaying: boolean;
  onSelectEntity?: (id: string) => void;
  onClearSelection?: () => void;
  selectedEntityId?: string;
  displayedRound?: number;
  agentInsights?: AgentInsight[];
};

const spring: Transition = {
  type: "spring",
  stiffness: 82,
  damping: 22,
  mass: 1.15,
};

const CURRENCY_FORMAT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatPortfolioBalance(valueIndex: number): string {
  const notional = valueIndex * 1000;
  return CURRENCY_FORMAT.format(notional);
}

function formatPnL(
  currentIndex: number,
  baseIndex = 100
): { label: string; positive: boolean; negative: boolean } {
  const deltaIndex = currentIndex - baseIndex;
  const notionalDelta = deltaIndex * 1000;
  const positive = notionalDelta > 0;
  const negative = notionalDelta < 0;
  const absFormatted = CURRENCY_FORMAT.format(Math.abs(notionalDelta));
  const signPrefix = positive ? "+" : negative ? "-" : "";
  return {
    label: `PnL: ${signPrefix}${absFormatted}`,
    positive,
    negative,
  };
}

export function PodiumStage({
  entities,
  playbackProgress,
  bottomOffset,
  isPlaying,
  onSelectEntity,
  onClearSelection,
  selectedEntityId,
  displayedRound,
  agentInsights,
}: PodiumStageProps) {
  const layout = getArenaLayoutAtProgress(
    entities,
    playbackProgress,
    bottomOffset
  );

  const selectedLayout = layout.find(
    (entity) => entity.id === selectedEntityId
  );

  const selectedInsight =
    selectedEntityId && typeof displayedRound === "number"
      ? agentInsights?.find(
          (row) =>
            row.participant_id === selectedEntityId &&
            row.round === displayedRound
        )
      : undefined;

  return (
    <div className="absolute inset-0 z-20">
      {layout.map((entity) => {
        const balanceLabel = formatPortfolioBalance(entity.currentValue);
        const pnl = formatPnL(entity.currentValue, entity.startingBalance);

        return (
          <motion.div
            key={entity.id}
            className="absolute will-change-transform"
            animate={{
              left: `${entity.xPercent}%`,
              bottom: `${entity.bottomPx}px`,
            }}
            transition={spring}
            style={{
              transform: "translateX(-50%) translateZ(0)",
            }}
          >
            <div className="relative flex w-[164px] flex-col items-center">
              {entity.leader ? (
                <>
                  <motion.div
                    className="pointer-events-none absolute left-1/2 top-0 z-0 h-[180px] w-[96px] -translate-x-1/2 rounded-[999px] blur-2xl"
                    animate={{
                      opacity: isPlaying ? 0.72 : 0.56,
                      scale: isPlaying ? 1.05 : 1,
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                    style={{
                      background: `linear-gradient(to bottom, ${entity.accent}40, transparent 82%)`,
                    }}
                  />

                  <div
                    className="pointer-events-none absolute left-1/2 top-16 z-0 h-28 w-28 -translate-x-1/2 rounded-full opacity-70 blur-2xl"
                    style={{
                      background: `radial-gradient(circle, ${entity.accent}33 0%, transparent 70%)`,
                    }}
                  />
                </>
              ) : null}

              <div className="relative z-10 mb-3 flex flex-col items-center">
                <div className="h-[92px] w-[108px]" />

                <motion.button
                  type="button"
                  onClick={() => onSelectEntity?.(entity.id)}
                  className={cn(
                    "mt-3 w-full rounded-2xl border border-white/10 bg-[#0f172acc] px-3 py-2.5 text-left text-xs shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur-md transition outline-none",
                    "hover:bg-[#13203aee] hover:border-white/15",
                    entity.leader &&
                      "border-[#60a5fa]/30 shadow-[0_0_30px_rgba(59,130,246,0.12),0_12px_32px_rgba(0,0,0,0.38)]",
                    selectedEntityId === entity.id &&
                      "border-[#38bdf8]/60 shadow-[0_0_32px_rgba(56,189,248,0.22),0_12px_32px_rgba(0,0,0,0.5)]"
                  )}
                  animate={{
                    y: entity.leader ? -2 : 0,
                    scale: entity.leader ? 1.015 : 1,
                  }}
                  transition={spring}
                >
                  <p className="truncate font-semibold text-[#f8fafc]">
                    {entity.label}
                  </p>

                  <p className="mt-1 text-[11px] text-[#94a3b8]">
                    Portfolio Balance:
                  </p>
                  <p className="text-xs font-semibold text-[#e2e8f0]">
                    {balanceLabel}
                  </p>

                  <p
                    className={cn(
                      "mt-1 text-[11px] font-medium",
                      pnl.positive && "text-[#4ade80]",
                      pnl.negative && "text-[#f87171]",
                      !pnl.positive && !pnl.negative && "text-[#94a3b8]"
                    )}
                  >
                    {pnl.label}
                  </p>
                </motion.button>
              </div>

              <motion.div
                className={cn(
                  "relative w-[112px] rounded-t-[18px] border border-white/10 shadow-[0_18px_34px_rgba(0,0,0,0.38)]",
                  entity.leader &&
                    "shadow-[0_0_28px_rgba(96,165,250,0.12),0_18px_34px_rgba(0,0,0,0.38)]"
                )}
                animate={{
                  height: entity.podiumHeight,
                }}
                transition={spring}
                style={{
                  background: `linear-gradient(180deg, ${entity.accent}, ${entity.color})`,
                }}
              >
                <div className="absolute inset-x-0 top-0 h-3 rounded-t-[18px] bg-white/18" />
                <div className="absolute inset-0 rounded-t-[18px] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.18),transparent_42%)]" />

                {entity.leader ? (
                  <div className="absolute inset-0 rounded-t-[18px] bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.18),transparent_40%)]" />
                ) : null}

                <div className="absolute inset-x-4 bottom-3 rounded-full bg-black/18 px-2 py-1 text-center text-[11px] font-semibold text-white">
                  #{entity.rank + 1}
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
      })}

      {selectedLayout && (
        <motion.div
          className="pointer-events-none absolute z-30"
          style={{
            left: `${selectedLayout.xPercent}%`,
            bottom:
              selectedLayout.bottomPx + selectedLayout.podiumHeight + 120,
            transform: "translateX(-50%) translateZ(0)",
          }}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
        >
          <div className="pointer-events-auto w-[260px] rounded-2xl border border-white/10 bg-[#020617]/95 px-4 py-3 text-xs text-[#e2e8f0] shadow-[0_18px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748b]">
                  Agent thoughts
                </p>
                <p className="mt-1 text-xs font-semibold text-white">
                  {selectedLayout.label}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {typeof displayedRound === "number" && (
                  <span className="rounded-full bg-white/5 px-2 py-[2px] text-[10px] font-medium text-[#cbd5e1]">
                    Round {displayedRound.toFixed(0)}
                  </span>
                )}

                <button
                  type="button"
                  onClick={onClearSelection}
                  className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-[#cbd5e1] hover:bg-white/10"
                  aria-label="Close agent thoughts"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-[#cbd5e1]">
              {selectedInsight ? (
                <>
                  <p>{selectedInsight.thought}</p>
                  {selectedInsight.shock_summary && (
                    <p className="text-[10px] text-[#94a3b8]">
                      {selectedInsight.shock_summary}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-[#64748b]">
                  Waiting for this agent&apos;s decision for the current round.
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
