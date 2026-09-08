import { generateText, Output } from "ai";
import { z } from "zod";
import { contentInputSchema, languageModelSchema } from "../shared/schema.js";
import { artifactLabelSchema, wrapArtifact } from "../shared/artifact.js";
import type { Artifact } from "../shared/artifact.js";
import { buildGenerationPrompt } from "../shared/prompts.js";
import { InvalidInputError } from "../errors/errors.js";
import { resolveContent } from "../content/resolve-content.js";
import type { ContentInput } from "../content/types.js";

export const analyzePastWorkOptionsSchema = z.object({
    model: z.union([
        z.string().min(1, "Model must be supplied"),
        languageModelSchema,
    ]),
    content: z.union([
        contentInputSchema,
        z.array(contentInputSchema).min(1),
    ]),
    sourceLabel: z.string().min(1).optional(),
});

export type AnalyzePastWorkOptions = z.infer<typeof analyzePastWorkOptionsSchema>;

const pastWorkAnalysisFieldsSchema = z.object({
    weakTopics: z
        .array(z.string().min(1))
        .min(1)
        .describe("Topics where the learner struggled, grounded in the past work"),
    strongTopics: z
        .array(z.string().min(1))
        .optional()
        .describe("Topics the learner handled well, when evident in the past work"),
    missedConcepts: z
        .array(z.string().min(1))
        .optional()
        .describe("Specific concepts or skills that were missed or misunderstood"),
    suggestedFocusAreas: z
        .array(z.string().min(1))
        .optional()
        .describe("Recommended focus areas for the next study session"),
    notes: z
        .string()
        .min(1)
        .optional()
        .describe("Brief diagnostic notes for personalization"),
});

const pastWorkAnalysisOutputSchema = artifactLabelSchema.extend(
    pastWorkAnalysisFieldsSchema.shape
);

export type PastWorkAnalysis = z.infer<typeof pastWorkAnalysisFieldsSchema> & {
    sourceLabel?: string;
};

export type PastWorkAnalysisArtifact = Artifact<PastWorkAnalysis>;

const analyzePastWorkSystemPrompt =
    "You are an educational diagnostician. Analyze past exams or homework to identify learner weaknesses and strengths. Stay grounded in the provided work. Do not invent scores, topics, or mistakes that are not supported by the document.";

async function resolveAllContent(content: ContentInput | ContentInput[]): Promise<string> {
    if (!Array.isArray(content)) {
        return resolveContent(content);
    }

    const parts: string[] = [];
    for (const [index, item] of content.entries()) {
        const text = await resolveContent(item);
        parts.push(`Source ${index + 1}:\n${text}`);
    }
    return parts.join("\n\n---\n\n");
}

export async function analyzePastWork(options: AnalyzePastWorkOptions): Promise<PastWorkAnalysisArtifact> {
    const parsed = analyzePastWorkOptionsSchema.safeParse(options);
    if (!parsed.success) {
        throw new InvalidInputError(
            parsed.error.issues[0]?.message ?? "Invalid past work analysis options"
        );
    }

    const { model, content, sourceLabel } = parsed.data;
    const resolvedContent = await resolveAllContent(content);

    const { output } = await generateText({
        model,
        system: analyzePastWorkSystemPrompt,
        prompt: buildGenerationPrompt({
            task: "Analyze the past exam or homework below and produce a diagnostic summary for study personalization.",
            rules: [
                "Identify weak topics grounded in mistakes, incomplete answers, or low scores when present.",
                "Include strong topics only when the work clearly shows solid performance.",
                "List missed concepts as concrete skills or ideas, not vague labels.",
                "Suggest focus areas that would help the learner improve next.",
                "Stay grounded in the provided work and do not invent unsupported information.",
                "Provide a concise title and optional short description for the analysis.",
            ],
            difficulty: "medium",
            content: resolvedContent,
        }),
        output: Output.object({
            schema: pastWorkAnalysisOutputSchema,
        }),
    });

    const analysis: PastWorkAnalysis = {
        weakTopics: output.weakTopics,
    };
    if (output.strongTopics && output.strongTopics.length > 0) {
        analysis.strongTopics = output.strongTopics;
    }
    if (output.missedConcepts && output.missedConcepts.length > 0) {
        analysis.missedConcepts = output.missedConcepts;
    }
    if (output.suggestedFocusAreas && output.suggestedFocusAreas.length > 0) {
        analysis.suggestedFocusAreas = output.suggestedFocusAreas;
    }
    if (output.notes) {
        analysis.notes = output.notes;
    }
    if (sourceLabel) {
        analysis.sourceLabel = sourceLabel;
    }

    return wrapArtifact({
        title: output.title,
        description: output.description,
        content: analysis,
        model,
        difficulty: "medium",
    });
}
