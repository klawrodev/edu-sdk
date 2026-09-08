import { describe, expect, test } from "vitest";
import { gradeQuiz, gradeQuizOptionsSchema } from "../src/quizzes/gradeQuiz";
import { InvalidInputError } from "../src/errors/errors";

const questions = [
    {
        id: "q-1",
        question: "What is voltage?",
        options: [
            "Electrical potential difference",
            "Electrical resistance",
            "Electrical current",
            "Electrical power",
        ],
        correctAnswer: 0,
    },
    {
        id: "q-2",
        question: "What is the unit of current?",
        options: ["Volt", "Ampere", "Ohm", "Watt"],
        correctAnswer: 1,
    },
];

describe("gradeQuizOptionsSchema", () => {
    test("rejects an empty questions array", () => {
        const result = gradeQuizOptionsSchema.safeParse({
            questions: [],
            answers: [],
        });
        expect(result.success).toBe(false);
    });

    test("rejects answers with a different length than questions", () => {
        const result = gradeQuizOptionsSchema.safeParse({
            questions,
            answers: [0],
        });
        expect(result.success).toBe(false);
    });

    test("rejects an out-of-range answer index", () => {
        const result = gradeQuizOptionsSchema.safeParse({
            questions,
            answers: [0, 4],
        });
        expect(result.success).toBe(false);
    });

    test("accepts null answers and valid option indices", () => {
        const result = gradeQuizOptionsSchema.safeParse({
            questions,
            answers: [null, 1],
        });
        expect(result.success).toBe(true);
    });

    test("accepts questions with optional topics", () => {
        const result = gradeQuizOptionsSchema.safeParse({
            questions: [
                { ...questions[0], topics: ["Voltage"] },
                questions[1],
            ],
            answers: [0, 1],
        });
        expect(result.success).toBe(true);
    });
});

describe("gradeQuiz", () => {
    test("returns a perfect score when every answer is correct", () => {
        const result = gradeQuiz({
            questions,
            answers: [0, 1],
        });

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
        });
        expect(result.byTopic).toBeUndefined();
    });

    test("scores mixed correct and incorrect answers", () => {
        const result = gradeQuiz({
            questions,
            answers: [0, 0],
        });

        expect(result.score).toBe(1);
        expect(result.total).toBe(2);
        expect(result.percentage).toBe(50);
        expect(result.results[0]?.isCorrect).toBe(true);
        expect(result.results[1]?.isCorrect).toBe(false);
    });

    test("treats unanswered null answers as incorrect", () => {
        const result = gradeQuiz({
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
        expect(result.results[1]?.isCorrect).toBe(true);
    });

    test("omits byTopic when no questions have topics", () => {
        const result = gradeQuiz({
            questions,
            answers: [0, 1],
        });

        expect(result.byTopic).toBeUndefined();
    });

    test("aggregates byTopic for tagged questions", () => {
        const result = gradeQuiz({
            questions: [
                { ...questions[0], topics: ["Voltage"] },
                { ...questions[1], topics: ["Current"] },
            ],
            answers: [0, 0],
        });

        expect(result.byTopic).toEqual([
            { topic: "Voltage", correct: 1, total: 1, percentage: 100 },
            { topic: "Current", correct: 0, total: 1, percentage: 0 },
        ]);
    });

    test("counts multi-topic questions toward each topic", () => {
        const result = gradeQuiz({
            questions: [
                {
                    ...questions[0],
                    topics: ["Voltage", "Circuits"],
                },
            ],
            answers: [0],
        });

        expect(result.byTopic).toEqual([
            { topic: "Voltage", correct: 1, total: 1, percentage: 100 },
            { topic: "Circuits", correct: 1, total: 1, percentage: 100 },
        ]);
    });

    test("treats unanswered tagged questions as incorrect in byTopic", () => {
        const result = gradeQuiz({
            questions: [
                { ...questions[0], topics: ["Voltage"] },
                { ...questions[1], topics: ["Current"] },
            ],
            answers: [null, 1],
        });

        expect(result.byTopic).toEqual([
            { topic: "Voltage", correct: 0, total: 1, percentage: 0 },
            { topic: "Current", correct: 1, total: 1, percentage: 100 },
        ]);
    });

    test("ignores untagged questions when building byTopic", () => {
        const result = gradeQuiz({
            questions: [
                { ...questions[0], topics: ["Voltage"] },
                questions[1],
            ],
            answers: [0, 0],
        });

        expect(result.score).toBe(1);
        expect(result.byTopic).toEqual([
            { topic: "Voltage", correct: 1, total: 1, percentage: 100 },
        ]);
    });

    test("throws InvalidInputError when answers length does not match", () => {
        expect(() =>
            gradeQuiz({
                questions,
                answers: [0],
            })
        ).toThrow(InvalidInputError);
    });

    test("throws InvalidInputError for an out-of-range answer", () => {
        expect(() =>
            gradeQuiz({
                questions,
                answers: [0, 99],
            })
        ).toThrow(InvalidInputError);
    });

    test("throws InvalidInputError for empty questions", () => {
        expect(() =>
            gradeQuiz({
                questions: [],
                answers: [],
            })
        ).toThrow(InvalidInputError);
    });
});
