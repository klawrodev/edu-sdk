import Link from 'next/link';
import { HeroDemo } from '@/components/home/hero-demo';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 70% 50% at 50% 0%, hsl(174 45% 70% / 0.08), transparent 60%),
            linear-gradient(to bottom, transparent 70%, var(--color-fd-background))
          `,
        }}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 pt-16 pb-12 text-center sm:pt-20 sm:pb-16">
        <div className="home-animate-in flex flex-col items-center gap-5">
          <h1 className="font-display max-w-3xl text-4xl leading-[1.15] font-semibold tracking-tight text-balance sm:text-5xl md:text-[3.25rem]">
            Turn any content into interactive learning materials
          </h1>

          <p className="text-fd-muted-foreground max-w-xl text-base text-pretty sm:text-lg">
            The TypeScript SDK for AI-powered learning experiences.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link
              href="/docs/getting-started/installation"
              className="bg-fd-primary text-fd-primary-foreground inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get started
            </Link>
            <Link
              href="/docs"
              className="border-fd-border bg-fd-background/70 inline-flex items-center rounded-md border px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
            >
              Read the docs
            </Link>
          </div>

          <p className="text-fd-muted-foreground font-mono text-xs">
            edu-sdk · @edu-sdk/react
          </p>
        </div>

        <div className="home-animate-in-delay mt-12 w-full sm:mt-14">
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}
