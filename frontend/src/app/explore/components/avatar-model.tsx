"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { AvatarPlaceholder } from "./avatar-placeholder";
import { getAvatarFit } from "./avatar-fit-config";

export type AvatarModelProps = {
  avatarUrl?: string;
  color: string;
  accent: string;
  isLeader: boolean;
  isPlaying: boolean;
};

function AvatarModelLoaded({
  avatarUrl,
  isLeader,
  isPlaying,
}: {
  avatarUrl: string;
  isLeader: boolean;
  isPlaying: boolean;
}) {
  const gltf = useGLTF(avatarUrl);

  const fit = useMemo(() => getAvatarFit(avatarUrl), [avatarUrl]);

  const model = useMemo(() => {
    const cloned = clone(gltf.scene) as THREE.Group;

    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    box.getSize(size);
    box.getCenter(center);

    cloned.position.sub(center);

    const largestDimension = Math.max(size.x, size.y, size.z) || 1;
    const normalizedScale = fit.targetSize / largestDimension;
    cloned.scale.setScalar(normalizedScale);

    cloned.position.y += fit.yOffset;

    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;

      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const material = mesh.material;

      if (Array.isArray(material)) {
        material.forEach((m) => {
          if ("side" in m) m.side = THREE.DoubleSide;
          if ("depthWrite" in m) m.depthWrite = true;
        });
      } else if (material) {
        if ("side" in material) material.side = THREE.DoubleSide;
        if ("depthWrite" in material) material.depthWrite = true;
      }
    });

    return cloned;
  }, [gltf.scene, fit.targetSize, fit.yOffset]);

  const { actions, names, mixer } = useAnimations(gltf.animations, model);

  useEffect(() => {
    if (!names.length) return;

    const firstAction = actions[names[0]];
    if (!firstAction) return;

    firstAction.reset();
    firstAction.setLoop(THREE.LoopRepeat, Infinity);
    firstAction.fadeIn(0.2);
    firstAction.timeScale = 0.5;
    firstAction.play();

    return () => {
      firstAction.fadeOut(0.2);
      firstAction.stop();
    };
  }, [actions, names]);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    mixer.update(delta);
  });

  return (
    <group position={[0, -10, 0]} rotation={[0, fit.rotationY, 0]}>
      <primitive object={model} />

      {isLeader ? (
        <mesh position={[0, fit.haloY, 0]}>
          <torusGeometry args={[fit.haloRadius, fit.haloTube, 12, 32]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#facc15"
            emissiveIntensity={0.8}
          />
        </mesh>
      ) : null}
    </group>
  );
}

export function AvatarModel({
  avatarUrl,
  color,
  accent,
  isLeader,
  isPlaying,
}: AvatarModelProps) {
  if (!avatarUrl) {
    return (
      <AvatarPlaceholder
        color={color}
        accent={accent}
        isLeader={isLeader}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <AvatarPlaceholder
          color={color}
          accent={accent}
          isLeader={isLeader}
        />
      }
    >
      <AvatarModelLoaded
        avatarUrl={avatarUrl}
        isLeader={isLeader}
        isPlaying={isPlaying}
      />
    </Suspense>
  );
}
