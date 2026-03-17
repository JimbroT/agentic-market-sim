"use client";

import { motion, type Transition } from "framer-motion";
import { cn } from "../lib/arena-math";
import { formatSignedDelta } from "../lib/ranking";
import { getArenaLayoutAtProgress } from "../lib/arena-layout";
import type { PortfolioEntity } from "../types";

type PodiumStageProps = {
  entities: PortfolioEntity[];
  playbackProgress: number;
  bottomOffset: number;
  isPlaying: boolean;
};

const spring: Transition = {
  type: "spring",
  stiffness: 82,
  damping: 22,
  mass: 1.15,
};

export function PodiumStage({
  entities,
  playbackProgress,
  bottomOffset,
  isPlaying,
}: PodiumStageProps) {
  const layout = getArenaLayoutAtProgress(
    entities,
    playbackProgress,
    bottomOffset
  );

  return (
    <div className="absolute inset-0 z-20">
      {layout.map((entity) => (
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
          <div className="relative flex w-[132px] flex-col items-center">
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

              <motion.div
                className={cn(
                  "mt-3 rounded-2xl border border-white/10 bg-[#0f172acc] px-3 py-2 text-center shadow-[0_12px_32px_rgba(0,0,0,0.38)] backdrop-blur-md",
                  entity.leader &&
                    "border-[#60a5fa]/30 shadow-[0_0_30px_rgba(59,130,246,0.12),0_12px_32px_rgba(0,0,0,0.38)]"
                )}
                animate={{
                  y: entity.leader ? -2 : 0,
                  scale: entity.leader ? 1.015 : 1,
                }}
                transition={spring}
              >
                <p className="text-xs font-semibold text-[#f8fafc]">
                  {entity.label}
                </p>
                <p className="mt-1 text-xs text-[#94a3b8]">
                  {entity.currentValue.toFixed(1)}
                </p>
                <p
                  className={cn(
                    "mt-1 text-[11px] font-medium transition-colors duration-300",
                    entity.movedUp && "text-[#4ade80]",
                    entity.movedDown && "text-[#f87171]",
                    !entity.movedUp && !entity.movedDown && "text-[#94a3b8]"
                  )}
                >
                  {formatSignedDelta(entity.currentValue, 100)}
                </p>
              </motion.div>
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
      ))}
    </div>
  );
}
