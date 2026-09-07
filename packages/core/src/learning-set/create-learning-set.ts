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

export const createLearningSetOptionsSchema = generationOptionsSchema.extend({
    quiz: z.object({
        count: z.number().int().positive(),
        numOfOptions: z.number().int().min(2).optional(),
    }),
    flashcards: z.object({
        count: z.number().int().positive(),
    }),
    notes: z
        .object({
            length: z.enum(["short", "medium", "long"]).optional(),
        })
        .optional(),
});

export type CreateLearningSetOptions = z.infer<typeof createLearningSetOptionsSchema>;

export type LearningSetContent = {
    quiz: Quiz;
    flashcards: Flashcards;
    notes: Note;
};

export type LearningSet = Artifact<LearningSetContent>;

export async function createLearningSet(options: CreateLearningSetOptions): Promise<LearningSet> {
    const parsed = createLearningSetOptionsSchema.safeParse(options);
    if (!parsed.success) {
        throw new InvalidInputError(
            parsed.error.issues[0]?.message ?? "Invalid learning set generation options"
        );
    }

    const { model, content, difficulty = "medium", quiz, flashcards, notes = {} } = parsed.data;

    const [quizResult, flashcardsResult, notesResult] = await Promise.all([
        createQuiz({
            model,
            content,
            difficulty,
            count: quiz.count,
            numOfOptions: quiz.numOfOptions,
        }),
        createFlashcards({
            model,
            content,
            difficulty,
            count: flashcards.count,
        }),
        createNote({
            model,
            content,
            difficulty,
            length: notes.length,
        }),
    ]);

    return wrapArtifact({
        title: notesResult.title,
        description: notesResult.description ?? quizResult.description ?? flashcardsResult.description,
        content: {
            quiz: quizResult,
            flashcards: flashcardsResult,
            notes: notesResult,
        },
        model,
        difficulty,
    });
}
