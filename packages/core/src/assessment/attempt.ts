import { z } from "zod";
import { InvalidInputError } from "../errors/errors.js";
import { gradeQuiz, gradeQuizOptionsSchema, type GradeQuizQuestion, type GradeQuizResult } from "../quizzes/gradeQuiz.js";

export type AssessmentResult = GradeQuizResult;

const quizAttemptSchema = z.object({
    id: z.string().min(1),
    answers: z.array(z.number().int().min(0).nullable()),
    startedAt: z.string().min(1),
    completedAt: z.string().min(1).optional(),
});

export type QuizAttempt = z.infer<typeof quizAttemptSchema>;

const createQuizAttemptOptionsSchema = z.object({
    id: z.string().min(1).optional(),
    answers: z.array(z.number().int().min(0).nullable()).optional(),
    startedAt: z.string().min(1).optional(),
});

export type CreateQuizAttemptOptions = z.infer<typeof createQuizAttemptOptionsSchema>;

const completeQuizAttemptOptionsSchema = z.object({
    attempt: quizAttemptSchema,
    questions: gradeQuizOptionsSchema.shape.questions,
    answers: gradeQuizOptionsSchema.shape.answers,
});

export type CompleteQuizAttemptOptions = {
    attempt: QuizAttempt;
    questions: GradeQuizQuestion[];
    answers: (number | null)[];
};

export function createQuizAttempt(options: CreateQuizAttemptOptions = {}): QuizAttempt {
    const parsed = createQuizAttemptOptionsSchema.safeParse(options);
    if (!parsed.success) {
        throw new InvalidInputError(
            parsed.error.issues[0]?.message ?? "Invalid quiz attempt options"
        );
    }

    const data = parsed.data;

    return {
        id: data.id ?? crypto.randomUUID(),
        answers: data.answers ?? [],
        startedAt: data.startedAt ?? new Date().toISOString(),
    };
}

export function completeQuizAttempt(
    options: CompleteQuizAttemptOptions
): { attempt: QuizAttempt; result: AssessmentResult } {
    const parsed = completeQuizAttemptOptionsSchema.safeParse(options);
    if (!parsed.success) {
        throw new InvalidInputError(
            parsed.error.issues[0]?.message ?? "Invalid complete quiz attempt options"
        );
    }

    const { attempt, questions, answers } = parsed.data;
    const result = gradeQuiz({ questions, answers });
    const completedAttempt: QuizAttempt = {
        ...attempt,
        answers,
        completedAt: new Date().toISOString(),
    };

    return { attempt: completedAttempt, result };
}
