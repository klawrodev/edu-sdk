# edu-sdk

Generate learning materials from content using a language model.

Pass a `model` (string model ID or AI SDK `LanguageModel`), `content`, and optional `difficulty` (`easy` | `medium` | `hard`).

Every generator returns an `Artifact<T>`:

```ts
{
  id: string;
  title: string;
  description?: string;
  metadata: {
    createdAt: string;
    model: string;
    difficulty: "easy" | "medium" | "hard";
  };
  content: T;
}
```

## Install

```bash
pnpm add edu-sdk
```

## Quick start

```ts
import { createQuiz } from "edu-sdk";

const quiz = await createQuiz({
  model: "google/gemini-3.6-flash",
  content,
  count: 10,
  difficulty: "medium",
});

console.log(quiz.title, quiz.content);
```

`createQuiz` returns `Promise<Artifact<QuizQuestion[]>>`. Each question in `content` looks like:

```ts
{
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // zero-indexed
}
```

## API

| Function | Description |
| --- | --- |
| `createQuiz` | Multiple-choice questions |
| `createLearningSet` | Choose quiz, flashcards, practice problems, notes, and/or study guide in one call |
| `gradeQuiz` | Score submitted quiz answers |
| `createQuizAttempt` | Start a quiz attempt record |
| `completeQuizAttempt` | Finish an attempt and grade it |
| `createFlashcards` | Front/back flashcards |
| `createStudyGuide` | Structured study guide |
| `createPracticeProblems` | Practice problems with solutions |
| `createNote` | Markdown notes (no React component) |

Shared options on every create call:

| Option | Type | Required |
| --- | --- | --- |
| `model` | `string \| LanguageModel` | Yes |
| `content` | `string` | Yes |
| `difficulty` | `"easy" \| "medium" \| "hard"` | No |

Some surfaces take extra options (for example `count` on `createQuiz`).

## Errors

Options are validated with Zod before the model is called. Invalid options throw `InvalidInputError`, which extends `EduSDKError`.

```ts
import { InvalidInputError, EduSDKError } from "edu-sdk";
```

## UI

For React components that render these outputs, use [`@edu-sdk/react`](../react/README.md). Pass `artifact.content` into list-based components (`Quiz`, `Flashcards`, `PracticeProblems`); pass the full artifact into `StudyGuide`.

## Links

- [Monorepo README](../../README.md)
- [GitHub](https://github.com/klawrodev/edu-sdk)

## License

MIT © 2026 Oluwatobiloba Adejumo. See [LICENSE](../../LICENSE).
