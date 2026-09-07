import { generateText } from "ai";
import { z } from 'zod';
import { generationOptionsSchema } from "../shared/schema.js";
import { eduGeneratorSystemPrompt, buildGenerationPrompt } from "../shared/prompts.js";
import { InvalidInputError } from "../errors/errors.js";

export const createNoteOptionsSchema = generationOptionsSchema.extend({
    length: z.enum(['short', 'medium', 'long']).optional()
});

export type CreateNoteOptions = z.infer<typeof createNoteOptionsSchema>;

const noteSchema = z.string().min(1).describe('The content of the notes in markdown');

export type Note = z.infer<typeof noteSchema>;

const lengthGuidance = {
    short: 'Keep the note brief and focused on the most essential points.',
    medium: 'Aim for a balanced note with clear coverage of the main ideas.',
    long: 'Provide thorough coverage with enough detail to support deeper study.'
} as const;

export async function createNote(options: CreateNoteOptions): Promise<Note> {
    const result = createNoteOptionsSchema.safeParse(options);
    if (!result.success) {
        throw new InvalidInputError(result.error.issues[0]?.message ?? "Invalid note generation options");
    }

    const { model, content, difficulty = 'medium', length = 'medium' } = result.data;

    const { text } = await generateText({
        model,
        system: eduGeneratorSystemPrompt,
        prompt: buildGenerationPrompt({
            task: `Create a ${difficulty}-difficulty note of approximately ${length} length using the provided content.`,
            rules: [
                'Format the note in Markdown.',
                'Use headings to organize sections and bold important terms and concepts.',
                lengthGuidance[length],
                'Use depth and vocabulary appropriate to the requested difficulty.',
                'Stay grounded in the provided content and do not introduce unsupported information.',
                'Match the requested difficulty level.'
            ],
            difficulty,
            content
        })
    });

    return text;
}
