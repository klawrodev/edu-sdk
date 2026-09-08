import { describe, expect, test } from "vitest";
import { createQuizAttempt, completeQuizAttempt } from "../src/assessment/attempt";
import { InvalidInputError } from "../src/errors/errors";

const questions = [
    {
        id: "question-1",
        question: "What is voltage?",
        options: [
            "Electrical potential difference",
            "Electrical resistance",
            "Electrical current",
            "Electrical power",
        ],
        correctAnswer: 0,
        topics: ["Voltage"],
    },
    {
        id: "question-2",
        question: "What is the unit of current?",
        options: ["Volt", "Ampere", "Ohm", "Watt"],
        correctAnswer: 1,
        topics: ["Current"],
    },
];

describe("createQuizAttempt", () => {
    test("creates an attempt with default id, answers, and startedAt", () => {
        const attempt = createQuizAttempt();

        expect(attempt.id).toEqual(expect.any(String));
        expect(attempt.id.length).toBeGreaterThan(0);
        expect(attempt.answers).toEqual([]);
        expect(attempt.startedAt).toEqual(expect.any(String));
        expect(attempt.completedAt).toBeUndefined();
    });

    test("uses provided id, answers, and startedAt", () => {
        const attempt = createQuizAttempt({
            id: "attempt-1",
            answers: [0, null],
            startedAt: "2026-01-01T00:00:00.000Z",
        });

        expect(attempt).toEqual({
            id: "attempt-1",
            answers: [0, null],
            startedAt: "2026-01-01T00:00:00.000Z",
        });
    });

    test("throws InvalidInputError for an empty id", () => {
        expect(() => createQuizAttempt({ id: "" })).toThrow(InvalidInputError);
    });
});

describe("completeQuizAttempt", () => {
    test("grades correctly and sets completedAt", () => {
        const attempt = createQuizAttempt({ id: "attempt-1" });

        const { attempt: completed, result } = completeQuizAttempt({
            attempt,
            questions,
            answers: [0, 1],
        });

        expect(completed.id).toBe("attempt-1");
        expect(completed.answers).toEqual([0, 1]);
        expect(completed.startedAt).toBe(attempt.startedAt);
        expect(completed.completedAt).toEqual(expect.any(String));
        expect(result).toEqual({
            score: 2,
            total: 2,
            percentage: 100,
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
                    selectedAnswer: 1,
                    correctAnswer: 1,
                    isCorrect: true,
                    isAnswered: true,
                },
            ],
            byTopic: [
                { topic: "Voltage", correct: 1, total: 1, percentage: 100 },
                { topic: "Current", correct: 1, total: 1, percentage: 100 },
            ],
        });
    });

    test("treats null answers as unanswered via gradeQuiz", () => {
        const attempt = createQuizAttempt({ id: "attempt-2" });

        const { result } = completeQuizAttempt({
            attempt,
            questions,
            answers: [null, 1],
        });

        expect(result.score).toBe(1);
        expect(result.percentage).toBe(50);
        expect(result.results[0]).toMatchObject({
            selectedAnswer: null,
            isCorrect: false,
            isAnswered: false,
        });
    });

    test("passes through byTopic from gradeQuiz when questions are tagged", () => {
        const attempt = createQuizAttempt({ id: "attempt-5" });

        const { result } = completeQuizAttempt({
            attempt,
            questions,
            answers: [0, 0],
        });

        expect(result.byTopic).toEqual([
            { topic: "Voltage", correct: 1, total: 1, percentage: 100 },
            { topic: "Current", correct: 0, total: 1, percentage: 0 },
        ]);
    });

    test("throws InvalidInputError when answers length does not match", () => {
        const attempt = createQuizAttempt({ id: "attempt-3" });

        expect(() =>
            completeQuizAttempt({
                attempt,
                questions,
                answers: [0],
            })
        ).toThrow(InvalidInputError);
    });

    test("throws InvalidInputError for an out-of-range answer", () => {
        const attempt = createQuizAttempt({ id: "attempt-4" });

        expect(() =>
            completeQuizAttempt({
                attempt,
                questions,
                answers: [0, 99],
            })
        ).toThrow(InvalidInputError);
    });
});
