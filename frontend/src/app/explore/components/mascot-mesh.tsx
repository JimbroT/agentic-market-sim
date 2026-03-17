"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

type MascotMeshProps = {
  color: string;
  accent: string;
  isLeader: boolean;
  isPlaying: boolean;
};

export function MascotMesh({
  color,
  accent,
  isLeader,
  isPlaying,
}: MascotMeshProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;

    const t = state.clock.elapsedTime;
    const bob = Math.sin(t * (isPlaying ? 2.2 : 1.4)) * 0.08;
    const sway = Math.sin(t * 1.3) * 0.18;
    const leaderBoost = isLeader ? 0.04 : 0;

    groupRef.current.position.y = bob + leaderBoost;
    groupRef.current.rotation.y = sway;
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.52, 32, 32]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>

      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.24, 0.3, 0.75, 24]} />
        <meshStandardMaterial color={accent} roughness={0.45} metalness={0.08} />
      </mesh>

      <mesh position={[-0.16, 0.24, 0.44]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>

      <mesh position={[0.16, 0.24, 0.44]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.15} />
      </mesh>

      <mesh position={[0, 0.02, 0.46]}>
        <boxGeometry args={[0.22, 0.04, 0.04]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.08} />
      </mesh>

      {isLeader ? (
        <mesh position={[0, 0.92, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.2, 0.04, 12, 32]} />
          <meshStandardMaterial color="#facc15" emissive="#facc15" emissiveIntensity={0.8} />
        </mesh>
      ) : null}
    </group>
  );
}
