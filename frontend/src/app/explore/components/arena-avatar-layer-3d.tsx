"use client";

/**
 * Shared Three.js layer for rendering all entity avatars in the arena.
 *
 * This revised version:
 * - checks whether WebGL is actually available before mounting Canvas,
 * - avoids repeatedly crashing the page when WebGL cannot be created,
 * - uses cheaper renderer settings for weaker machines,
 * - keeps the rest of the arena fully functional if 3D is unavailable.
 */

import dynamic from "next/dynamic";
import { memo, useEffect, useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import type { PortfolioEntity } from "../types";
import {
  AVATAR_CENTER_OFFSET_PX,
  getArenaLayoutAtProgress,
} from "../lib/arena-layout";
import { ArenaAvatarInstance } from "./arena-avatar-instance";

const Canvas = dynamic(
  async () => {
    const mod = await import("@react-three/fiber");
    return mod.Canvas;
  },
  { ssr: false },
);

const AVATAR_OFFSETS: Record<string, { x?: number; y?: number }> = {
  "signal-x": { x: -50 },
};

type ArenaAvatarLayer3DProps = {
  entities: PortfolioEntity[];
  playbackProgress: number;
  bottomOffset: number;
  isPlaying: boolean;
};

function canCreateWebGLContext(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");

    const webgl2 = canvas.getContext("webgl2");
    if (webgl2) return true;

    const webgl = canvas.getContext("webgl");
    if (webgl) return true;

    const experimental = canvas.getContext("experimental-webgl");
    return !!experimental;
  } catch {
    return false;
  }
}

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
    [entities, playbackProgress, bottomOffset],
  );

  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight
        position={[0, 140, 220]}
        intensity={1.35}
        color="#ffffff"
      />
      <pointLight
        position={[-180, 160, 180]}
        intensity={0.45}
        color="#60a5fa"
      />
      <pointLight
        position={[180, 120, 160]}
        intensity={0.35}
        color="#f59e0b"
      />

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
 * If WebGL is unavailable, render nothing instead of throwing runtime errors.
 */
function ArenaAvatarLayer3DInner(props: ArenaAvatarLayer3DProps) {
  const [webglReady, setWebglReady] = useState<boolean | null>(null);

  useEffect(() => {
    setWebglReady(canCreateWebGLContext());
  }, []);

  if (webglReady === null) {
    return null;
  }

  if (!webglReady) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[12]">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 500], zoom: 1 }}
        dpr={1}
        frameloop={props.isPlaying ? "always" : "demand"}
        gl={{
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
        }}
      >
        <AvatarScene {...props} />
      </Canvas>
    </div>
  );
}

export const ArenaAvatarLayer3D = memo(ArenaAvatarLayer3DInner);
