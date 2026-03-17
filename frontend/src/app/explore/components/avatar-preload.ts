"use client";

import { useGLTF } from "@react-three/drei";

/**
 * Call preloads only for files that really exist.
 * Keep this list in sync with /public/avatars.
 */
useGLTF.preload("/avatars/macro-hf.glb");
useGLTF.preload("/avatars/long-only.glb");
useGLTF.preload("/avatars/vol-fund.glb");
useGLTF.preload("/avatars/alpha-cap.glb");
useGLTF.preload("/avatars/delta-sys.glb");
useGLTF.preload("/avatars/quant-lab.glb");
useGLTF.preload("/avatars/signal-x.glb");
useGLTF.preload("/avatars/deep-value.glb");
