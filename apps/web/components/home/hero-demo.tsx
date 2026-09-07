'use client';

import { Quiz } from '@edu-sdk/react';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

const createQuizExample = `import { createQuiz } from "edu-sdk";

const quiz = await createQuiz({
  model: "google/gemini-3.6-flash",
  content,
  count: 2,
  difficulty: "medium"
});`;

const questions = [
  {
    id: 'q-1',
    question: 'What is the unit of electric current?',
    options: ['Volt', 'Ampere', 'Ohm', 'Watt'],
    correctAnswer: 1,
  },
  {
    id: 'q-2',
    question: 'Which quantity is measured in ohms?',
    options: ['Voltage', 'Current', 'Resistance', 'Power'],
    correctAnswer: 2,
  },
];

export function HeroDemo() {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2 lg:items-start">
      <div className="min-w-0 text-left">
        <p className="text-fd-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          Generation
        </p>
        <DynamicCodeBlock lang="ts" code={createQuizExample} />
      </div>
      <div className="min-w-0 text-left">
        <p className="text-fd-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
          UI
        </p>
        <Quiz questions={questions} />
      </div>
    </div>
  );
}
