import type { Difficulty } from './schema.js';
import type { LearnerContext } from '../personalization/schema.js';

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

export function personalizationBlock(learnerContext?: LearnerContext): string | undefined {
    if (!learnerContext) {
        return undefined;
    }

    const lines: string[] = [];

    if (learnerContext.focusAreas && learnerContext.focusAreas.length > 0) {
        lines.push(
            `Focus areas (prioritize these when the content supports them):\n${learnerContext.focusAreas
                .map((area) => `- ${area}`)
                .join('\n')}`
        );
    }

    if (learnerContext.strongAreas && learnerContext.strongAreas.length > 0) {
        lines.push(
            `Strong areas (cover briefly; prefer weaker areas instead):\n${learnerContext.strongAreas
                .map((area) => `- ${area}`)
                .join('\n')}`
        );
    }

    if (learnerContext.pastPerformance && learnerContext.pastPerformance.length > 0) {
        lines.push(
            `Past performance by topic:\n${learnerContext.pastPerformance
                .map((entry) => {
                    const rate =
                        entry.total > 0
                            ? Math.round((entry.correct / entry.total) * 100)
                            : 0;
                    const when = entry.lastAttemptAt
                        ? ` (last: ${entry.lastAttemptAt})`
                        : '';
                    return `- ${entry.topic}: ${entry.correct}/${entry.total} (${rate}%)${when}`;
                })
                .join('\n')}`
        );
    }

    if (learnerContext.examInsights && learnerContext.examInsights.length > 0) {
        const insightBlocks = learnerContext.examInsights.map((insight, index) => {
            const label = insight.sourceLabel ?? `Exam insight ${index + 1}`;
            const parts = [
                `${label}:`,
                `  Weak topics: ${insight.weakTopics.join(', ')}`,
            ];
            if (insight.missedConcepts && insight.missedConcepts.length > 0) {
                parts.push(
                    `  Missed concepts: ${insight.missedConcepts.join(', ')}`
                );
            }
            if (insight.notes) {
                parts.push(`  Notes: ${insight.notes}`);
            }
            return parts.join('\n');
        });
        lines.push(`Exam insights:\n${insightBlocks.join('\n')}`);
    }

    if (learnerContext.priorities && learnerContext.priorities.length > 0) {
        lines.push(
            `Learner priorities:\n${learnerContext.priorities
                .map((priority) => `- ${priority}`)
                .join('\n')}`
        );
    }

    if (lines.length === 0) {
        return undefined;
    }

    return [
        'Personalization guidance (bias toward the learner needs below; stay grounded in the provided content and do not invent unsupported facts):',
        ...lines,
    ].join('\n\n');
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
