import { beforeEach, describe, expect, test, vi } from 'vitest';
import { generateText } from 'ai';
import { createStudyGuide, createStudyGuideOptionsSchema } from '../src/studyguide/create-studyguide';
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

describe('createStudyGuideOptionsSchema', () => {
    test('accepts valid studyguide options', () => {
        const result = createStudyGuideOptionsSchema.safeParse({
            model: 'openai/gpt-5',
            content: 'Electricity',
            difficulty: 'hard'
        });

        expect(result.success).toBe(true);
    });
});

describe('createStudyGuide', () => {
    const studyguide = {
        title: 'Electricity',
        summary: 'Electricity is light.',
        keyConcepts: [
            {
                concept: 'Electrons a negatively charged.',
                explanation: 'They are minus.'
            },
        ],
        reviewQuestions: ['What is electricity?']
    }

    beforeEach(() => {
        mockedGenerateText.mockReset();
        mockedGenerateText.mockResolvedValue({
            output: studyguide
        } as any);
    });

    test('returns generated study guide', async () => {
        const result = await createStudyGuide({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity'
        });

        expect(result).toEqual(studyguide);
    });

    test('does not call generateText for invalid input', async () => {
        await expect(createStudyGuide({
            model: '',
            content: 'Electricity'
        })).rejects.toThrow();

        expect(mockedGenerateText).not.toHaveBeenCalled();
    });

    test("uses the provided model", async () => {
        await createStudyGuide({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                model: "google/gemini-3.6-flash"
            })
        );
    });

    test("uses the provided difficulty level", async () => {
        await createStudyGuide({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            difficulty: "hard"
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("hard-difficulty")
            })
        );
    });

    test("uses default difficulty level", async () => {
        await createStudyGuide({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("medium-difficulty")
            })
        );
    });

    test('passes the shared system prompt', async () => {
        await createStudyGuide({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity'
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
        await expect(createStudyGuide({
            model: 'google/gemini-3.6-flash',
            content: '',
        })).rejects.toBeInstanceOf(InvalidInputError);
    });
});