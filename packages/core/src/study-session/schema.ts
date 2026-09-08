import { z } from "zod";
import { generationOptionsSchema } from "../shared/schema.js";
import { InvalidInputError } from "../errors/errors.js";
import type { LearningSetContent } from "../learning-set/create-learning-set.js";

export const createStudySessionOptionsSchema = generationOptionsSchema.extend({
    durationMinutes: z
        .number()
        .int()
        .min(5, "durationMinutes must be at least 5")
        .max(240, "durationMinutes must be at most 240"),
    topic: z.string().min(1).optional(),
    goals: z.array(z.string().min(1)).optional(),
});

export type CreateStudySessionOptions = z.infer<typeof createStudySessionOptionsSchema>;

const studySessionBlockTypeSchema = z.enum([
    "read",
    "notes",
    "studyGuide",
    "flashcards",
    "quiz",
    "practiceProblems",
    "break",
    "review",
]);

type StudySessionBlockType = z.infer<typeof studySessionBlockTypeSchema>;

const studySessionMaterialKeySchema = z.enum([
    "quiz",
    "flashcards",
    "practiceProblems",
    "notes",
    "studyGuide",
]);

type StudySessionMaterialKey = z.infer<typeof studySessionMaterialKeySchema>;

export const studySessionBlockPlanSchema = z.object({
    type: studySessionBlockTypeSchema,
    title: z.string().min(1).describe("A short title for this session block"),
    durationMinutes: z
        .number()
        .int()
        .positive()
        .describe("How many minutes this block should take"),
    instructions: z
        .string()
        .min(1)
        .describe("Clear instructions for what the learner should do in this block"),
    materialKey: studySessionMaterialKeySchema
        .optional()
        .describe("Which generated material this block uses, if any"),
});

type StudySessionBlockPlan = z.infer<typeof studySessionBlockPlanSchema>;

export type StudySessionBlock = StudySessionBlockPlan & { id: string };

export const studySessionMaterialAllocationSchema = z.object({
    quiz: z
        .object({
            count: z.number().int().positive(),
            numOfOptions: z.number().int().min(2).optional(),
        })
        .optional(),
    flashcards: z
        .object({
            count: z.number().int().positive(),
        })
        .optional(),
    practiceProblems: z
        .object({
            count: z.number().int().positive(),
        })
        .optional(),
    notes: z
        .object({
            length: z.enum(["short", "medium", "long"]).optional(),
        })
        .optional(),
    studyGuide: z.boolean().optional(),
});

type StudySessionMaterialAllocation = z.infer<typeof studySessionMaterialAllocationSchema>;

export type StudySessionContent = {
    topic: string;
    goals: string[];
    totalDurationMinutes: number;
    tips: string[];
    blocks: StudySessionBlock[];
    materials: LearningSetContent;
};

const durationNormalizeToleranceMinutes = 5;

export function normalizeBlockDurations<T extends { type: StudySessionBlockType; durationMinutes: number }>(
    blocks: T[],
    targetMinutes: number
): T[] {
    if (blocks.length === 0) {
        throw new InvalidInputError("Study session must include at least one block");
    }

    const sum = blocks.reduce((total, block) => total + block.durationMinutes, 0);
    const diff = targetMinutes - sum;

    if (diff === 0) {
        return blocks;
    }

    if (Math.abs(diff) > durationNormalizeToleranceMinutes) {
        throw new InvalidInputError(
            `Block durations sum to ${sum} minutes but session duration is ${targetMinutes} minutes`
        );
    }

    let adjustIndex = -1;
    for (let i = blocks.length - 1; i >= 0; i -= 1) {
        if (blocks[i]!.type !== "break") {
            adjustIndex = i;
            break;
        }
    }

    if (adjustIndex === -1) {
        throw new InvalidInputError("Cannot normalize durations when every block is a break");
    }

    const adjustedDuration = blocks[adjustIndex]!.durationMinutes + diff;
    if (adjustedDuration < 1) {
        throw new InvalidInputError(
            "Cannot normalize block durations without making a block shorter than 1 minute"
        );
    }

    return blocks.map((block, index) =>
        index === adjustIndex ? { ...block, durationMinutes: adjustedDuration } : block
    );
}

export function assertMaterialKeysMatchAllocation(
    blocks: Array<{ materialKey?: StudySessionMaterialKey }>,
    allocation: StudySessionMaterialAllocation
): void {
    const allocated = new Set<StudySessionMaterialKey>();

    if (allocation.quiz) allocated.add("quiz");
    if (allocation.flashcards) allocated.add("flashcards");
    if (allocation.practiceProblems) allocated.add("practiceProblems");
    if (allocation.notes) allocated.add("notes");
    if (allocation.studyGuide) allocated.add("studyGuide");

    for (const block of blocks) {
        if (block.materialKey !== undefined && !allocated.has(block.materialKey)) {
            throw new InvalidInputError(
                `Block references materialKey "${block.materialKey}" which was not allocated`
            );
        }
    }
}
