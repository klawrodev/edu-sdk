import { describe, expect, test } from "vitest";
import { buildLearnerContext } from "../src/personalization/build-learner-context";
import type { GradeQuizResult } from "../src/quizzes/gradeQuiz";

function quizResult(
    byTopic: GradeQuizResult["byTopic"],
    overrides: Partial<GradeQuizResult> = {}
): GradeQuizResult {
    return {
        score: 0,
        total: 1,
        percentage: 0,
        results: [
            {
                questionIndex: 0,
                selectedAnswer: 0,
                correctAnswer: 0,
                isCorrect: false,
                isAnswered: true,
            },
        ],
        byTopic,
        ...overrides,
    };
}

describe("buildLearnerContext", () => {
    test("returns an empty object when no signals are provided", () => {
        expect(buildLearnerContext()).toEqual({});
        expect(buildLearnerContext({})).toEqual({});
    });

    test("dedupes focus and strong areas case-insensitively", () => {
        const context = buildLearnerContext({
            focusAreas: ["Ohm's law", "ohm's law", " Voltage "],
            strongAreas: ["Current", "current"],
            priorities: ["Prepare for midterm", "prepare for midterm"],
        });

        expect(context).toEqual({
            focusAreas: ["Ohm's law", "Voltage"],
            strongAreas: ["Current"],
            priorities: ["Prepare for midterm"],
        });
    });

    test("folds exam analysis weak topics into focus areas and insights", () => {
        const context = buildLearnerContext({
            examAnalysis: {
                sourceLabel: "Fall midterm",
                weakTopics: ["Resistance", "Power"],
                strongTopics: ["Voltage"],
                suggestedFocusAreas: ["Series circuits"],
                missedConcepts: ["Kirchhoff"],
            },
        });

        expect(context.focusAreas).toEqual([
            "Series circuits",
            "Resistance",
            "Power",
        ]);
        expect(context.strongAreas).toEqual(["Voltage"]);
        expect(context.examInsights).toEqual([
            {
                sourceLabel: "Fall midterm",
                weakTopics: ["Resistance", "Power"],
                missedConcepts: ["Kirchhoff"],
            },
        ]);
    });

    test("merges pastPerformance across quiz results using byTopic", () => {
        const context = buildLearnerContext({
            quizResults: [
                {
                    result: quizResult([
                        { topic: "Voltage", correct: 1, total: 2, percentage: 50 },
                        { topic: "Current", correct: 0, total: 1, percentage: 0 },
                    ]),
                    attemptedAt: "2026-01-01T00:00:00.000Z",
                },
                {
                    result: quizResult([
                        { topic: "voltage", correct: 1, total: 1, percentage: 100 },
                    ]),
                    attemptedAt: "2026-02-01T00:00:00.000Z",
                },
            ],
        });

        expect(context.pastPerformance).toEqual([
            {
                topic: "Voltage",
                correct: 2,
                total: 3,
                lastAttemptAt: "2026-02-01T00:00:00.000Z",
            },
            {
                topic: "Current",
                correct: 0,
                total: 1,
                lastAttemptAt: "2026-01-01T00:00:00.000Z",
            },
        ]);
    });

    test("falls back to questions when byTopic is missing", () => {
        const context = buildLearnerContext({
            quizResults: [
                {
                    result: {
                        score: 1,
                        total: 2,
                        percentage: 50,
                        results: [
                            {
                                questionIndex: 0,
                                selectedAnswer: 0,
                                correctAnswer: 0,
                                isCorrect: true,
                                isAnswered: true,
                            },
                            {
                                questionIndex: 1,
                                selectedAnswer: 0,
                                correctAnswer: 1,
                                isCorrect: false,
                                isAnswered: true,
                            },
                        ],
                    },
                    questions: [
                        {
                            question: "What is voltage?",
                            options: ["A", "B"],
                            correctAnswer: 0,
                            topics: ["Voltage"],
                        },
                        {
                            question: "What is current?",
                            options: ["A", "B"],
                            correctAnswer: 1,
                            topics: ["Current"],
                        },
                    ],
                    attemptedAt: "2026-03-01T00:00:00.000Z",
                },
            ],
        });

        expect(context.pastPerformance).toEqual([
            {
                topic: "Voltage",
                correct: 1,
                total: 1,
                lastAttemptAt: "2026-03-01T00:00:00.000Z",
            },
            {
                topic: "Current",
                correct: 0,
                total: 1,
                lastAttemptAt: "2026-03-01T00:00:00.000Z",
            },
        ]);
    });

    test("keeps provided examInsights and accepts multiple analyses", () => {
        const context = buildLearnerContext({
            examAnalysis: [
                {
                    examInsights: [
                        {
                            sourceLabel: "Quiz 3",
                            weakTopics: ["Capacitance"],
                        },
                    ],
                },
                {
                    weakTopics: ["Inductance"],
                },
            ],
        });

        expect(context.focusAreas).toEqual(["Capacitance", "Inductance"]);
        expect(context.examInsights).toEqual([
            {
                sourceLabel: "Quiz 3",
                weakTopics: ["Capacitance"],
            },
            {
                weakTopics: ["Inductance"],
            },
        ]);
    });
});
