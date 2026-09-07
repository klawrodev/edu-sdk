import { generateText, Output } from 'ai';
import { z } from 'zod';
import { generationOptionsSchema } from '../shared/schema.js';
import { eduGeneratorSystemPrompt, buildGenerationPrompt } from '../shared/prompts.js';
import { InvalidInputError } from '../errors/errors.js';

export const createFlashcardsOptionsSchema = generationOptionsSchema.extend({
    count: z.number().int().positive()
});

const flashcardSchema = z.object({
    front: z.string().min(1).describe('A clear prompt or cue for the front of the flashcard'),
    back: z.string().min(1).describe('An accurate, study-ready answer for the back of the flashcard')
});

export type Flashcard = z.infer<typeof flashcardSchema>;
type Flashcards = Flashcard[]

export type CreateFlashcardsOptions = z.infer<typeof createFlashcardsOptionsSchema>;

export async function createFlashcards(options: CreateFlashcardsOptions): Promise<Flashcards> {
    const result = createFlashcardsOptionsSchema.safeParse(options);
    if (!result.success) {
        throw new InvalidInputError(result.error.issues[0]?.message ?? "Invalid flashcard generation options");
    }
    
    const { model, content, count, difficulty = 'medium' } = result.data;

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
                'Stay grounded in the provided content and do not introduce unsupported information.',
                'Match the requested difficulty level.'
            ],
            difficulty,
            content
        }),
        output: Output.object({
            schema: z.object({
                cards: z.array(flashcardSchema).length(count)
            })
        })
   });

   return output.cards;
}
