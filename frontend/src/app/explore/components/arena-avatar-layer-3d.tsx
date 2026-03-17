"use client";

/**
 * Shared Three.js layer for rendering all entity avatars in the arena.
 *
 * The DOM podiums and this 3D layer share a single layout function
 * (`getArenaLayoutAtProgress`) so avatars and podiums stay aligned while
 * scrubbing and animating.
 */
import { Canvas, useThree } from "@react-three/fiber";
import { memo, useMemo } from "react";
import type { PortfolioEntity } from "../types";
import {
  AVATAR_CENTER_OFFSET_PX,
  getArenaLayoutAtProgress,
} from "../lib/arena-layout";
import { ArenaAvatarInstance } from "./arena-avatar-instance";

const AVATAR_OFFSETS: Record<string, { x?: number; y?: number }> = {
  // Retail Traders: shift slightly left
  "signal-x": { x: -50 },
};

type ArenaAvatarLayer3DProps = {
  entities: PortfolioEntity[];
  playbackProgress: number;
  bottomOffset: number;
  isPlaying: boolean;
};

/**
 * Inner 3D scene for all shared avatars.
 * This reads the same arena layout math as the DOM podium layer.
 */
function AvatarScene({
  entities,
  playbackProgress,
  bottomOffset,
  isPlaying,
}: ArenaAvatarLayer3DProps) {
  const { size } = useThree();

  const layout = useMemo(
    () => getArenaLayoutAtProgress(entities, playbackProgress, bottomOffset),
    [entities, playbackProgress, bottomOffset]
  );

  return (
    <>
      {/* Base lighting for avatar visibility */}
      <ambientLight intensity={1.1} />
      <directionalLight position={[0, 140, 220]} intensity={1.75} color="#ffffff" />
      <pointLight position={[-180, 160, 180]} intensity={0.7} color="#60a5fa" />
      <pointLight position={[180, 120, 160]} intensity={0.55} color="#f59e0b" />

      {layout.map((entity) => {
      const baseXPx = (entity.xPercent / 100) * size.width - size.width / 2;
      const baseYPx =
        -size.height / 2 +
        entity.bottomPx +
        entity.podiumHeight +
        AVATAR_CENTER_OFFSET_PX;

      const offsets = AVATAR_OFFSETS[entity.id] ?? {};
      const xPx = baseXPx + (offsets.x ?? 0);
      const yPx = baseYPx + (offsets.y ?? 0);

      return (
        <ArenaAvatarInstance
          key={entity.id}
          x={xPx}
          y={yPx}
          color={entity.color}
          accent={entity.accent}
          avatarUrl={entity.avatarUrl}
          isLeader={entity.leader}
          isPlaying={isPlaying}
        />
      );
    })}
    </>
  );
}

/**
 * Shared stage-level canvas for all avatars.
 */
function ArenaAvatarLayer3DInner(props: ArenaAvatarLayer3DProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[12]">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 500], zoom: 1 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <AvatarScene {...props} />
      </Canvas>
    </div>
  );
}

export const ArenaAvatarLayer3D = memo(ArenaAvatarLayer3DInner);
