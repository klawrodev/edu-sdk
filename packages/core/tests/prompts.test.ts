import { describe, expect, test } from 'vitest';
import {
    buildGenerationPrompt, buildUserPrompt, contentBlock,
    difficultyGuidance, eduGeneratorSystemPrompt
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
