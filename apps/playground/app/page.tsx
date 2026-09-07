import {
  Flashcards,
  PracticeProblems,
  Quiz,
  StudyGuide
} from "@edu-sdk/react";

const flashcards = [
  {
    id: "card-1",
    front: "What is voltage?",
    back: "Electrical potential difference."
  },
  {
    id: "card-2",
    front: "What is current?",
    back: "The flow of electric charge."
  }
];

const questions = [
  {
    id: "q-1",
    question: "What is the unit of electric current?",
    options: ["Volt", "Ampere", "Ohm", "Watt"],
    correctAnswer: 1
  },
  {
    id: "q-2",
    question: "Which quantity is measured in ohms?",
    options: ["Voltage", "Current", "Resistance", "Power"],
    correctAnswer: 2
  }
];

const guide = {
  id: "guide-1",
  title: "Electricity",
  metadata: {
    createdAt: "2026-01-01T00:00:00.000Z",
    model: "google/gemini-3.6-flash",
    difficulty: "medium" as const,
  },
  content: {
    summary:
      "Electricity describes phenomena associated with electric charge and its movement.",
    keyConcepts: [
      {
        concept: "Voltage",
        explanation:
          "Voltage represents electric potential difference between two points."
      },
      {
        concept: "Current",
        explanation:
          "Current describes the rate at which electric charge flows."
      }
    ],
    reviewQuestions: [
      "What is voltage?",
      "How are voltage, current, and resistance related?"
    ]
  }
};

const problems = [
  {
    id: "p-1",
    question:
      "A 12 V battery is connected to a 4 Ω resistor. What current flows?",
    hint:
      "Use the relationship between voltage, current, and resistance.",
    answer: "3 A",
    solution:
      "Using Ohm's law, I = V / R = 12 / 4 = 3 A."
  },
  {
    id: "p-2",
    question: 'A resistor has 6 V across it and carries 2 A. What is its resistance?',
    hint: "Use Ohm's law to relate voltage, current, and resistance.",
    answer: '3 Ω',
    solution: "Using Ohm's law, R = V / I. Therefore, R = 6 / 2 = 3 Ω."
  }
];

export default function Page() {
  return (
    <main>
      <h1>Edu SDK Playground</h1>

      <section>
        <h2>Flashcards</h2>
        <Flashcards flashcards={flashcards} />
      </section>

      <section>
        <h2>Quiz</h2>
        <Quiz questions={questions} />
      </section>

      <section>
        <h2>Study Guide</h2>
        <StudyGuide studyGuide={guide} />
      </section>

      <section>
        <h2>Practice Problems</h2>
        <PracticeProblems problems={problems} />
      </section>
    </main>
  );
}
