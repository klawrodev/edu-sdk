import { generateText, Output } from 'ai';
import { z } from 'zod';
import { generationOptionsSchema } from '../shared/schema.js';
import { artifactLabelSchema, stampLeafIds, wrapArtifact } from '../shared/artifact.js';
import type { Artifact } from '../shared/artifact.js';
import { eduGeneratorSystemPrompt, buildGenerationPrompt, personalizationBlock } from '../shared/prompts.js';
import { InvalidInputError } from '../errors/errors.js';
import { resolveContent } from '../content/resolve-content.js';

export const createFlashcardsOptionsSchema = generationOptionsSchema.extend({
    count: z.number().int().positive()
});

const flashcardSchema = z.object({
    front: z.string().min(1).describe('A clear prompt or cue for the front of the flashcard'),
    back: z.string().min(1).describe('An accurate, study-ready answer for the back of the flashcard')
});

type FlashcardFields = z.infer<typeof flashcardSchema>;
export type Flashcard = FlashcardFields & { id: string };
export type Flashcards = Artifact<Flashcard[]>;

export type CreateFlashcardsOptions = z.infer<typeof createFlashcardsOptionsSchema>;

export async function createFlashcards(options: CreateFlashcardsOptions): Promise<Flashcards> {
    const result = createFlashcardsOptionsSchema.safeParse(options);
    if (!result.success) {
        throw new InvalidInputError(result.error.issues[0]?.message ?? "Invalid flashcard generation options");
    }
    
    const { model, content, count, difficulty = 'medium', learnerContext } = result.data;
    const resolvedContent = await resolveContent(content);
    const extras: string[] = [];
    const personalization = personalizationBlock(learnerContext);
    if (personalization) {
        extras.push(personalization);
    }

    const { output }  = await generateText({
        model,
        system: eduGeneratorSystemPrompt,
        prompt: buildGenerationPrompt({
            task: `Create exactly ${count} flashcards at ${difficulty}-difficulty from the content below.`,
            rules: [
                'Make the front a clear prompt or cue, and the back an accurate, study-ready answer.',
                'Cards may cover a single idea or related ideas together when that helps learning.',
                'Mix term-definition, concept-explanation, and application-style cues when the content supports it.',
                'Avoid near-duplicate cards and trivial copy-paste of source sentences.',
                'When personalization guidance is provided, prioritize weaker or focus topics while staying grounded in the content.',
                'Stay grounded in the provided content and do not introduce unsupported information.',
                'Match the requested difficulty level.',
                'Provide a concise title and optional short description for the flashcard deck as a whole.'
            ],
            difficulty,
            extras,
            content: resolvedContent
        }),
        output: Output.object({
            schema: artifactLabelSchema.extend({
                cards: z.array(flashcardSchema).length(count)
            })
        })
   });

   return wrapArtifact({
        title: output.title,
        description: output.description,
        content: stampLeafIds(output.cards),
        model,
        difficulty,
   });
}
