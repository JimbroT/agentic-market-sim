type ProgressBarProps = {
    currentRound: number;
    totalRounds: number;
  };
  
  /**
   * Compact progress bar used inside the playback panel.
   */
  export function ProgressBar({
    currentRound,
    totalRounds,
  }: ProgressBarProps) {
    const progress =
      totalRounds <= 1 ? 0 : (currentRound / (totalRounds - 1)) * 100;
  
    return (
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between text-xs text-[#94a3b8]">
          <span>Simulation progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
  
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#3b82f6,#8b5cf6)] transition-all duration-700 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }
  