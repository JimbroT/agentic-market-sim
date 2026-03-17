"use client";

/**
 * Single avatar instance rendered inside the shared 3D layer.
 *
 * Handles smooth position interpolation (lerp) and simple “alive” motion
 * (bob/sway/lean) to make rank changes feel animated without abrupt jumps.
 */
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { AvatarModel } from "./avatar-model";

type ArenaAvatarInstanceProps = {
    x: number;
    y: number;
    color: string;
    accent: string;
    avatarUrl?: string;
    isLeader: boolean;
    isPlaying: boolean;
};
  

export function ArenaAvatarInstance({
  x,
  y,
  color,
  accent,
  avatarUrl,
  isLeader,
  isPlaying,
}: ArenaAvatarInstanceProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    // Subtle “alive” motion. Leaders get slightly stronger movement so the
    // winner reads clearly even when multiple avatars overlap.
    const bob = Math.sin(t * (isPlaying ? 2.2 : 1.2)) * (isLeader ? 6 : 4);
    const sway = Math.sin(t * 1.1) * (isLeader ? 0.2 : 0.12);
    const lean = Math.sin(t * 1.6) * 0.04;

    const targetX = x;
    const targetY = y + bob;

    // Smooth follow (lerp) keeps rank changes from snapping.
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.14;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.14;
    groupRef.current.rotation.y += (sway - groupRef.current.rotation.y) * 0.1;
    groupRef.current.rotation.z += (lean - groupRef.current.rotation.z) * 0.08;

    const targetScale = isLeader ? 1.1 : 1;
    groupRef.current.scale.x += (targetScale - groupRef.current.scale.x) * 0.1;
    groupRef.current.scale.y += (targetScale - groupRef.current.scale.y) * 0.1;
    groupRef.current.scale.z += (targetScale - groupRef.current.scale.z) * 0.1;
  });

  return (
    <group ref={groupRef} position={[x, y, 0]}>
      <AvatarModel
        avatarUrl={avatarUrl}
        color={color}
        accent={accent}
        isLeader={isLeader}
        isPlaying={isPlaying}
    />
    </group>
  );
}
