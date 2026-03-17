/**
 * Decorative background layer for the homepage hero.
 *
 * Purely presentational: adds rings and soft glows so the hero reads as one
 * cohesive composition rather than disconnected sections.
 */
export function BackgroundLines() {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft radial glow behind the hero content */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.18),rgba(255,255,255,0.03)_30%,transparent_60%)]" />
  
        {/* Large curved rings that hint at trajectories and movement */}
        <div className="absolute left-[-12%] top-[28%] h-[540px] w-[540px] rounded-full border border-[#5567ff]/30" />
        <div className="absolute left-[-8%] top-[43%] h-[720px] w-[720px] rounded-[999px] border border-[#5567ff]/18" />
        <div className="absolute right-[-10%] top-[38%] h-[460px] w-[460px] rounded-full border border-[#5567ff]/28" />
        <div className="absolute right-[-6%] bottom-[-12%] h-[560px] w-[560px] rounded-full border border-[#5567ff]/16" />
        <div className="absolute bottom-[-18%] left-[14%] h-[420px] w-[420px] rounded-full border border-[#5567ff]/14" />
      </div>
    );
  }
  