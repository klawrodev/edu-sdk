import { beforeEach, describe, expect, test, vi } from "vitest";
import { generateText } from "ai";
import { createQuizOptionsSchema, createQuiz } from '../src/quizzes/create-quiz';
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

describe('createQuizOptionsSchema', () => {
    test('rejects a question count of zero', () => {
        const result = createQuizOptionsSchema.safeParse({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 0
        });
        expect(result.success).toBe(false);
    });

    test('rejects fewer than two options', () => {
        const result = createQuizOptionsSchema.safeParse({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 10,
            numOfOptions: 1
        });
        expect(result.success).toBe(false);
    });

    test('rejects an invalid difficulty level', () => {
        const result = createQuizOptionsSchema.safeParse({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 5,
            difficulty: 'extreme'
        });
        expect(result.success).toBe(false);
    });

    test('accepts valid quiz options', () => {
        const result = createQuizOptionsSchema.safeParse({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 10,
            numOfOptions: 4,
        });
        expect(result.success).toBe(true);
    });
});

describe('createQuiz', () => {
    const questions = [
        {
            question: "What is voltage?",
            options: [
                "Electrical potential difference",
                "Electrical resistance",
                "Electrical current",
                "Electrical power"
            ],
            correctAnswer: 0,
            topics: ["Voltage"],
        },
        {
            question: "What is the unit of current?",
            options: [
                "Volt",
                "Ampere",
                "Ohm",
                "Watt"
            ],
            correctAnswer: 1,
            topics: ["Current"],
        }
    ];

    beforeEach(() => {
        mockedGenerateText.mockReset();
        mockedGenerateText.mockResolvedValue({
            output: {
                title: 'Electricity Quiz',
                description: 'Basic electricity concepts',
                questions,
            }
        } as any);
    });

    test('returns an artifact with stamped question ids', async () => {
        const result = await createQuiz({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 2,
            numOfOptions: 4
        });

        expect(result.title).toBe('Electricity Quiz');
        expect(result.description).toBe('Basic electricity concepts');
        expect(result.metadata).toEqual({
            createdAt: expect.any(String),
            model: 'google/gemini-3.6-flash',
            difficulty: 'medium',
        });
        expect(result.id).toEqual(expect.any(String));
        expect(result.content).toHaveLength(2);
        expect(result.content[0]).toEqual({
            ...questions[0],
            id: expect.any(String),
        });
        expect(result.content[1]).toEqual({
            ...questions[1],
            id: expect.any(String),
        });
    });

    test('does not call generateText for invalid input', async () => {
        await expect(createQuiz({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 0
        })).rejects.toThrow();

        expect(mockedGenerateText).not.toHaveBeenCalled();
    });

    test('uses the right model', async () => {
        await createQuiz({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 2,
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'google/gemini-3.6-flash'
            })
        );
    });

    test('uses the question count', async () => {
        await createQuiz({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 7,
            difficulty: 'medium',
            numOfOptions: 5
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining('7 questions')
            })
        );
    });

    test('uses the difficulty level', async () => {
        await createQuiz({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 9,
            difficulty: 'hard',
            numOfOptions: 3
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining('hard-difficulty')
            })
        );
    });

    test('uses number of options', async () => {
        await createQuiz({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            count: 10,
            numOfOptions: 6
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining('6 answer choices')
            })
        );
    });

    test("uses default generation options", async () => {
        await createQuiz({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            count: 2
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("medium-difficulty")
            })
        );

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("4 answer choices")
            })
        );
    });

    test('passes the shared system prompt', async () => {
        await createQuiz({
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
        await expect(createQuiz({
            model: 'google/gemini-3.6-flash',
            content: '',
            count: 4
        })).rejects.toBeInstanceOf(InvalidInputError);
    });
});