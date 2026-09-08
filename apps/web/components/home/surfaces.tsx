import Link from 'next/link';

const surfaces = [
  {
    create: 'createFlashcards()',
    createHref: '/docs/core/create-flashcards',
    ui: '<Flashcards />',
    uiHref: '/docs/react/flashcards',
  },
  {
    create: 'createQuiz()',
    createHref: '/docs/core/create-quiz',
    ui: '<Quiz />',
    uiHref: '/docs/react/quiz',
  },
  {
    create: 'createStudyGuide()',
    createHref: '/docs/core/create-study-guide',
    ui: '<StudyGuide />',
    uiHref: '/docs/react/study-guide',
  },
  {
    create: 'createPracticeProblems()',
    createHref: '/docs/core/create-practice-problems',
    ui: '<PracticeProblems />',
    uiHref: '/docs/react/practice-problems',
  },
];

export function Surfaces() {
  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Surfaces
        </h2>
        <p className="text-fd-muted-foreground text-sm sm:text-base">
          Generate a material, then render it with a matching React component.
        </p>
      </div>

      <ul className="border-fd-border divide-fd-border mx-auto max-w-2xl divide-y border-y">
        {surfaces.map((surface) => (
          <li key={surface.create} className="py-4">
            <p className="font-mono text-sm sm:text-base">
              <Link
                href={surface.createHref}
                className="hover:text-fd-primary transition-colors hover:underline"
              >
                {surface.create}
              </Link>
              <span className="text-fd-muted-foreground"> → </span>
              <Link
                href={surface.uiHref}
                className="hover:text-fd-primary transition-colors hover:underline"
              >
                {surface.ui}
              </Link>
            </p>
          </li>
        ))}
        <li className="py-4">
          <p className="text-fd-muted-foreground font-mono text-sm sm:text-base">
            <Link
              href="/docs/core/create-note"
              className="text-fd-foreground hover:text-fd-primary transition-colors hover:underline"
            >
              createNote()
            </Link>
            <span> → Markdown, no React component</span>
          </p>
        </li>
      </ul>
    </section>
  );
}
