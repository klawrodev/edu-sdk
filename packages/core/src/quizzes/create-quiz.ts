import { generateText, Output } from "ai";
import { z } from 'zod';
import { generationOptionsSchema } from "../shared/schema.js";
import { eduGeneratorSystemPrompt, buildGenerationPrompt } from "../shared/prompts.js";
import { InvalidInputError } from "../errors/errors.js";

export const createQuizOptionsSchema = generationOptionsSchema.extend({
    count: z.number().int().positive(),
    numOfOptions: z.number().int().min(2).optional()
});

export type CreateQuizOptions = z.infer<typeof createQuizOptionsSchema>;

function createQuizQuestionSchema(numOfOptions: number) {
    return z.object({
        question: z.string().describe('A clear quiz question grounded in the provided content'),
        options: z.array(z.string()).length(numOfOptions).describe(`Exactly ${numOfOptions} answer choices for this question`),
        correctAnswer: z.number().int().min(0).max(numOfOptions - 1).describe('The 0-based index of the single correct option')
    });
}

export type QuizQuestion = z.infer<ReturnType<typeof createQuizQuestionSchema>>;
type Quiz = QuizQuestion[];

export async function createQuiz(options: CreateQuizOptions): Promise<Quiz> {
    const result = createQuizOptionsSchema.safeParse(options);
    if (!result.success) {
        throw new InvalidInputError(result.error.issues[0]?.message ?? 'Invalid quiz generation options')
    }
    const { model, content, count, difficulty = 'medium', numOfOptions = 4 } = result.data;

    const quizQuestionSchema = createQuizQuestionSchema(numOfOptions);

    const { output } = await generateText({
        model,
        system: eduGeneratorSystemPrompt,
        prompt: buildGenerationPrompt({
            task: `Create a ${difficulty}-difficulty quiz with ${count} questions.`,
            rules: [
                `Each question must have exactly ${numOfOptions} answer choices.`,
                'Each question must have exactly one unambiguously correct answer.',
                'Use plausible distractors based on common misconceptions; avoid silly or obviously wrong options.',
                'Prefer questions that test understanding and application over trivia when the content supports it.',
                'Avoid duplicate or nearly identical questions.',
                'Stay grounded in the provided content and do not introduce unsupported information.',
                'Match the requested difficulty level.'
            ],
            difficulty,
            content
        }),
        output: Output.object({
            schema: z.object({
                questions: z.array(quizQuestionSchema).length(count)
            })
        })
    });

    return output.questions
}
