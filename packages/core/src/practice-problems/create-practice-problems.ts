import { generateText, Output } from 'ai';
import { z } from 'zod';
import { generationOptionsSchema } from "../shared/schema.js";
import { artifactLabelSchema, stampLeafIds, wrapArtifact } from '../shared/artifact.js';
import type { Artifact } from '../shared/artifact.js';
import { eduGeneratorSystemPrompt, buildGenerationPrompt, personalizationBlock } from '../shared/prompts.js';
import { InvalidInputError } from '../errors/errors.js';
import { resolveContent } from '../content/resolve-content.js';
import { topicsSchema } from '../personalization/schema.js';

export const createPracticeProblemsOptionsSchema = generationOptionsSchema.extend({
    count: z.number().int().positive()
});
export type CreatePracticeProblemsOptions = z.infer<typeof createPracticeProblemsOptionsSchema>;

const practiceProblemSchema = z.object({
    question: z.string().min(1).describe('A clear, unambiguous practice problem question'),
    hint: z.string().min(1).describe('A helpful hint that guides without revealing the answer'),
    answer: z.string().min(1).describe('A concise final answer'),
    solution: z.string().min(1).describe('A clear worked solution explaining how to reach the answer step by step'),
    topics: topicsSchema,
});

type PracticeProblemFields = z.infer<typeof practiceProblemSchema>;
export type PracticeProblem = PracticeProblemFields & { id: string };
export type PracticeProblems = Artifact<PracticeProblem[]>;

export async function createPracticeProblems(options: CreatePracticeProblemsOptions): Promise<PracticeProblems> {
    const result = createPracticeProblemsOptionsSchema.safeParse(options);
    if (!result.success) {
        throw new InvalidInputError(result.error.issues[0]?.message ?? 'Invalid practice problems generation input');
    }

    const { model, content, difficulty = 'medium', count, learnerContext } = result.data;
    const resolvedContent = await resolveContent(content);
    const extras: string[] = [
        `Number of problems: ${count}`,
        `For mathematical or quantitative problems:
                    - Show the reasoning and calculations clearly in the solution.
                    - Include units where appropriate.
                    - Ensure the final answer is consistent with the worked solution.

                For conceptual problems:
                    - Explain the reasoning behind the answer rather than simply restating it.`,
    ];
    const personalization = personalizationBlock(learnerContext);
    if (personalization) {
        extras.push(personalization);
    }

    const { output } = await generateText({
        model,
        system: eduGeneratorSystemPrompt,
        prompt: buildGenerationPrompt({
            task: `Create exactly ${count} ${difficulty}-difficulty practice problems using the provided content.`,
            rules: [
                'Test understanding and application of the material, not just simple recall.',
                'Be answerable using the provided content.',
                'Have a clear, unambiguous question.',
                'Include a helpful hint that guides the student without revealing the answer.',
                'Include a concise final answer.',
                'Include a clear worked solution explaining how to reach the answer step by step.',
                'Match the requested difficulty level.',
                'Avoid duplicate or nearly identical problems.',
                'Label each problem with 1–4 short topic tags grounded in the content; prefer labels that overlap focus areas when relevant.',
                'When personalization guidance is provided, prioritize weaker or focus topics while staying grounded in the content.',
                'Stay grounded in the provided content and do not introduce unsupported facts.',
                'Provide a concise title and optional short description for the practice problem set as a whole.'
            ],
            difficulty,
            extras,
            content: resolvedContent
        }),
        output: Output.object({
            schema: artifactLabelSchema.extend({
                problems: z.array(practiceProblemSchema).length(count)
            })
        })
    });

    return wrapArtifact({
        title: output.title,
        description: output.description,
        content: stampLeafIds(output.problems),
        model,
        difficulty,
    });
};
