import Link from 'next/link';

export function CloseCta() {
  return (
    <section className="mx-auto max-w-xl space-y-4 text-center">
      <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
        Build your first learning material
      </h2>
      <p className="text-fd-muted-foreground text-sm sm:text-base">
        Install the packages and ship quizzes, flashcards, study sessions, and
        more in minutes.
      </p>
      <Link
        href="/docs/getting-started/installation"
        className="bg-fd-primary text-fd-primary-foreground inline-flex items-center rounded-md px-5 py-2.5 text-sm font-medium transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0"
      >
        Get started
      </Link>
    </section>
  );
}
