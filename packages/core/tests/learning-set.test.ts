import { beforeEach, describe, expect, test, vi } from "vitest";
import { createLearningSet, createLearningSetOptionsSchema } from "../src/learning-set/create-learning-set";
import { createQuiz } from "../src/quizzes/create-quiz";
import { createFlashcards } from "../src/flashcard/create-flashcards";
import { createNote } from "../src/notes/create-note";
import { createPracticeProblems } from "../src/practice-problems/create-practice-problems";
import { createStudyGuide } from "../src/studyguide/create-studyguide";
import { InvalidInputError } from "../src/errors/errors";

vi.mock(import("../src/quizzes/create-quiz"), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        createQuiz: vi.fn(),
    };
});

vi.mock(import("../src/flashcard/create-flashcards"), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        createFlashcards: vi.fn(),
    };
});

vi.mock(import("../src/notes/create-note"), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        createNote: vi.fn(),
    };
});

vi.mock(import("../src/practice-problems/create-practice-problems"), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        createPracticeProblems: vi.fn(),
    };
});

vi.mock(import("../src/studyguide/create-studyguide"), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        createStudyGuide: vi.fn(),
    };
});

const mockedCreateQuiz = vi.mocked(createQuiz);
const mockedCreateFlashcards = vi.mocked(createFlashcards);
const mockedCreateNote = vi.mocked(createNote);
const mockedCreatePracticeProblems = vi.mocked(createPracticeProblems);
const mockedCreateStudyGuide = vi.mocked(createStudyGuide);

const quiz = {
    id: "quiz-1",
    title: "Electricity Quiz",
    description: "Quiz description",
    metadata: {
        createdAt: "2026-01-01T00:00:00.000Z",
        model: "google/gemini-3.6-flash",
        difficulty: "medium" as const,
    },
    content: [
        {
            id: "q1",
            question: "What is voltage?",
            options: ["Electrical potential difference", "Resistance", "Current", "Power"],
            correctAnswer: 0,
        },
    ],
};

const flashcards = {
    id: "cards-1",
    title: "Electricity Cards",
    metadata: {
        createdAt: "2026-01-01T00:00:00.000Z",
        model: "google/gemini-3.6-flash",
        difficulty: "medium" as const,
    },
    content: [{ id: "c1", front: "Voltage", back: "Electrical potential difference" }],
};

const notes = {
    id: "note-1",
    title: "Electricity Notes",
    description: "Lecture notes",
    metadata: {
        createdAt: "2026-01-01T00:00:00.000Z",
        model: "google/gemini-3.6-flash",
        difficulty: "medium" as const,
    },
    content: "# Electricity\n\nVoltage is potential difference.",
};

const practiceProblems = {
    id: "pp-1",
    title: "Electricity Problems",
    description: "Practice problems",
    metadata: {
        createdAt: "2026-01-01T00:00:00.000Z",
        model: "google/gemini-3.6-flash",
        difficulty: "medium" as const,
    },
    content: [
        {
            id: "p1",
            question: "Calculate voltage given V = IR",
            hint: "Use Ohm's law",
            answer: "10 V",
            solution: "V = 2 * 5 = 10",
        },
    ],
};

const studyGuide = {
    id: "sg-1",
    title: "Electricity Study Guide",
    description: "Study guide description",
    metadata: {
        createdAt: "2026-01-01T00:00:00.000Z",
        model: "google/gemini-3.6-flash",
        difficulty: "medium" as const,
    },
    content: {
        summary: "Electricity basics",
        keyConcepts: [{ concept: "Voltage", explanation: "Potential difference" }],
        reviewQuestions: ["What is voltage?"],
    },
};

describe("createLearningSetOptionsSchema", () => {
    test("rejects an empty include array", () => {
        const result = createLearningSetOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            include: [],
        });
        expect(result.success).toBe(false);
    });

    test("rejects duplicate include types", () => {
        const result = createLearningSetOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            include: [
                { type: "quiz", count: 5 },
                { type: "quiz", count: 3 },
            ],
        });
        expect(result.success).toBe(false);
    });

    test("rejects a quiz count of zero", () => {
        const result = createLearningSetOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            include: [{ type: "quiz", count: 0 }],
        });
        expect(result.success).toBe(false);
    });

    test("accepts valid include options", () => {
        const result = createLearningSetOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            include: [
                { type: "quiz", count: 5, numOfOptions: 4 },
                { type: "flashcards", count: 8 },
                { type: "practiceProblems", count: 3 },
                { type: "notes", length: "short" },
                { type: "studyGuide" },
            ],
        });
        expect(result.success).toBe(true);
    });
});

