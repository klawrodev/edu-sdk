import { generateText, Output } from 'ai';
import { z } from 'zod';
import { generationOptionsSchema } from "../shared/schema.js";
import { eduGeneratorSystemPrompt, buildGenerationPrompt } from '../shared/prompts.js';
import { InvalidInputError } from '../errors/errors.js';


export const createStudyGuideOptionsSchema = generationOptionsSchema;
export type CreateStudyGuideOptions = z.infer<typeof createStudyGuideOptionsSchema>;

const studyGuideSchema = z.object({
    title: z.string().min(1).describe('A concise title for the study guide'),
    summary: z.string().min(1).describe('A concise but complete summary of the material'),
    keyConcepts: z.array(
        z.object({
            concept: z.string().min(1).describe('The name of an important concept'),
            explanation: z.string().min(1).describe('A clear, accurate explanation of the concept')
        })
    ).min(1).describe('The most important concepts a student should understand'),
    reviewQuestions: z.array(z.string().min(1)).min(1).describe('Review questions that test understanding rather than simple memorization')
});
export type StudyGuide = z.infer<typeof studyGuideSchema>;

export async function createStudyGuide(options: CreateStudyGuideOptions): Promise<StudyGuide> {
    const result = createStudyGuideOptionsSchema.safeParse(options);
    if (!result.success) {
        throw new InvalidInputError(result.error.issues[0]?.message ?? 'Invalid study guide generation options');
    }

    const { model, content, difficulty='medium' } = result.data;

    const { output } = await generateText({
        model,
        system: eduGeneratorSystemPrompt,
        prompt: buildGenerationPrompt({
            task: `Create a ${difficulty}-difficulty study guide from the content below.`,
            rules: [
                'Give a concise but complete summary of the material.',
                'Identify the most important concepts a student should understand.',
                'Explain each key concept clearly and accurately.',
                'Include review questions that test understanding rather than simple memorization.',
                'Stay grounded in the provided content and do not introduce unsupported information.',
                'Match the requested difficulty level.'
            ],
            difficulty,
            content
        }),
        output: Output.object({
            schema: studyGuideSchema
        })
    });

    return output;
};
