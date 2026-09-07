import type { Difficulty } from './schema.js';

export const eduGeneratorSystemPrompt =
    'You are an educational content generator. Produce accurate, clear study material grounded only in the provided content. Do not invent unsupported facts. Match the requested difficulty level.';

const difficultyGuidanceByLevel: Record<Difficulty, string> = {
    easy: 'Difficulty guidance (easy): Focus on recall and basic definitions. Use simpler wording and straightforward questions or explanations.',
    medium: 'Difficulty guidance (medium): Focus on understanding and straightforward application of the material.',
    hard: 'Difficulty guidance (hard): Prefer multi-step reasoning, synthesis across ideas, or subtle distinctions when the content supports it.'
};

export function difficultyGuidance(difficulty: Difficulty): string {
    return difficultyGuidanceByLevel[difficulty];
}

export function contentBlock(content: string): string {
    return `Content:\n${content}`;
}

export type BuildUserPromptOptions = {
    task: string;
    rules: string[];
    difficulty: Difficulty;
    extras?: string[];
};

export function buildUserPrompt(options: BuildUserPromptOptions): string {
    const { task, rules, difficulty, extras = [] } = options;

    const sections = [
        task.trim(),
        rules.length > 0
            ? rules.map((rule) => `- ${rule}`).join('\n')
            : '',
        difficultyGuidance(difficulty),
        ...extras.map((extra) => extra.trim()).filter(Boolean)
    ].filter(Boolean);

    return sections.join('\n\n');
}

export function buildGenerationPrompt(options: BuildUserPromptOptions & { content: string }): string {
    const { content, ...promptOptions } = options;
    return `${buildUserPrompt(promptOptions)}\n\n${contentBlock(content)}`;
}
