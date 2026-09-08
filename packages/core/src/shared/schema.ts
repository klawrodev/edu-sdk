import { z } from "zod";
import type { LanguageModel } from "ai";
import { learnerContextSchema } from "../personalization/schema.js";

const difficultySchema = z.enum(['easy', 'medium', 'hard']);

export type Difficulty = z.infer<typeof difficultySchema>;

export const languageModelSchema = z.custom<LanguageModel>(
    (value) => typeof value === "object" && value !== null,
    "Model must be a model ID or LanguageModel"
);

const binaryDataSchema = z.custom<Uint8Array | ArrayBuffer>(
    (value) => value instanceof Uint8Array || value instanceof ArrayBuffer,
    "FileContent.data must be a Uint8Array or ArrayBuffer"
);

export const fileContentSchema = z.object({
    type: z.literal("file"),
    data: binaryDataSchema,
    mimeType: z.string().min(1, "mimeType must be a non-empty string"),
    filename: z.string().min(1).optional(),
});

export const contentInputSchema = z.union([
    z.string().min(1, "Content cannot be empty"),
    fileContentSchema,
]);

export const generationOptionsSchema = z.object({
    model: z.union([
        z.string().min(1, "Model must be supplied"),
        languageModelSchema
    ]),
    content: contentInputSchema,
    difficulty: difficultySchema.optional(),
    learnerContext: learnerContextSchema.optional(),
});
