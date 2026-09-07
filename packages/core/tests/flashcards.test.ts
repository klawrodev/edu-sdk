import { beforeEach, describe, expect, test, vi } from 'vitest';
import { generateText } from 'ai';
import { createFlashcardsOptionsSchema, createFlashcards } from '../src/flashcard/create-flashcards';
import { eduGeneratorSystemPrompt } from '../src/shared/prompts';
import { InvalidInputError } from '../src/errors/errors';

vi.mock(import('ai'), async(importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        generateText: vi.fn()
    }
});

const mockedGenerateText = vi.mocked(generateText);

describe('createFlashcardsOptionsSchema', () => {
    test('rejects negative number of flashcards', () => {
        const result = createFlashcardsOptionsSchema.safeParse({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: -1
        });
        expect(result.success).toBe(false);
    });

    test('accepts valid flashcards options', () => {
        const result = createFlashcardsOptionsSchema.safeParse({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 2
        });
        expect(result.success).toBe(true);
    });
});

describe('createFlashcards', () => {
    const cards = [
        {
            front: 'What is electricity?',
            back: 'It is the flow of current.'
        },
        {
            front: 'What is an electron?',
            back: 'It is a negative charge.'
        }
    ];

    beforeEach(() => {
        mockedGenerateText.mockReset();
        mockedGenerateText.mockResolvedValue({
            output: { cards }
        } as any);
    });

    test('returns generated flashcards', async () => {
        const result = await createFlashcards({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 2
        });

        expect(result).toEqual(cards);
    });

    test('does not call generateText for invalid input', async () => {
        await expect(createFlashcards({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 0
        })).rejects.toThrow();

        expect(mockedGenerateText).not.toHaveBeenCalled();
    });

    test("uses the provided model", async () => {
        await createFlashcards({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            count: 2
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                model: "google/gemini-3.6-flash"
            })
        );
    });

    test('uses the card count', async () => {
        await createFlashcards({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 10
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining('10 flashcards')
            })
        );
    });

    test("uses the provided difficulty level", async () => {
        await createFlashcards({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            count: 2,
            difficulty: "hard"
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("hard-difficulty")
            })
        );
    });

    test("uses default difficulty level", async () => {
        await createFlashcards({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            count: 2
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("medium-difficulty")
            })
        );
    });

    test('passes the shared system prompt', async () => {
        await createFlashcards({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 2
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                system: eduGeneratorSystemPrompt
            })
        );
    });
});

describe('error handling', () => {
    test('throws InvalidInputError for invalid generation options', async () => {
        await expect(createFlashcards({
            model: 'google/gemini-3.6-flash',
            content: '',
            count: 4
        })).rejects.toBeInstanceOf(InvalidInputError);
    });
});