import { generateText, Output } from "ai";
import { z } from "zod";
import { artifactLabelSchema, wrapArtifact } from "../shared/artifact.js";
import type { Artifact } from "../shared/artifact.js";
import { eduGeneratorSystemPrompt, buildGenerationPrompt } from "../shared/prompts.js";
import { InvalidInputError } from "../errors/errors.js";
import { resolveContent } from "../content/resolve-content.js";
import { createLearningSet } from "../learning-set/create-learning-set.js";
import type { LearningSetContent } from "../learning-set/create-learning-set.js";
import {
    allocationToInclude, assertMaterialKeysMatchAllocation,
    createStudySessionOptionsSchema, normalizeBlockDurations,
    studySessionBlockPlanSchema, studySessionMaterialAllocationSchema,
    type CreateStudySessionOptions, type StudySessionContent,
} from "./schema.js";

export { createStudySessionOptionsSchema } from "./schema.js";
export type { CreateStudySessionOptions, StudySessionBlock, StudySessionContent } from "./schema.js";

const studySessionPlanOutputSchema = artifactLabelSchema.extend({
    topic: z.string().min(1).describe("The main topic of this study session"),
    goals: z
        .array(z.string().min(1))
        .min(1)
        .describe("Concrete learning goals for the session"),
    tips: z
        .array(z.string().min(1))
        .min(1)
        .describe("Short, actionable study tips for this session"),
    blocks: z
        .array(studySessionBlockPlanSchema)
        .min(1)
        .describe("Timed blocks that make up the study session agenda"),
    allocation: studySessionMaterialAllocationSchema.describe(
        "Which learning materials to generate and how much of each"
    ),
});

export type StudySession = Artifact<StudySessionContent>;

export async function createStudySession(
    options: CreateStudySessionOptions
): Promise<StudySession> {
    const parsed = createStudySessionOptionsSchema.safeParse(options);
    if (!parsed.success) {
        throw new InvalidInputError(
            parsed.error.issues[0]?.message ?? "Invalid study session generation options"
        );
    }

    const {
        model,
        content,
        difficulty = "medium",
        durationMinutes,
        topic: seedTopic,
        goals: seedGoals,
    } = parsed.data;
    const resolvedContent = await resolveContent(content);

    const extras: string[] = [
        `Total session duration: ${durationMinutes} minutes. Block durations must sum to exactly ${durationMinutes}.`,
    ];

    if (seedTopic) {
        extras.push(`Preferred topic: ${seedTopic}`);
    }

    if (seedGoals && seedGoals.length > 0) {
        extras.push(`Preferred goals:\n${seedGoals.map((goal) => `- ${goal}`).join("\n")}`);
    }

    const { output } = await generateText({
        model,
        system: eduGeneratorSystemPrompt,
        prompt: buildGenerationPrompt({
            task: `Create a ${difficulty}-difficulty study session plan lasting ${durationMinutes} minutes from the content below.`,
            rules: [
                "Produce a timed agenda of study blocks whose durations sum to the total session duration.",
                "Choose which materials to generate (quiz, flashcards, practice problems, notes, study guide) and how much of each based on duration, difficulty, and content density.",
                "Short sessions should use fewer, lighter materials; longer sessions can include more practice and breaks.",
                "Prefer a sensible sequence: warm-up or read, active practice, break(s) when helpful, then review.",
                "Use the preferred topic and goals when provided; otherwise derive them from the content.",
                "Include brief actionable tips and clear per-block instructions.",
                "Only set materialKey on blocks that use a material you allocated.",
                "Stay grounded in the provided content and do not invent unsupported facts.",
                "Provide a concise title and optional short description for the study session as a whole.",
            ],
            difficulty,
            extras,
            content: resolvedContent,
        }),
        output: Output.object({
            schema: studySessionPlanOutputSchema,
        }),
    });

    assertMaterialKeysMatchAllocation(output.blocks, output.allocation);

    const normalizedBlocks = normalizeBlockDurations(output.blocks, durationMinutes);
    const blocks = normalizedBlocks.map((block) => ({
        ...block,
        id: crypto.randomUUID(),
    }));

    const include = allocationToInclude(output.allocation);
    let materials: LearningSetContent = {};

    if (include.length > 0) {
        const learningSet = await createLearningSet({
            model,
            content: resolvedContent,
            difficulty,
            include,
        });
        materials = learningSet.content;
    }

    return wrapArtifact({
        title: output.title,
        description: output.description,
        content: {
            topic: output.topic,
            goals: output.goals,
            totalDurationMinutes: durationMinutes,
            tips: output.tips,
            blocks,
            materials,
        },
        model,
        difficulty,
    });
}
