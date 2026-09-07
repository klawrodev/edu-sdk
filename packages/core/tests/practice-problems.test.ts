import { beforeEach, describe, expect, test, vi } from "vitest";
import { generateText } from "ai";
import { createPracticeProblems, createPracticeProblemsOptionsSchema } from '../src/practice-problems/create-practice-problems';
import { eduGeneratorSystemPrompt } from '../src/shared/prompts';
import { InvalidInputError } from "../src/errors/errors";

vi.mock(import('ai'), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        generateText: vi.fn()
    }
});

const mockedGenerateText = vi.mocked(generateText);

describe('createPracticeProblemsOptionsSchema', () => {
    test('rejects negative number of practice problems', () => {
        const result = createPracticeProblemsOptionsSchema.safeParse({
            model: 'openai/gpt-5',
            content: 'Electricity',
            count: -1
        });
        expect(result.success).toBe(false);
    });

    test('accepts valid practice problems options', () => {
        const result = createPracticeProblemsOptionsSchema.safeParse({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 2
        });
        expect(result.success).toBe(true);
    });
});

describe('createPracticeProblems', () => {
    const practiceProblems = [
        {
            question: 'A 12 V battery is connected to a 4 Ω resistor. What current flows through it?',
            hint: 'Think about the relationship between voltage, current, and resistance.',
            answer: '3 A',
            solution: "Using Ohm's law, I = V / R. Therefore, I = 12 / 4 = 3 A."
        }
    ];

    beforeEach(() => {
        mockedGenerateText.mockReset();
        mockedGenerateText.mockResolvedValue({
            output: {
                problems: practiceProblems
            }
        } as any);
    });

    test('returns generated practice problems', async () => {
        const result = await createPracticeProblems({
            model: 'openai/gpt-5',
            content: 'Electricity',
            count: 1
        });

        expect(result).toEqual(practiceProblems);
    });

    test('does not call generateText for invalid input', async () => {
        await expect(createPracticeProblems({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 0
        })).rejects.toThrow();

        expect(mockedGenerateText).not.toHaveBeenCalled();
    });

    test("uses the provided model", async () => {
        await createPracticeProblems({
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

    test('uses the problem count', async () => {
        await createPracticeProblems({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 10
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining('problems: 10')
            })
        );
    });

    test("uses the provided difficulty level", async () => {
        await createPracticeProblems({
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
        await createPracticeProblems({
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
        await createPracticeProblems({
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
        await expect(createPracticeProblems({
            model: 'google/gemini-3.6-flash',
            content: '',
            count: 4
        })).rejects.toBeInstanceOf(InvalidInputError);
    });
});