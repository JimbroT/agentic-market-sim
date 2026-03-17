/**
 * Compact progress bar used inside the playback panel.
 *
 * Interprets `currentRound` in [0, maxProgress] and normalizes so
 * 0 = 0% and maxProgress = 100%.
 */
type ProgressBarProps = {
  currentRound: number; // 0..maxProgress (e.g. 0..3)
  totalRounds: number;  // number of roundValues (e.g. 4)
};

export function ProgressBar({
  currentRound,
  totalRounds,
}: ProgressBarProps) {
  const maxProgress = Math.max(totalRounds - 1, 0); // 3 when totalRounds=4

  const progress =
    maxProgress <= 0 ? 0 : (currentRound / maxProgress) * 100;

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
