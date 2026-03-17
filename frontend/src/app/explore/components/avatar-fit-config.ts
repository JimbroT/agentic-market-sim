/**
 * Per-avatar fit tuning.
 *
 * Keyed by a path fragment so you can match:
 * - folder names
 * - file names
 * - model ids
 *
 * Add one entry per real avatar as you import them.
 */
export type AvatarFitConfig = {
    targetSize?: number;
    yOffset?: number;
    rotationY?: number;
    haloY?: number;
    haloRadius?: number;
    haloTube?: number;
  };
  
  export const DEFAULT_AVATAR_FIT: Required<AvatarFitConfig> = {
    targetSize: 115,
    yOffset: 85,
    rotationY: 0,
    haloY: 40,
    haloRadius: 10,
    haloTube: 2.2,
  };
  
  export const AVATAR_FIT_CONFIG: Record<string, AvatarFitConfig> = {
    oldman: {
      targetSize: 115,
      yOffset: 85,
      rotationY: 0,
      haloY: 115,
      haloRadius: 12,
      haloTube: 2.6,
    },

    monster: {
        targetSize: 150,
      yOffset: 120,
      rotationY: 0,
      haloY: 115,
      haloRadius: 12,
      haloTube: 2.6,
    },

    breakdance: {
        targetSize: 160,
      yOffset: 80,
      rotationY: 0,
      haloY: 115,
      haloRadius: 12,
      haloTube: 2.6,
    },

    timmy: {
        targetSize: 150,
      yOffset: 70,
      rotationY: 0,
      haloY: 115,
      haloRadius: 12,
      haloTube: 2.6,
    },

    mouse: {
        targetSize: 110,
      yOffset: 70,
      rotationY: 0,
      haloY: 115,
      haloRadius: 12,
      haloTube: 2.6,
    },

    amy: {
        targetSize: 130,
      yOffset: 70,
      rotationY: 0,
      haloY: 115,
      haloRadius: 12,
      haloTube: 2.6,
    },

    salsa: {
        targetSize: 120,
      yOffset: 70,
      rotationY: 0,
      haloY: 115,
      haloRadius: 12,
      haloTube: 2.6,
    },



  
    // Add future models here:
    // "macro-hf": { targetSize: 46, yOffset: 12, rotationY: Math.PI },
    // "vol-fund": { targetSize: 52, yOffset: 18, rotationY: 0 },
  };
  
  /**
   * Finds the first config whose key appears in the avatar URL.
   */
  export function getAvatarFit(avatarUrl: string): Required<AvatarFitConfig> {
    const lower = avatarUrl.toLowerCase();
  
    const matchedKey = Object.keys(AVATAR_FIT_CONFIG).find((key) =>
      lower.includes(key.toLowerCase())
    );
  
    if (!matchedKey) {
      return DEFAULT_AVATAR_FIT;
    }
  
    return {
      ...DEFAULT_AVATAR_FIT,
      ...AVATAR_FIT_CONFIG[matchedKey],
    };
  }
  