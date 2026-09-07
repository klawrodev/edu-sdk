import { z } from "zod";
import type { LanguageModel } from "ai";
import type { Difficulty } from "./schema.js";

export type ArtifactMetadata = {
    createdAt: string;
    model: string;
    difficulty: Difficulty;
};

export type Artifact<T> = {
    id: string;
    title: string;
    description?: string;
    metadata: ArtifactMetadata;
    content: T;
};

export const artifactLabelSchema = z.object({
    title: z.string().min(1).describe("A concise title for this learning artifact"),
    description: z
        .string()
        .min(1)
        .optional()
        .describe("A short description of what this artifact covers"),
});

function createArtifactId(): string {
    return crypto.randomUUID();
}

function resolveModelLabel(model: string | LanguageModel): string {
    if (typeof model === "string") {
        return model;
    }

    if (
        typeof model === "object" &&
        model !== null &&
        "modelId" in model &&
        typeof model.modelId === "string" &&
        model.modelId.length > 0
    ) {
        return model.modelId;
    }

    return "language-model";
}

function buildArtifactMetadata(options: {
    model: string | LanguageModel;
    difficulty: Difficulty;
}): ArtifactMetadata {
    return {
        createdAt: new Date().toISOString(),
        model: resolveModelLabel(options.model),
        difficulty: options.difficulty,
    };
}

export function wrapArtifact<T>(options: {
    title: string;
    description?: string;
    content: T;
    model: string | LanguageModel;
    difficulty: Difficulty;
}): Artifact<T> {
    const artifact: Artifact<T> = {
        id: createArtifactId(),
        title: options.title,
        metadata: buildArtifactMetadata({
            model: options.model,
            difficulty: options.difficulty,
        }),
        content: options.content,
    };

    if (options.description !== undefined) {
        artifact.description = options.description;
    }

    return artifact;
}

export function stampLeafIds<T extends Record<string, unknown>>(
    items: T[]
): Array<T & { id: string }> {
    return items.map((item) => ({
        ...item,
        id: createArtifactId(),
    }));
}
