import { z } from "zod";

export const pastPerformanceEntrySchema = z.object({
    topic: z.string().min(1),
    correct: z.number().int().min(0),
    total: z.number().int().positive(),
    lastAttemptAt: z.string().min(1).optional(),
});

export const examInsightSchema = z.object({
    sourceLabel: z.string().min(1).optional(),
    weakTopics: z.array(z.string().min(1)).min(1),
    missedConcepts: z.array(z.string().min(1)).optional(),
    notes: z.string().min(1).optional(),
});

export const learnerContextSchema = z.object({
    focusAreas: z.array(z.string().min(1)).optional(),
    strongAreas: z.array(z.string().min(1)).optional(),
    pastPerformance: z.array(pastPerformanceEntrySchema).optional(),
    examInsights: z.array(examInsightSchema).optional(),
    priorities: z.array(z.string().min(1)).optional(),
});

export type PastPerformanceEntry = z.infer<typeof pastPerformanceEntrySchema>;
export type ExamInsight = z.infer<typeof examInsightSchema>;
export type LearnerContext = z.infer<typeof learnerContextSchema>;

export const topicsSchema = z
    .array(z.string().min(1))
    .min(1)
    .max(4)
    .describe(
        "1–4 short topic labels for this item, grounded in the source content"
    );
