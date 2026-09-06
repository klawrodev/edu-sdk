import { z } from "zod";
import { InvalidInputError } from "../errors/errors.js";

const quizQuestionSchema = z
    .object({
        question: z.string().min(1),
        options: z.array(z.string()).min(2),
        correctAnswer: z.number().int().min(0),
    })
    .superRefine((question, ctx) => {
        if (question.correctAnswer >= question.options.length) {
            ctx.addIssue({
                code: "custom",
                message: "correctAnswer must be a valid option index",
                path: ["correctAnswer"],
            });
        }
    });

export const gradeQuizOptionsSchema = z
    .object({
        questions: z.array(quizQuestionSchema).min(1),
        answers: z.array(z.number().int().min(0).nullable()),
    })
    .superRefine((data, ctx) => {
        if (data.answers.length !== data.questions.length) {
            ctx.addIssue({
                code: "custom",
                message: "answers length must match questions length",
                path: ["answers"],
            });
            return;
        }

        data.answers.forEach((answer, index) => {
            if (answer === null) return;
            const optionCount = data.questions[index]!.options.length;
            if (answer >= optionCount) {
                ctx.addIssue({
                    code: "custom",
                    message: `answer at index ${index} is out of range`,
                    path: ["answers", index],
                });
            }
        });
    });

export type GradeQuizOptions = z.infer<typeof gradeQuizOptionsSchema>;

const gradeQuizResultItemSchema = z.object({
    questionIndex: z.number().int().min(0),
    selectedAnswer: z.number().int().min(0).nullable(),
    correctAnswer: z.number().int().min(0),
    isCorrect: z.boolean(),
    isAnswered: z.boolean(),
});

const gradeQuizResultSchema = z.object({
    score: z.number().int().min(0),
    total: z.number().int().positive(),
    percentage: z.number().int().min(0).max(100),
    results: z.array(gradeQuizResultItemSchema),
});

type GradeQuizResultItem = z.infer<typeof gradeQuizResultItemSchema>;
export type GradeQuizResult = z.infer<typeof gradeQuizResultSchema>;

export function gradeQuiz(options: GradeQuizOptions): GradeQuizResult {
    const parsed = gradeQuizOptionsSchema.safeParse(options);
    if (!parsed.success) {
        throw new InvalidInputError(
            parsed.error.issues[0]?.message ?? "Invalid quiz grading options"
        );
    }

    const { questions, answers } = parsed.data;
    const results: GradeQuizResultItem[] = questions.map((question, index) => {
        const selectedAnswer = answers[index]!;
        const isAnswered = selectedAnswer !== null;
        const isCorrect = isAnswered && selectedAnswer === question.correctAnswer;

        return {
            questionIndex: index,
            selectedAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect,
            isAnswered,
        };
    });

    const score = results.reduce((total, result) => total + (result.isCorrect ? 1 : 0), 0);
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);

    return { score, total, percentage, results };
}
