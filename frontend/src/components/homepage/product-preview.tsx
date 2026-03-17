import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/stat-tile";
import { Surface } from "@/components/ui/surface";

// Large visual preview embedded in the homepage hero.
// This is a polished teaser for the product experience, not the real app page yet.
export function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[1260px]">
      <Surface tone="glass" className="overflow-hidden rounded-[32px]">
        {/* Browser-style chrome at the top of the preview frame */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-white/25" />
            <div className="h-3 w-3 rounded-full bg-white/20" />
            <div className="h-3 w-3 rounded-full bg-white/15" />
          </div>

          <div className="rounded-full bg-white/8 px-3 py-1 text-xs text-white/70">
            Live simulation workspace
          </div>
        </div>

        {/* Two-column preview: graph-inspired visual on the left, product narrative on the right */}
        <div className="grid min-h-[560px] lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left side: exploratory graph-inspired illustration */}
          <div className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_20%,rgba(102,119,255,0.2),transparent_50%)] lg:border-b-0 lg:border-r lg:border-white/10">
            <div className="relative h-full p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-white/58">
                Graph relationship visualization
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">
                Multiple trajectories,
                <br />
                one live system.
              </h2>

              <p className="mt-4 max-w-[440px] text-sm leading-7 text-white/68">
                Trace how teams, catalysts, risks, sectors, and narratives connect
                across a continuous exploratory surface.
              </p>

              {/* Stylized SVG preview to suggest the future explore page */}
              <div className="relative mt-8 h-[360px] rounded-[24px] border border-white/10 bg-black/15">
                <svg
                  viewBox="0 0 800 360"
                  className="h-full w-full"
                  preserveAspectRatio="none"
                >
                  {Array.from({ length: 24 }).map((_, index) => (
                    <path
                      key={index}
                      d={`M ${30 + index * 10} ${320 - index * 4} C ${220 + index * 4} ${40 + index * 2}, ${520 - index * 7} ${310 - index * 2}, ${740 - index * 2} ${50 + index * 8}`}
                      fill="none"
                      stroke={
                        index % 4 === 0
                          ? "rgba(255,79,135,0.6)"
                          : index % 3 === 0
                            ? "rgba(93,107,255,0.48)"
                            : "rgba(255,255,255,0.11)"
                      }
                      strokeWidth={index % 4 === 0 ? 2.1 : 1}
                    />
                  ))}

                  {[
                    [120, 270],
                    [185, 160],
                    [270, 220],
                    [350, 110],
                    [470, 190],
                    [560, 130],
                    [655, 215],
                  ].map(([cx, cy], index) => (
                    <circle
                      key={index}
                      cx={cx}
                      cy={cy}
                      r={index === 2 ? 8 : 5}
                      fill={index === 2 ? "#ff4f87" : "#5d6bff"}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Right side: supporting product explanation */}
          <div className="bg-[#f7f4ed] p-8 text-[#111827]">
            <div className="rounded-[24px] bg-white px-6 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.08)]">
              <p className="text-xs uppercase tracking-[0.22em] text-[#7c8797]">
                Active simulation
              </p>

              <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em]">
                Explore how the market reacts
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#5f6b7a]">
                Move from headline narrative to a deep relationship map where teams,
                risks, and sectors can be inspected in one visual workflow.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <StatTile label="Teams" value="39" />
                <StatTile label="Agents" value="39" />
                <StatTile label="Links" value="312" />
              </div>

              <div className="mt-6 rounded-[22px] border border-[#e8edf5] bg-[#fbfcfe] p-5">
                <p className="text-sm font-medium text-[#17202c]">
                  Exploratory workspace
                </p>

                <p className="mt-2 text-sm leading-7 text-[#667384]">
                  Keep the homepage elegant, then send power users into a dedicated
                  subpage for deep graph exploration.
                </p>

                <Button href="/explore" variant="dark" size="sm" className="mt-4">
                  Go to explore
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Surface>
    </div>
  );
}
