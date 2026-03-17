import { cn } from "../lib/arena-math";

type MascotAvatarProps = {
  color: string;
  accent: string;
  isLeader: boolean;
  isPlaying: boolean;
  avatarMode?: "placeholder" | "three-ready";
  avatarUrl?: string;
};

/**
 * Placeholder avatar component.
 * This stays isolated so it can later be replaced by a Three.js / R3F avatar.
 */
export function MascotAvatar({
  color,
  accent,
  isLeader,
  isPlaying,
  avatarMode = "placeholder",
}: MascotAvatarProps) {
  void avatarMode;

  return (
    <div className="relative">
      <div
        className={cn(
          "absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-all duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isLeader ? "animate-pulse opacity-80 scale-125" : "opacity-45 scale-100"
        )}
        style={{
          background: `radial-gradient(circle, ${accent} 0%, transparent 72%)`,
        }}
      />

      <div
        className={cn(
          "absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isLeader ? "border-white/35 opacity-100 scale-110" : "border-white/10 opacity-60 scale-100"
        )}
      />

      {isLeader ? (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xl drop-shadow-[0_0_12px_rgba(250,204,21,0.55)]">
          👑
        </div>
      ) : null}

      <div
        className={cn(
          "relative flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-white/70 shadow-[0_20px_44px_rgba(0,0,0,0.48)] transition-[transform,filter,box-shadow] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          isPlaying ? "scale-[1.06]" : "scale-100",
          isLeader && "shadow-[0_0_36px_rgba(255,255,255,0.08),0_0_60px_rgba(96,165,250,0.12),0_20px_44px_rgba(0,0,0,0.48)]"
        )}
        style={{
          background: `linear-gradient(145deg, ${accent}, ${color})`,
          filter: isLeader ? "saturate(1.12) brightness(1.05)" : "saturate(1)",
        }}
      >
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.34),transparent_34%)]" />
        <div className="absolute top-4 h-2.5 w-2.5 rounded-full bg-[#020617]/80" />
        <div className="absolute left-5 top-7 h-2.5 w-2.5 rounded-full bg-white/90" />
        <div className="absolute right-5 top-7 h-2.5 w-2.5 rounded-full bg-white/90" />
        <div className="absolute bottom-5 h-2.5 w-8 rounded-full bg-white/85" />

        <div
          className="absolute -bottom-1 left-1/2 h-5 w-8 -translate-x-1/2 rounded-b-full border-x-2 border-b-2 border-white/45"
          style={{ backgroundColor: `${accent}80` }}
        />
      </div>
    </div>
  );
}
