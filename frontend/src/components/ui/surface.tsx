/**
 * Simple container component for consistent card/panel styling.
 *
 * `tone` selects a small set of curated visual treatments used across the
 * homepage and platform layouts.
 */
import { ReactNode } from "react";

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  tone?: "glass" | "panel" | "soft";
};

const toneStyles = {
  glass:
    "border border-white/12 bg-white/[0.08] backdrop-blur-sm shadow-[0_40px_120px_rgba(0,0,0,0.45)]",
  panel: "border border-white/10 bg-[#11182b]",
  soft: "border border-[#e8edf5] bg-[#fbfcfe]",
};

export function Surface({
  children,
  className = "",
  tone = "panel",
}: SurfaceProps) {
  return (
    <div className={`rounded-[28px] ${toneStyles[tone]} ${className}`.trim()}>
      {children}
    </div>
  );
}
