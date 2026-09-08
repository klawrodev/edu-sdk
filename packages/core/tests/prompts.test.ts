import { describe, expect, test } from 'vitest';
import {
    buildGenerationPrompt, buildUserPrompt, contentBlock,
    difficultyGuidance, eduGeneratorSystemPrompt, personalizationBlock
} from '../src/shared/prompts';

describe('eduGeneratorSystemPrompt', () => {
    test('describes an educational grounded generator', () => {
        expect(eduGeneratorSystemPrompt).toContain('educational content generator');
        expect(eduGeneratorSystemPrompt).toContain('grounded');
    });
});

describe('difficultyGuidance', () => {
    test('describes easy difficulty', () => {
        expect(difficultyGuidance('easy')).toContain('easy');
        expect(difficultyGuidance('easy')).toContain('recall');
    });

    test('describes medium difficulty', () => {
        expect(difficultyGuidance('medium')).toContain('medium');
        expect(difficultyGuidance('medium')).toContain('understanding');
    });

    test('describes hard difficulty', () => {
        expect(difficultyGuidance('hard')).toContain('hard');
        expect(difficultyGuidance('hard')).toContain('multi-step');
    });
});

describe('contentBlock', () => {
    test('wraps content with a Content footer', () => {
        expect(contentBlock('Electricity')).toBe('Content:\nElectricity');
    });
});

describe('buildUserPrompt', () => {
    test('joins task, rules, and difficulty guidance', () => {
        const prompt = buildUserPrompt({
            task: 'Create a quiz.',
            rules: ['Stay grounded.', 'Match difficulty.'],
            difficulty: 'medium'
        });

        expect(prompt).toContain('Create a quiz.');
        expect(prompt).toContain('- Stay grounded.');
        expect(prompt).toContain('- Match difficulty.');
        expect(prompt).toContain(difficultyGuidance('medium'));
    });
});

describe('buildGenerationPrompt', () => {
    test('appends the content block', () => {
        const prompt = buildGenerationPrompt({
            task: 'Create notes.',
            rules: ['Use Markdown.'],
            difficulty: 'easy',
            content: 'Photosynthesis'
        });

        expect(prompt).toContain('Create notes.');
        expect(prompt).toContain(contentBlock('Photosynthesis'));
    });
});

describe('personalizationBlock', () => {
    test('returns undefined when learnerContext is missing', () => {
        expect(personalizationBlock()).toBeUndefined();
        expect(personalizationBlock(undefined)).toBeUndefined();
    });

    test('returns undefined when all fields are empty', () => {
        expect(personalizationBlock({})).toBeUndefined();
        expect(
            personalizationBlock({
                focusAreas: [],
                strongAreas: [],
                pastPerformance: [],
                examInsights: [],
                priorities: [],
            })
        ).toBeUndefined();
    });

    test('includes focus areas, strong areas, and priorities', () => {
        const block = personalizationBlock({
            focusAreas: ['Ohm\'s law'],
            strongAreas: ['Voltage'],
            priorities: ['Prepare for midterm'],
        });

        expect(block).toContain('Personalization guidance');
        expect(block).toContain('Focus areas');
        expect(block).toContain('- Ohm\'s law');
        expect(block).toContain('Strong areas');
        expect(block).toContain('- Voltage');
        expect(block).toContain('Learner priorities');
        expect(block).toContain('- Prepare for midterm');
    });

    test('formats past performance with percentage and optional timestamp', () => {
        const block = personalizationBlock({
            pastPerformance: [
                {
                    topic: 'Current',
                    correct: 1,
                    total: 4,
                    lastAttemptAt: '2026-01-01T00:00:00.000Z',
                },
            ],
        });

        expect(block).toContain('Past performance by topic');
        expect(block).toContain(
            '- Current: 1/4 (25%) (last: 2026-01-01T00:00:00.000Z)'
        );
    });

    test('formats exam insights with sourceLabel fallback', () => {
        const block = personalizationBlock({
            examInsights: [
                {
                    sourceLabel: 'Fall midterm',
                    weakTopics: ['Resistance'],
                    missedConcepts: ['Series circuits'],
                    notes: 'Ran out of time',
                },
                {
                    weakTopics: ['Power'],
                },
            ],
        });

        expect(block).toContain('Exam insights');
        expect(block).toContain('Fall midterm:');
        expect(block).toContain('Weak topics: Resistance');
        expect(block).toContain('Missed concepts: Series circuits');
        expect(block).toContain('Notes: Ran out of time');
        expect(block).toContain('Exam insight 2:');
        expect(block).toContain('Weak topics: Power');
    });
});
