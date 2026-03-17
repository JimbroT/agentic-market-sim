/**
 * Marketing-style homepage route (`/`).
 *
 * This page introduces MUMU and links into the interactive `/explore` view.
 * The content is intentionally static/fast so it can load instantly.
 */
import { BackgroundLines } from "@/components/homepage/background-lines";
import { ProductPreview } from "@/components/homepage/product-preview";
import { TopNav } from "@/components/homepage/top-nav";
import { Button } from "@/components/ui/button";

// Homepage for the new frontend direction.
export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0f3c] text-white">
      <BackgroundLines />
      <TopNav />

      <section className="relative mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-6 pb-12 pt-28 lg:px-10 lg:pt-32">
        <div className="mx-auto max-w-[920px] text-center">
          <p className="text-sm font-medium tracking-[0.22em] text-white/62">
            AGENTIC MARKET INTELLIGENCE
          </p>

          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.075em] text-white sm:text-6xl lg:text-[88px] lg:leading-[0.95]">
            Explore the market
            <br />
            before it moves.
          </h1>

          <p className="mx-auto mt-5 max-w-[760px] text-lg leading-8 text-white/70 sm:text-xl">
            MUMU helps teams simulate market behavior, track narrative shifts,
            and inspect trajectories across agents, sectors, and macro signals.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/explore" variant="primary" size="lg">
              Open exploratory view
            </Button>

            <Button href="#product" variant="secondary" size="lg">
              See how it works
            </Button>
          </div>
        </div>

        <div id="product" className="mt-10 lg:mt-12">
          <ProductPreview />
        </div>
      </section>
    </main>
  );
}
