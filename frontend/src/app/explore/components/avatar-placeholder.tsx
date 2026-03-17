"use client";

/**
 * Procedural fallback mascot used before real GLB avatars exist.
 *
 * Design goals:
 * - Read clearly at small size.
 * - Feel playful and premium in dark mode.
 * - Support leader state with a stronger silhouette.
 */
type AvatarPlaceholderProps = {
  color: string;
  accent: string;
  isLeader: boolean;
};

export function AvatarPlaceholder({
  color,
  accent,
  isLeader,
}: AvatarPlaceholderProps) {
  return (
    <group>
      {/* Ground glow / contact shadow */}
      <mesh position={[0, -30, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[28, 32]} />
        <meshBasicMaterial
          color={isLeader ? accent : "#000000"}
          transparent
          opacity={isLeader ? 0.2 : 0.12}
        />
      </mesh>

      {/* Soft aura behind the mascot */}
      <mesh position={[0, 8, -8]}>
        <sphereGeometry args={[32, 24, 24]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={isLeader ? 0.14 : 0.08}
        />
      </mesh>

      {/* Main head */}
      <mesh position={[0, 14, 0]}>
        <sphereGeometry args={[24, 32, 32]} />
        <meshStandardMaterial
          color={color}
          roughness={0.28}
          metalness={0.1}
        />
      </mesh>

      {/* Head highlight for a glossy mascot look */}
      <mesh position={[-7, 24, 17]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.12}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Body */}
      <mesh position={[0, -18, 0]}>
        <capsuleGeometry args={[11, 22, 8, 16]} />
        <meshStandardMaterial
          color={accent}
          roughness={0.38}
          metalness={0.06}
        />
      </mesh>

      {/* Arms */}
      <mesh position={[-16, -14, 0]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[3.2, 14, 6, 12]} />
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0.05} />
      </mesh>

      <mesh position={[16, -14, 0]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[3.2, 14, 6, 12]} />
        <meshStandardMaterial color={accent} roughness={0.4} metalness={0.05} />
      </mesh>

      {/* Feet */}
      <mesh position={[-7, -35, 4]}>
        <sphereGeometry args={[4.6, 16, 16]} />
        <meshStandardMaterial color={accent} roughness={0.48} metalness={0.03} />
      </mesh>

      <mesh position={[7, -35, 4]}>
        <sphereGeometry args={[4.6, 16, 16]} />
        <meshStandardMaterial color={accent} roughness={0.48} metalness={0.03} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-7, 18, 21]}>
        <sphereGeometry args={[2.6, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.18} />
      </mesh>

      <mesh position={[7, 18, 21]}>
        <sphereGeometry args={[2.6, 16, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.18} />
      </mesh>

      {/* Pupils */}
      <mesh position={[-7, 18, 23]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      <mesh position={[7, 18, 23]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {/* Mouth */}
      <mesh position={[0, 9, 22]}>
        <boxGeometry args={[8, 1.6, 1.6]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.08} />
      </mesh>

      {/* Belly accent */}
      <mesh position={[0, -18, 11]}>
        <sphereGeometry args={[6.5, 18, 18]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.22}
          roughness={0.5}
          metalness={0}
        />
      </mesh>

      {/* Leader crown / halo */}
      {isLeader ? (
        <>
          <mesh position={[0, 46, 0]}>
            <torusGeometry args={[9, 2.1, 12, 32]} />
            <meshStandardMaterial
              color="#facc15"
              emissive="#facc15"
              emissiveIntensity={0.9}
            />
          </mesh>

          <mesh position={[0, 46, -2]}>
            <sphereGeometry args={[13, 20, 20]} />
            <meshBasicMaterial color="#facc15" transparent opacity={0.08} />
          </mesh>
        </>
      ) : null}
    </group>
  );
}
