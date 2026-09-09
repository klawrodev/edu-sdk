# edu-sdk

Generate learning materials from content using a language model.

Pass a `model` (string model ID or AI SDK `LanguageModel`), `content` (`string` or file bytes), optional `difficulty` (`easy` | `medium` | `hard`), and optional `learnerContext` for personalization.

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

The SDK is **stateless** — your app owns persistence of learner history and context. Generation stays grounded in `content`; `learnerContext` only biases what to emphasize.

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
  id: string;              // required (SDK-stamped on generate)
  question: string;
  options: string[];
  correctAnswer: number;   // zero-indexed
  topics?: string[];       // 1–4 tags when generated; optional for hand-authored
}
```

Generation always produces **1–4** `topics` per question. On the public type, `topics` is optional so hand-authored quizzes can omit them. `id` is always required for grading, assessment, and React `<Quiz>`.

### File content

`content` accepts a string or a file object. Use `extractContent` when you want the text first (inspect, cache, trim), or pass the file straight into any `create*` helper.

```ts
import { extractContent, createQuiz } from "edu-sdk";
import { readFile } from "node:fs/promises";

const data = await readFile("./lecture.pdf");

// Pass a file straight into a generator
const quiz = await createQuiz({
  model: "google/gemini-3.6-flash",
  content: {
    type: "file",
    data,
    mimeType: "application/pdf",
    filename: "lecture.pdf",
  },
  count: 10,
});

// Or extract first (inspect / cache / trim), then generate
const { text } = await extractContent({
  type: "file",
  data,
  mimeType: "application/pdf",
  filename: "lecture.pdf",
});

const quizFromText = await createQuiz({
  model: "google/gemini-3.6-flash",
  content: text,
  count: 10,
});
```

Supported in v1: `application/pdf` (text-based), `text/plain`, `text/markdown` (plus `.pdf` / `.txt` / `.md` filename fallbacks). Your app still owns uploads and storage.

## API

| Function | Description |
| --- | --- |
| `extractContent` | Extract text from PDF / text / markdown bytes |
| `createQuiz` | Multiple-choice questions |
| `createLearningSet` | Choose quiz, flashcards, practice problems, notes, and/or study guide in one call |
| `gradeQuiz` | Score submitted quiz answers (optional `byTopic` when questions have `topics`) |
| `createQuizAttempt` | Start a quiz attempt record |
| `completeQuizAttempt` | Finish an attempt and grade it |
| `createFlashcards` | Front/back flashcards |
| `createStudyGuide` | Structured study guide |
| `createPracticeProblems` | Practice problems with solutions |
| `createNote` | Markdown notes (no React component) |
| `createStudySession` | Timed agenda plus matching materials |
| `buildLearnerContext` | Merge focus / exam / quiz signals into `LearnerContext` |
| `analyzePastWork` | LLM diagnostic of past exams/homework → `Artifact<PastWorkAnalysis>` |

Shared options on every create call:

| Option | Type | Required |
| --- | --- | --- |
| `model` | `string \| LanguageModel` | Yes |
| `content` | `string \| FileContent` | Yes |
| `difficulty` | `"easy" \| "medium" \| "hard"` | No |
| `learnerContext` | `LearnerContext` | No |

Some helpers take extra options (for example `count` on `createQuiz`).

## Personalization

Closed loop:

1. `analyzePastWork` (past exams/homework) and/or `gradeQuiz` (`byTopic` when questions have `topics`)
2. `buildLearnerContext` → `LearnerContext`
3. Pass `learnerContext` into `create*` / `createLearningSet` / `createStudySession`

```ts
import {
  analyzePastWork,
  buildLearnerContext,
  createStudySession,
  gradeQuiz,
} from "edu-sdk";

const analysis = await analyzePastWork({
  model,
  content: pastExam,
  sourceLabel: "Fall midterm",
});

const grade = gradeQuiz({ questions: quiz.content, answers });

const learnerContext = buildLearnerContext({
  focusAreas: ["Ohm's law"],
  examAnalysis: analysis.content,
  quizResults: [{ result: grade }],
});

await createStudySession({
  model,
  content: chapterText,
  durationMinutes: 45,
  learnerContext,
});
```

Generated quizzes, flashcards, practice problems, and study-guide key concepts get topic tags. Notes can take `learnerContext` but do not carry topic tags on the body.

## Breaking changes (0.8)

- Use `QuizQuestion` only (there is no separate grade-question type)
- Question `id` is required for `gradeQuiz`, assessment, and React `<Quiz>`

## Errors

Options are validated with Zod before the model is called. Invalid options throw `InvalidInputError`. Unsupported or empty files throw `UnsupportedContentError` / `ContentExtractionError`. All extend `EduSDKError`.

```ts
import {
  InvalidInputError,
  UnsupportedContentError,
  ContentExtractionError,
  EduSDKError,
} from "edu-sdk";
```

## UI

For React components that render these outputs, use [`@edu-sdk/react`](../react/README.md). Pass `artifact.content` into list-based components (`Quiz`, `Flashcards`, `PracticeProblems`); pass the full artifact into `StudyGuide`.

## Links

- [Monorepo README](../../README.md)
- [GitHub](https://github.com/klawrodev/edu-sdk)

## License

MIT © 2026 Oluwatobiloba Adejumo. See [LICENSE](../../LICENSE).
