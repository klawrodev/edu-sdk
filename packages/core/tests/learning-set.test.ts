import { beforeEach, describe, expect, test, vi } from "vitest";
import { createLearningSet, createLearningSetOptionsSchema } from "../src/learning-set/create-learning-set";
import { createQuiz } from "../src/quizzes/create-quiz";
import { createFlashcards } from "../src/flashcard/create-flashcards";
import { createNote } from "../src/notes/create-note";
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

const mockedCreateQuiz = vi.mocked(createQuiz);
const mockedCreateFlashcards = vi.mocked(createFlashcards);
const mockedCreateNote = vi.mocked(createNote);

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

describe("createLearningSetOptionsSchema", () => {
    test("rejects a quiz count of zero", () => {
        const result = createLearningSetOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            quiz: { count: 0 },
            flashcards: { count: 5 },
        });
        expect(result.success).toBe(false);
    });

    test("accepts valid learning set options", () => {
        const result = createLearningSetOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            quiz: { count: 5, numOfOptions: 4 },
            flashcards: { count: 8 },
            notes: { length: "short" },
        });
        expect(result.success).toBe(true);
    });
});

describe("createLearningSet", () => {
    beforeEach(() => {
        mockedCreateQuiz.mockReset();
        mockedCreateFlashcards.mockReset();
        mockedCreateNote.mockReset();
        mockedCreateQuiz.mockResolvedValue(quiz);
        mockedCreateFlashcards.mockResolvedValue(flashcards);
        mockedCreateNote.mockResolvedValue(notes);
    });

    test("returns an artifact wrapping quiz, flashcards, and notes", async () => {
        const result = await createLearningSet({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            quiz: { count: 5 },
            flashcards: { count: 8 },
        });

        expect(result.title).toBe(notes.title);
        expect(result.description).toBe(notes.description);
        expect(result.id).toEqual(expect.any(String));
        expect(result.metadata).toEqual({
            createdAt: expect.any(String),
            model: "google/gemini-3.6-flash",
            difficulty: "medium",
        });
        expect(result.content).toEqual({ quiz, flashcards, notes });
    });

    test("passes shared and nested options through to each helper", async () => {
        await createLearningSet({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            quiz: { count: 5, numOfOptions: 3 },
            flashcards: { count: 8 },
            notes: { length: "long" },
        });

        expect(mockedCreateQuiz).toHaveBeenCalledWith({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            count: 5,
            numOfOptions: 3,
        });
        expect(mockedCreateFlashcards).toHaveBeenCalledWith({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            count: 8,
        });
        expect(mockedCreateNote).toHaveBeenCalledWith({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard",
            length: "long",
        });
    });

    test("uses default difficulty when omitted", async () => {
        await createLearningSet({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            quiz: { count: 2 },
            flashcards: { count: 3 },
        });

        expect(mockedCreateQuiz).toHaveBeenCalledWith(
            expect.objectContaining({ difficulty: "medium" })
        );
        expect(mockedCreateFlashcards).toHaveBeenCalledWith(
            expect.objectContaining({ difficulty: "medium" })
        );
        expect(mockedCreateNote).toHaveBeenCalledWith(
            expect.objectContaining({ difficulty: "medium" })
        );
    });

    test("throws InvalidInputError and does not call helpers for invalid input", async () => {
        await expect(
            createLearningSet({
                model: "google/gemini-3.6-flash",
                content: "",
                quiz: { count: 5 },
                flashcards: { count: 8 },
            })
        ).rejects.toBeInstanceOf(InvalidInputError);

        expect(mockedCreateQuiz).not.toHaveBeenCalled();
        expect(mockedCreateFlashcards).not.toHaveBeenCalled();
        expect(mockedCreateNote).not.toHaveBeenCalled();
    });
});
