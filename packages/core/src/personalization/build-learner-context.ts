import { InvalidInputError } from "../errors/errors.js";
import type { GradeQuizResult } from "../quizzes/gradeQuiz.js";
import {
    learnerContextSchema, type ExamInsight,
    type LearnerContext, type PastPerformanceEntry,
} from "./schema.js";

export type BuildLearnerContextExamAnalysis = {
    weakTopics?: string[];
    strongTopics?: string[];
    missedConcepts?: string[];
    suggestedFocusAreas?: string[];
    examInsights?: ExamInsight[];
    sourceLabel?: string;
};

export type BuildLearnerContextQuizResult = {
    result: GradeQuizResult;
    attemptedAt?: string;
};

export type BuildLearnerContextOptions = {
    focusAreas?: string[];
    strongAreas?: string[];
    priorities?: string[];
    examAnalysis?: BuildLearnerContextExamAnalysis | BuildLearnerContextExamAnalysis[];
    quizResults?: BuildLearnerContextQuizResult[];
};

function dedupePreserveOrder(values: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];

    for (const value of values) {
        const trimmed = value.trim();
        if (!trimmed) {
            continue;
        }
        const key = trimmed.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        out.push(trimmed);
    }

    return out;
}

function normalizeExamAnalyses(
    examAnalysis: BuildLearnerContextOptions["examAnalysis"]
): BuildLearnerContextExamAnalysis[] {
    if (!examAnalysis) {
        return [];
    }
    return Array.isArray(examAnalysis) ? examAnalysis : [examAnalysis];
}

function mergePastPerformance(
    quizResults: BuildLearnerContextQuizResult[]
): PastPerformanceEntry[] {
    const merged = new Map<
        string,
        { topic: string; correct: number; total: number; lastAttemptAt?: string }
    >();

    for (const quizResult of quizResults) {
        for (const stats of quizResult.result.byTopic ?? []) {
            const key = stats.topic.toLowerCase();
            const existing = merged.get(key) ?? {
                topic: stats.topic,
                correct: 0,
                total: 0,
            };
            existing.correct += stats.correct;
            existing.total += stats.total;

            if (quizResult.attemptedAt) {
                if (
                    !existing.lastAttemptAt ||
                    quizResult.attemptedAt > existing.lastAttemptAt
                ) {
                    existing.lastAttemptAt = quizResult.attemptedAt;
                }
            }

            merged.set(key, existing);
        }
    }

    return Array.from(merged.values()).map((entry) => {
        const result: PastPerformanceEntry = {
            topic: entry.topic,
            correct: entry.correct,
            total: entry.total,
        };
        if (entry.lastAttemptAt) {
            result.lastAttemptAt = entry.lastAttemptAt;
        }
        return result;
    });
}

function foldExamInsights(
    analyses: BuildLearnerContextExamAnalysis[]
): ExamInsight[] {
    const insights: ExamInsight[] = [];

    for (const analysis of analyses) {
        if (analysis.examInsights && analysis.examInsights.length > 0) {
            insights.push(...analysis.examInsights);
            continue;
        }

        if (analysis.weakTopics && analysis.weakTopics.length > 0) {
            const insight: ExamInsight = {
                weakTopics: dedupePreserveOrder(analysis.weakTopics),
            };
            if (analysis.sourceLabel) {
                insight.sourceLabel = analysis.sourceLabel;
            }
            if (analysis.missedConcepts && analysis.missedConcepts.length > 0) {
                insight.missedConcepts = dedupePreserveOrder(
                    analysis.missedConcepts
                );
            }
            insights.push(insight);
        }
    }

    return insights;
}

export function buildLearnerContext(
    options: BuildLearnerContextOptions = {}
): LearnerContext {
    const analyses = normalizeExamAnalyses(options.examAnalysis);
    const quizResults = options.quizResults ?? [];

    const focusAreas = dedupePreserveOrder([
        ...(options.focusAreas ?? []),
        ...analyses.flatMap((analysis) => analysis.suggestedFocusAreas ?? []),
        ...analyses.flatMap((analysis) => analysis.weakTopics ?? []),
        ...analyses.flatMap(
            (analysis) =>
                analysis.examInsights?.flatMap((insight) => insight.weakTopics) ??
                []
        ),
    ]);

    const strongAreas = dedupePreserveOrder([
        ...(options.strongAreas ?? []),
        ...analyses.flatMap((analysis) => analysis.strongTopics ?? []),
    ]);

    const priorities = dedupePreserveOrder(options.priorities ?? []);
    const pastPerformance = mergePastPerformance(quizResults);
    const examInsights = foldExamInsights(analyses);

    const context: LearnerContext = {};
    if (focusAreas.length > 0) {
        context.focusAreas = focusAreas;
    }
    if (strongAreas.length > 0) {
        context.strongAreas = strongAreas;
    }
    if (pastPerformance.length > 0) {
        context.pastPerformance = pastPerformance;
    }
    if (examInsights.length > 0) {
        context.examInsights = examInsights;
    }
    if (priorities.length > 0) {
        context.priorities = priorities;
    }

    const parsed = learnerContextSchema.safeParse(context);
    if (!parsed.success) {
        throw new InvalidInputError(
            parsed.error.issues[0]?.message ?? "Invalid learner context"
        );
    }

    return parsed.data;
}
