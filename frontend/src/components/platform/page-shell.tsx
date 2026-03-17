import Link from "next/link";
import { ReactNode } from "react";

type PlatformPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

const navItems = [
  { label: "Explore", href: "/explore" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Scenarios", href: "/scenarios" },
  { label: "Teams", href: "/teams" },
  { label: "Rounds", href: "/rounds" },
  { label: "Runs", href: "/runs" },
  { label: "Reports", href: "/reports" },
];

export function PlatformPageShell({
  eyebrow,
  title,
  description,
  children,
}: PlatformPageShellProps) {
  return (
    <main className="min-h-screen bg-[#0b1020] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-10">
          <Link
            href="/"
            className="text-[22px] font-semibold tracking-[-0.08em] text-white"
          >
            MUMU
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-white/70 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
        <p className="text-xs uppercase tracking-[0.24em] text-white/50">
          {eyebrow}
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
          {title}
        </h1>

        <p className="mt-4 max-w-[760px] text-base leading-8 text-white/65">
          {description}
        </p>

        <div className="mt-10">{children}</div>
      </section>
    </main>
  );
}
