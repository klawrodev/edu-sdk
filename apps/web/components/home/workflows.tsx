import Link from 'next/link';

const workflows = [
  {
    name: 'extractContent()',
    href: '/docs/core/extract-content',
    note: 'PDF / text / markdown → string',
  },
  {
    name: 'createLearningSet()',
    href: '/docs/core/create-learning-set',
    note: 'Several materials in one call',
  },
  {
    name: 'createStudySession()',
    href: '/docs/core/create-study-session',
    note: 'Timed agenda + materials — compose your own runner',
  },
  {
    name: 'gradeQuiz() / Assessment',
    href: '/docs/core/assessment',
    note: 'Score answers and track attempts',
  },
];

export function Workflows() {
  return (
    <section className="space-y-8">
      <div className="mx-auto max-w-2xl space-y-2 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight">
          Workflows
        </h2>
        <p className="text-fd-muted-foreground text-sm sm:text-base">
          Content extraction, multi-artifact generation, study sessions, and
          grading — beyond the 1:1 create → UI pairs.
        </p>
      </div>

      <ul className="border-fd-border divide-fd-border mx-auto max-w-2xl divide-y border-y">
        {workflows.map((item) => (
          <li key={item.name} className="py-4">
            <p className="font-mono text-sm sm:text-base">
              <Link
                href={item.href}
                className="hover:text-fd-primary transition-colors hover:underline"
              >
                {item.name}
              </Link>
              <span className="text-fd-muted-foreground"> — {item.note}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
