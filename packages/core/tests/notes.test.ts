import { beforeEach, describe, expect, test, vi } from 'vitest';
import { generateText } from 'ai';
import { createNote, createNoteOptionsSchema } from '../src/notes/create-note';
import { eduGeneratorSystemPrompt } from '../src/shared/prompts';
import { InvalidInputError } from '../src/errors/errors';

vi.mock(import('ai'), async(importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        generateText: vi.fn()
    };
});

const mockedGenerateText = vi.mocked(generateText);

describe('createNotesOptionschema', () => {
    test('rejects invalid length type', () => {
        const result = createNoteOptionsSchema.safeParse({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            difficulty: 'medium',
            length: 'small'
        });
        expect(result.success).toBe(false);
    });

    test('accepts valid notes options', () => {
        const result = createNoteOptionsSchema.safeParse({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            difficulty: 'medium',
            length: 'short'
        });
        expect(result.success).toBe(true);
    });
});

describe('createNote', () => {
    const body = '# Electricity\n\nVoltage is potential difference.';
    beforeEach(() => {
        mockedGenerateText.mockReset();
        mockedGenerateText.mockResolvedValue({
            output: {
                title: 'Electricity Notes',
                description: 'Lecture summary',
                body,
            }
        } as any);
    });

    test('returns an artifact with markdown content', async () => {
        const result = await createNote({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
        });

        expect(result.title).toBe('Electricity Notes');
        expect(result.description).toBe('Lecture summary');
        expect(result.content).toBe(body);
        expect(result.metadata).toEqual({
            createdAt: expect.any(String),
            model: 'google/gemini-3.6-flash',
            difficulty: 'medium',
        });
        expect(result.id).toEqual(expect.any(String));
    });

    test('uses the right model', async () => {
        await createNote({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'google/gemini-3.6-flash'
            })
        );
    });

    test('does not call generateText for invalid input', async () => {
        await expect(createNote({
            model: 'google/gemini-3.6-flash',
            content: '',
            length: 'long'
        })).rejects.toThrow();

        expect(mockedGenerateText).not.toHaveBeenCalled();
    });

    test('uses length', async () => {
        await createNote({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            length: 'long'
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining('long length')
            })
        );
    });

    test('uses difficulty level', async () => {
        await createNote({
            model: 'google/gemini-3.6-flash',
            content: 'Electricity',
            difficulty: 'hard'
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining('hard-difficulty')
            })
        );
    });

    test('uses default generation options', async () => {
        await createNote({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("medium-difficulty")
            })
        );

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("medium length")
            })
        );
    });

    test('passes the shared system prompt', async () => {
        await createNote({
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
        await expect(createNote({
            model: 'google/gemini-3.6-flash',
            content: "",
        })).rejects.toBeInstanceOf(InvalidInputError);
    });
});