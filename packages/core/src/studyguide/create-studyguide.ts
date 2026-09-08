import { generateText, Output } from 'ai';
import { z } from 'zod';
import { generationOptionsSchema } from "../shared/schema.js";
import { artifactLabelSchema, wrapArtifact } from '../shared/artifact.js';
import type { Artifact } from '../shared/artifact.js';
import { eduGeneratorSystemPrompt, buildGenerationPrompt, personalizationBlock } from '../shared/prompts.js';
import { InvalidInputError } from '../errors/errors.js';
import { resolveContent } from '../content/resolve-content.js';
import { topicsSchema } from '../personalization/schema.js';


export const createStudyGuideOptionsSchema = generationOptionsSchema;
export type CreateStudyGuideOptions = z.infer<typeof createStudyGuideOptionsSchema>;

const studyGuideOutputSchema = artifactLabelSchema.extend({
    summary: z.string().min(1).describe('A concise but complete summary of the material'),
    keyConcepts: z.array(
        z.object({
            concept: z.string().min(1).describe('The name of an important concept'),
            explanation: z.string().min(1).describe('A clear, accurate explanation of the concept'),
            topics: topicsSchema,
        })
    ).min(1).describe('The most important concepts a student should understand'),
    reviewQuestions: z.array(z.string().min(1)).min(1).describe('Review questions that test understanding rather than simple memorization')
});

export type StudyGuideContent = {
    summary: string;
    keyConcepts: {
        concept: string;
        explanation: string;
        topics: string[];
    }[];
    reviewQuestions: string[];
};

export type StudyGuide = Artifact<StudyGuideContent>;

export async function createStudyGuide(options: CreateStudyGuideOptions): Promise<StudyGuide> {
    const result = createStudyGuideOptionsSchema.safeParse(options);
    if (!result.success) {
        throw new InvalidInputError(result.error.issues[0]?.message ?? 'Invalid study guide generation options');
    }

    const { model, content, difficulty = 'medium', learnerContext } = result.data;
    const resolvedContent = await resolveContent(content);
    const extras: string[] = [];
    const personalization = personalizationBlock(learnerContext);
    if (personalization) {
        extras.push(personalization);
    }

    const { output } = await generateText({
        model,
        system: eduGeneratorSystemPrompt,
        prompt: buildGenerationPrompt({
            task: `Create a ${difficulty}-difficulty study guide from the content below.`,
            rules: [
                'Give a concise but complete summary of the material.',
                'Identify the most important concepts a student should understand.',
                'Explain each key concept clearly and accurately.',
                'Label each key concept with 1–4 short topic tags grounded in the content; prefer labels that overlap focus areas when relevant.',
                'Include review questions that test understanding rather than simple memorization.',
                'When personalization guidance is provided, prioritize weaker or focus topics while staying grounded in the content.',
                'Stay grounded in the provided content and do not introduce unsupported information.',
                'Match the requested difficulty level.',
                'Provide a concise title and optional short description for the study guide as a whole.'
            ],
            difficulty,
            extras,
            content: resolvedContent
        }),
        output: Output.object({
            schema: studyGuideOutputSchema
        })
    });

    return wrapArtifact({
        title: output.title,
        description: output.description,
        content: {
            summary: output.summary,
            keyConcepts: output.keyConcepts,
            reviewQuestions: output.reviewQuestions,
        },
        model,
        difficulty,
    });
};
