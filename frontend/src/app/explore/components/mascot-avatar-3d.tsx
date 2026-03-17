"use client";

import { memo } from "react";
import { Canvas } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { MascotMesh } from "./mascot-mesh";

type MascotAvatar3DProps = {
  color: string;
  accent: string;
  isLeader: boolean;
  isPlaying: boolean;
};

function MascotAvatar3DInner({
  color,
  accent,
  isLeader,
  isPlaying,
}: MascotAvatar3DProps) {
  return (
    <div className="relative h-[108px] w-[108px] pointer-events-none">
      <div
        className="absolute inset-0 rounded-full blur-2xl"
        style={{
          background: isLeader
            ? `radial-gradient(circle, ${accent}66 0%, transparent 70%)`
            : `radial-gradient(circle, ${accent}33 0%, transparent 70%)`,
        }}
      />

      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 35 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          frameloop="always"
          resize={{ scroll: false, debounce: { scroll: 0, resize: 0 } }}
        >
          <ambientLight intensity={1.2} />
          <directionalLight position={[2, 3, 4]} intensity={2.2} />
          <pointLight
            position={[0, 1.5, 2]}
            intensity={isLeader ? 16 : 10}
            color={accent}
          />

          <Float
            speed={isPlaying ? 2 : 1.2}
            rotationIntensity={0.2}
            floatIntensity={0.25}
          >
            <MascotMesh
              color={color}
              accent={accent}
              isLeader={isLeader}
              isPlaying={isPlaying}
            />
          </Float>
        </Canvas>
      </div>
    </div>
  );
}

export const MascotAvatar3D = memo(MascotAvatar3DInner);
