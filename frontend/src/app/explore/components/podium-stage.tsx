"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, type Transition } from "framer-motion";
import { cn } from "../lib/arena-math";
import { getArenaLayoutAtProgress } from "../lib/arena-layout";
import { AgentThoughtsCard } from "./agent-thoughts-card";
import type { PortfolioEntity } from "../types";
import type {
  AgentMemoryEntry,
  Participant,
  WorldState,
} from "../hooks/use-simulation";
import { toEntityId } from "../hooks/use-simulation";

type PodiumStageProps = {
  entities: PortfolioEntity[];
  playbackProgress: number;
  bottomOffset: number;
  isPlaying: boolean;
  onSelectEntity?: (id: string) => void;
  onClearSelection?: () => void;
  selectedEntityId?: string;
  displayedRound?: number;
  participants?: Participant[];
  world: WorldState | null;
};

type CardPosition = {
  x: number;
  y: number;
};

type CardSize = {
  width: number;
  height: number;
};

type ContainerSize = {
  width: number;
  height: number;
};

type LiveMetrics = {
  portfolioBefore: number;
  portfolioAfter: number;
  pnlDelta: number;
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

const CARD_GAP_ABOVE_PODIUM = 120;
const STAGE_PADDING = 12;

const FALLBACK_CARD_SIZE: CardSize = {
  width: 360,
  height: 560,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function clampCardPosition(
  position: CardPosition,
  cardSize: CardSize,
  containerSize: ContainerSize,
): CardPosition {
  const maxX = Math.max(
    STAGE_PADDING,
    containerSize.width - cardSize.width - STAGE_PADDING,
  );
  const maxY = Math.max(
    STAGE_PADDING,
    containerSize.height - cardSize.height - STAGE_PADDING,
  );

  return {
    x: clamp(position.x, STAGE_PADDING, maxX),
    y: clamp(position.y, STAGE_PADDING, maxY),
  };
}

function formatPortfolioBalance(value: number): string {
  return CURRENCY_FORMAT.format(value);
}

function formatPnL(
  pnlDelta: number,
): { label: string; positive: boolean; negative: boolean } {
  const positive = pnlDelta > 0;
  const negative = pnlDelta < 0;
  const absFormatted = CURRENCY_FORMAT.format(Math.abs(pnlDelta));
  const signPrefix = positive ? "+" : negative ? "-" : "";

  return {
    label: `PnL: ${signPrefix}${absFormatted}`,
    positive,
    negative,
  };
}

function totalPortfolioValue(portfolio: Participant["portfolio"] | undefined): number {
  if (!portfolio) return 0;

  return (
    (portfolio.cash ?? 0) +
    (portfolio.equities ?? 0) +
    (portfolio.bonds ?? 0) +
    (portfolio.commodities ?? 0) +
    (portfolio.volatility ?? 0)
  );
}

function getSortedRounds(participant?: Participant): AgentMemoryEntry[] {
  return (
    participant?.memory?.round_summaries
      ?.filter((entry) => typeof entry.round_number === "number")
      ?.sort((a, b) => a.round_number - b.round_number) ?? []
  );
}

function interpolateParticipantMetrics(
  participant: Participant | undefined,
  playbackProgress: number,
): LiveMetrics | undefined {
  if (!participant) return undefined;

  const rounds = getSortedRounds(participant);
  if (!rounds.length) return undefined;

  const t = playbackProgress;

  if (t <= 0) {
    const firstBefore =
      rounds[0]?.portfolio_value_before ??
      totalPortfolioValue(participant.portfolio);

    return {
      portfolioBefore: firstBefore,
      portfolioAfter: firstBefore,
      pnlDelta: 0,
    };
  }

  let lower = rounds[0];
  let upper = rounds[rounds.length - 1];

  for (let i = 0; i < rounds.length - 1; i += 1) {
    const a = rounds[i];
    const b = rounds[i + 1];

    if (a.round_number <= t && t <= b.round_number) {
      lower = a;
      upper = b;
      break;
    }
  }

  if (t <= rounds[0].round_number) {
    lower = rounds[0];
    upper = rounds[0];
  } else if (t >= rounds[rounds.length - 1].round_number) {
    lower = rounds[rounds.length - 1];
    upper = rounds[rounds.length - 1];
  }

  const t0 = lower.round_number;
  const t1 = upper.round_number;
  const alpha = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
  const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

  return {
    portfolioBefore: lerp(
      lower.portfolio_value_before ?? 0,
      upper.portfolio_value_before ?? lower.portfolio_value_before ?? 0,
      alpha,
    ),
    portfolioAfter: lerp(
      lower.portfolio_value_after ?? 0,
      upper.portfolio_value_after ?? lower.portfolio_value_after ?? 0,
      alpha,
    ),
    pnlDelta: lerp(
      lower.pnl_delta ?? 0,
      upper.pnl_delta ?? lower.pnl_delta ?? 0,
      alpha,
    ),
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
  participants,
  world,
}: PodiumStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [containerSize, setContainerSize] = useState<ContainerSize>({
    width: 0,
    height: 0,
  });

  const [cardSize, setCardSize] = useState<CardSize>(FALLBACK_CARD_SIZE);

  const [persistedCardPosition, setPersistedCardPosition] =
    useState<CardPosition | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => {
      setContainerSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const layout = getArenaLayoutAtProgress(
    entities,
    playbackProgress,
    bottomOffset,
  );

  const currentRound = Math.max(
    0,
    Math.floor(displayedRound ?? playbackProgress ?? 0),
  );

  const selectedLayout = layout.find((entity) => entity.id === selectedEntityId);

  const selectedParticipant = participants?.find((participant) => {
    if (!selectedEntityId) return false;
    return toEntityId(participant.agent_id) === selectedEntityId;
  });

  const selectedMemoryRounds = getSortedRounds(selectedParticipant);

  const selectedMemoryEntry =
    currentRound === 0
      ? undefined
      : selectedMemoryRounds.find((entry) => entry.round_number === currentRound) ??
        selectedMemoryRounds[selectedMemoryRounds.length - 1];

  const liveMetrics = interpolateParticipantMetrics(
    selectedParticipant,
    playbackProgress,
  );

  const anchoredCardPosition = useMemo<CardPosition | null>(() => {
    if (!selectedLayout) return null;
    if (!containerSize.width || !containerSize.height) return null;

    const anchorX = (selectedLayout.xPercent / 100) * containerSize.width;
    const anchorBottom =
      selectedLayout.bottomPx +
      selectedLayout.podiumHeight +
      CARD_GAP_ABOVE_PODIUM;

    const desired = {
      x: anchorX - cardSize.width / 2,
      y: containerSize.height - anchorBottom - cardSize.height,
    };

    return clampCardPosition(desired, cardSize, containerSize);
  }, [selectedLayout, containerSize, cardSize]);

  const activeCardPosition = useMemo<CardPosition | null>(() => {
    if (!containerSize.width || !containerSize.height) return null;

    if (persistedCardPosition) {
      return clampCardPosition(
        persistedCardPosition,
        cardSize,
        containerSize,
      );
    }

    return anchoredCardPosition;
  }, [persistedCardPosition, anchoredCardPosition, cardSize, containerSize]);

  const commitCardPosition = (next: CardPosition) => {
    if (!containerSize.width || !containerSize.height) {
      setPersistedCardPosition(next);
      return;
    }

    setPersistedCardPosition(
      clampCardPosition(next, cardSize, containerSize),
    );
  };

  return (
    <div ref={containerRef} className="absolute inset-0 z-20 overflow-hidden">
      {layout.map((entity) => {
        const participant = participants?.find(
          (item) => toEntityId(item.agent_id) === entity.id,
        );

        const metrics = interpolateParticipantMetrics(
          participant,
          playbackProgress,
        );

        const livePortfolioValue =
          metrics?.portfolioAfter ??
          totalPortfolioValue(participant?.portfolio);

        const livePnlDelta = metrics?.pnlDelta ?? 0;

        const balanceLabel = formatPortfolioBalance(livePortfolioValue);
        const pnl = formatPnL(livePnlDelta);

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
                  onClick={() => {
                    onSelectEntity?.(entity.id);
                  }}
                  className={cn(
                    "mt-3 w-full rounded-2xl border border-white/10 bg-[#0f172acc] px-3 py-2.5 text-left text-xs shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur-md transition outline-none",
                    "hover:bg-[#13203aee] hover:border-white/15",
                    entity.leader &&
                      "border-[#60a5fa]/30 shadow-[0_0_30px_rgba(59,130,246,0.12),0_12px_32px_rgba(0,0,0,0.38)]",
                    selectedEntityId === entity.id &&
                      "border-[#38bdf8]/60 shadow-[0_0_32px_rgba(56,189,248,0.22),0_12px_32px_rgba(0,0,0,0.5)]",
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
                      !pnl.positive &&
                        !pnl.negative &&
                        "text-[#94a3b8]",
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
                    "shadow-[0_0_28px_rgba(96,165,250,0.12),0_18px_34px_rgba(0,0,0,0.38)]",
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

      {selectedLayout && activeCardPosition && selectedParticipant ? (
        <AgentThoughtsCard
          participant={selectedParticipant}
          memoryEntry={selectedMemoryEntry}
          world={world ?? undefined}
          label={selectedLayout.label}
          round={currentRound}
          liveMetrics={liveMetrics}
          onClose={onClearSelection}
          position={activeCardPosition}
          dragConstraintsRef={containerRef}
          onPositionCommit={commitCardPosition}
          onMeasure={setCardSize}
        />
      ) : null}
    </div>
  );
}
