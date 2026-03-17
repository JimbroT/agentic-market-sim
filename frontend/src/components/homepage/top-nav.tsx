import Link from "next/link";

const navItems = [
  { label: "Explore", href: "/explore" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Scenarios", href: "/scenarios" },
  { label: "Teams", href: "/teams" },
  { label: "Rounds", href: "/rounds" },
  { label: "Runs", href: "/runs" },
  { label: "Reports", href: "/reports" },
];

// Homepage header with:
// 1. a faint translucent backdrop,
// 2. a truly centered nav row on larger screens,
// 3. a lighter CTA so the hero remains dominant.
export function TopNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-[1440px] px-6 pt-4 lg:px-10">
        <div className="relative flex items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-md">
          {/* Left: brand */}
          <Link
            href="/"
            className="relative z-10 shrink-0 text-[21px] font-semibold tracking-[-0.08em] text-white"
          >
            MUMU
          </Link>

          {/* Center: truly centered nav */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 xl:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="shrink-0 text-[14px] font-medium text-white/68 transition duration-200 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right: compact CTA */}
          <div className="relative z-10 shrink-0">
            <Link
              href="/explore"
              className="rounded-full bg-[#6472ff] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(100,114,255,0.22)] transition duration-200 hover:bg-[#7482ff]"
            >
              Open simulation
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