describe("createLearningSet", () => {
    beforeEach(() => {
        mockedCreateQuiz.mockReset();
        mockedCreateFlashcards.mockReset();
        mockedCreateNote.mockReset();
        mockedCreatePracticeProblems.mockReset();
        mockedCreateStudyGuide.mockReset();
        mockedCreateQuiz.mockResolvedValue(quiz);
        mockedCreateFlashcards.mockResolvedValue(flashcards);
        mockedCreateNote.mockResolvedValue(notes);
        mockedCreatePracticeProblems.mockResolvedValue(practiceProblems);
        mockedCreateStudyGuide.mockResolvedValue(studyGuide);
    });

    test("returns an artifact with only requested include items", async () => {
        const result = await createLearningSet({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            include: [
                { type: "quiz", count: 5 },
                { type: "notes", length: "medium" },
            ],
        });

        expect(result.title).toBe(notes.title);
        expect(result.description).toBe(notes.description);
        expect(result.id).toEqual(expect.any(String));
        expect(result.metadata).toEqual({
            createdAt: expect.any(String),
            model: "google/gemini-3.6-flash",
            difficulty: "medium",
        });
        expect(result.content).toEqual({ quiz, notes });
        expect(mockedCreateFlashcards).not.toHaveBeenCalled();
        expect(mockedCreatePracticeProblems).not.toHaveBeenCalled();
        expect(mockedCreateStudyGuide).not.toHaveBeenCalled();
    });

    test("passes shared and nested options through to each helper", async () => {
        const learnerContext = {
            focusAreas: ["Ohm's law"],
            strongAreas: ["Voltage"],
        };

        await createLearningSet({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            learnerContext,
            include: [
                { type: "quiz", count: 5, numOfOptions: 3 },
                { type: "flashcards", count: 8 },
                { type: "practiceProblems", count: 4 },
                { type: "notes", length: "long" },
                { type: "studyGuide" },
            ],
        });

        expect(mockedCreateQuiz).toHaveBeenCalledWith({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            learnerContext,
            count: 5,
            numOfOptions: 3,
        });
        expect(mockedCreateFlashcards).toHaveBeenCalledWith({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            learnerContext,
            count: 8,
        });
        expect(mockedCreatePracticeProblems).toHaveBeenCalledWith({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            learnerContext,
            count: 4,
        });
        expect(mockedCreateNote).toHaveBeenCalledWith({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            learnerContext,
            length: "long",
        });
        expect(mockedCreateStudyGuide).toHaveBeenCalledWith({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            learnerContext,
        });
    });

    test("omits learnerContext on nested helpers when not provided", async () => {
        await createLearningSet({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            include: [{ type: "quiz", count: 2 }],
        });

        expect(mockedCreateQuiz).toHaveBeenCalledWith({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "medium",
            learnerContext: undefined,
            count: 2,
            numOfOptions: undefined,
        });
    });

    test("uses default difficulty when omitted", async () => {
        await createLearningSet({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            include: [{ type: "studyGuide" }],
        });

        expect(mockedCreateStudyGuide).toHaveBeenCalledWith(
            expect.objectContaining({ difficulty: "medium" })
        );
    });

    test("falls back to studyGuide title when notes are omitted", async () => {
        const result = await createLearningSet({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            include: [{ type: "studyGuide" }, { type: "quiz", count: 2 }],
        });

        expect(result.title).toBe(studyGuide.title);
        expect(result.description).toBe(studyGuide.description);
        expect(result.content).toEqual({ studyGuide, quiz });
    });

    test("throws InvalidInputError and does not call helpers for invalid input", async () => {
        await expect(
            createLearningSet({
                model: "google/gemini-3.6-flash",
                content: "",
                include: [{ type: "quiz", count: 5 }],
            })
        ).rejects.toBeInstanceOf(InvalidInputError);

        expect(mockedCreateQuiz).not.toHaveBeenCalled();
        expect(mockedCreateFlashcards).not.toHaveBeenCalled();
        expect(mockedCreateNote).not.toHaveBeenCalled();
        expect(mockedCreatePracticeProblems).not.toHaveBeenCalled();
        expect(mockedCreateStudyGuide).not.toHaveBeenCalled();
    });
});
