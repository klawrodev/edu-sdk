import { z } from "zod";
import { generationOptionsSchema } from "../shared/schema.js";
import { wrapArtifact } from "../shared/artifact.js";
import type { Artifact } from "../shared/artifact.js";
import { InvalidInputError } from "../errors/errors.js";
import { createQuiz } from "../quizzes/create-quiz.js";
import type { Quiz } from "../quizzes/create-quiz.js";
import { createFlashcards } from "../flashcard/create-flashcards.js";
import type { Flashcards } from "../flashcard/create-flashcards.js";
import { createNote } from "../notes/create-note.js";
import type { Note } from "../notes/create-note.js";
import { createPracticeProblems } from "../practice-problems/create-practice-problems.js";
import type { PracticeProblems } from "../practice-problems/create-practice-problems.js";
import { createStudyGuide } from "../studyguide/create-studyguide.js";
import type { StudyGuide } from "../studyguide/create-studyguide.js";

const includeItemSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("quiz"),
        count: z.number().int().positive(),
        numOfOptions: z.number().int().min(2).optional(),
    }),
    z.object({
        type: z.literal("flashcards"),
        count: z.number().int().positive(),
    }),
    z.object({
        type: z.literal("practiceProblems"),
        count: z.number().int().positive(),
    }),
    z.object({
        type: z.literal("notes"),
        length: z.enum(["short", "medium", "long"]).optional(),
    }),
    z.object({
        type: z.literal("studyGuide"),
    }),
]);

export const createLearningSetOptionsSchema = generationOptionsSchema
    .extend({
        include: z.array(includeItemSchema).min(1),
    })
    .superRefine((data, ctx) => {
        const types = data.include.map((item) => item.type);
        if (new Set(types).size !== types.length) {
            ctx.addIssue({
                code: "custom",
                path: ["include"],
                message: "include must not contain duplicate types",
            });
        }
    });

export type CreateLearningSetOptions = z.infer<typeof createLearningSetOptionsSchema>;

export type LearningSetContent = {
    quiz?: Quiz;
    flashcards?: Flashcards;
    practiceProblems?: PracticeProblems;
    notes?: Note;
    studyGuide?: StudyGuide;
};

export type LearningSet = Artifact<LearningSetContent>;

export async function createLearningSet(options: CreateLearningSetOptions): Promise<LearningSet> {
    const parsed = createLearningSetOptionsSchema.safeParse(options);
    if (!parsed.success) {
        throw new InvalidInputError(
            parsed.error.issues[0]?.message ?? "Invalid learning set generation options"
        );
    }

    const { model, content, difficulty = "medium", include } = parsed.data;
    const shared = { model, content, difficulty };

    const entries = await Promise.all(
        include.map(async (item) => {
            switch (item.type) {
                case "quiz": {
                    const quiz = await createQuiz({
                        ...shared,
                        count: item.count,
                        numOfOptions: item.numOfOptions,
                    });
                    return ["quiz", quiz] as const;
                }
                case "flashcards": {
                    const flashcards = await createFlashcards({
                        ...shared,
                        count: item.count,
                    });
                    return ["flashcards", flashcards] as const;
                }
                case "practiceProblems": {
                    const practiceProblems = await createPracticeProblems({
                        ...shared,
                        count: item.count,
                    });
                    return ["practiceProblems", practiceProblems] as const;
                }
                case "notes": {
                    const notes = await createNote({
                        ...shared,
                        length: item.length,
                    });
                    return ["notes", notes] as const;
                }
                case "studyGuide": {
                    const studyGuide = await createStudyGuide(shared);
                    return ["studyGuide", studyGuide] as const;
                }
            }
        })
    );

    const learningContent = Object.fromEntries(entries) as LearningSetContent;
    const { notes, studyGuide, quiz, flashcards, practiceProblems } = learningContent;

    return wrapArtifact({
        title:
            notes?.title ??
            studyGuide?.title ??
            quiz?.title ??
            flashcards?.title ??
            practiceProblems?.title ??
            "Learning set",
        description:
            notes?.description ??
            studyGuide?.description ??
            quiz?.description ??
            flashcards?.description ??
            practiceProblems?.description,
        content: learningContent,
        model,
        difficulty,
    });
}
