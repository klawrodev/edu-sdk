"use client";

import {
  buildLearnerContext,
  gradeQuiz,
  type PastWorkAnalysis,
  type QuizQuestion,
  type StudySessionContent,
} from "edu-sdk";
import { StudySession } from "@edu-sdk/react";
import { useMemo } from "react";

const pastWorkAnalysis: PastWorkAnalysis = {
  weakTopics: ["Ohm's law", "Series circuits"],
  strongTopics: ["Voltage"],
  missedConcepts: ["Equivalent resistance"],
  suggestedFocusAreas: ["Circuit analysis"],
  notes: "Missed multi-step resistor problems on the midterm.",
  sourceLabel: "Fall midterm",
};

const taggedQuestions: QuizQuestion[] = [
  {
    id: "pq-1",
    question: "What is Ohm's law?",
    options: ["V = IR", "P = IV", "Q = CV", "F = qE"],
    correctAnswer: 0,
    topics: ["Ohm's law"],
  },
  {
    id: "pq-2",
    question: "Two 2 Ω resistors in series have what equivalent resistance?",
    options: ["1 Ω", "2 Ω", "4 Ω", "0.5 Ω"],
    correctAnswer: 2,
    topics: ["Series circuits", "Ohm's law"],
  },
];


const demoAnswers = [0, 0] as const;

const metadata = {
  createdAt: "2026-01-01T00:00:00.000Z",
  model: "playground-fixture",
  difficulty: "medium" as const,
};

function makePersonalizedSession(goals: string[]): StudySessionContent {
  return {
    topic: "Electricity — focus on weak areas",
    goals:
      goals.length > 0
        ? goals
        : ["Review Ohm's law", "Practice series circuits"],
    tips: [
      "Spend more time on topics you missed on the midterm",
      "Use Skip only after attempting each block",
    ],
    totalDurationMinutes: 5,
    blocks: [
      {
        id: "p-block-1",
        type: "quiz",
        title: "Weak-topic check",
        durationMinutes: 3,
        instructions: "These questions target Ohm's law and series circuits.",
        materialKey: "quiz",
      },
      {
        id: "p-block-2",
        type: "notes",
        title: "Skim focus notes",
        durationMinutes: 2,
        instructions: "Review the notes on your focus areas.",
        materialKey: "notes",
      },
    ],
    materials: {
      quiz: {
        id: "personalized-quiz",
        title: "Focus quiz",
        metadata,
        content: taggedQuestions,
      },
      notes: {
        id: "personalized-notes",
        title: "Focus notes",
        metadata,
        content:
          "# Focus notes\n\n- **Ohm's law:** V = IR\n- **Series circuits:** resistances add (R = R1 + R2)\n- Revisit equivalent resistance before the next quiz.",
      },
    },
  };
}

export function PersonalizationDemo() {
  const grade = useMemo(
    () =>
      gradeQuiz({
        questions: taggedQuestions,
        answers: [...demoAnswers],
      }),
    []
  );

  const learnerContext = useMemo(
    () =>
      buildLearnerContext({
        focusAreas: ["Circuit analysis"],
        examAnalysis: pastWorkAnalysis,
        quizResults: [
          {
            result: grade,
            attemptedAt: "2026-03-01T12:00:00.000Z",
          },
        ],
      }),
    [grade]
  );

  const session = useMemo(
    () => makePersonalizedSession(learnerContext.focusAreas ?? []),
    [learnerContext.focusAreas]
  );

  return (
    <section>
      <h2>Personalization loop</h2>
      <p>
        Demo of past work + quiz history →{" "}
        <code>buildLearnerContext</code> → a session shaped for those weak
        areas. Live <code>analyzePastWork</code> /{" "}
        <code>createStudySession</code> use the same context shape with a model.
      </p>

      <h3>1. Past work analysis (fixture)</h3>
      <pre>{JSON.stringify(pastWorkAnalysis, null, 2)}</pre>

      <h3>2. Quiz grade with topics</h3>
      <pre>{JSON.stringify(grade.byTopic, null, 2)}</pre>

      <h3>3. LearnerContext</h3>
      <pre>{JSON.stringify(learnerContext, null, 2)}</pre>

      <h3>4. Personalized study session</h3>
      <StudySession session={session} />
    </section>
  );
}
