import { beforeEach, describe, expect, test, vi } from "vitest";
import { generateText } from "ai";
import { createStudySession, createStudySessionOptionsSchema } from "../src/study-session/create-study-session";
import { assertMaterialKeysMatchAllocation, normalizeBlockDurations } from "../src/study-session/schema";
import { eduGeneratorSystemPrompt } from "../src/shared/prompts";
import { InvalidInputError } from "../src/errors/errors";

vi.mock(import("ai"), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        generateText: vi.fn(),
    };
});

const mockedGenerateText = vi.mocked(generateText);

describe("createStudySessionOptionsSchema", () => {
    test("accepts valid options", () => {
        const result = createStudySessionOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: "Electricity",
            durationMinutes: 45,
            difficulty: "hard",
            topic: "Circuits",
            goals: ["Explain Ohm's law"],
        });

        expect(result.success).toBe(true);
    });

    test("rejects durationMinutes below 5", () => {
        const result = createStudySessionOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: "Electricity",
            durationMinutes: 4,
        });

        expect(result.success).toBe(false);
    });

    test("rejects durationMinutes above 240", () => {
        const result = createStudySessionOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: "Electricity",
            durationMinutes: 241,
        });

        expect(result.success).toBe(false);
    });

    test("requires durationMinutes", () => {
        const result = createStudySessionOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: "Electricity",
        });

        expect(result.success).toBe(false);
    });
});

describe("normalizeBlockDurations", () => {
    test("returns blocks unchanged when durations already match", () => {
        const blocks = [
            { type: "read" as const, durationMinutes: 20 },
            { type: "break" as const, durationMinutes: 5 },
            { type: "quiz" as const, durationMinutes: 20 },
        ];

        expect(normalizeBlockDurations(blocks, 45)).toEqual(blocks);
    });

    test("adjusts the last non-break block within tolerance", () => {
        const blocks = [
            { type: "read" as const, durationMinutes: 20 },
            { type: "break" as const, durationMinutes: 5 },
            { type: "quiz" as const, durationMinutes: 18 },
        ];

        expect(normalizeBlockDurations(blocks, 45)).toEqual([
            { type: "read", durationMinutes: 20 },
            { type: "break", durationMinutes: 5 },
            { type: "quiz", durationMinutes: 20 },
        ]);
    });

    test("throws when the duration gap is outside tolerance", () => {
        const blocks = [
            { type: "read" as const, durationMinutes: 10 },
            { type: "quiz" as const, durationMinutes: 10 },
        ];

        expect(() => normalizeBlockDurations(blocks, 45)).toThrow(InvalidInputError);
    });

    test("throws when every block is a break", () => {
        const blocks = [
            { type: "break" as const, durationMinutes: 20 },
            { type: "break" as const, durationMinutes: 23 },
        ];

        expect(() => normalizeBlockDurations(blocks, 45)).toThrow(InvalidInputError);
    });
});

describe("assertMaterialKeysMatchAllocation", () => {
    test("allows materialKeys that were allocated", () => {
        expect(() =>
            assertMaterialKeysMatchAllocation(
                [{ materialKey: "quiz" }, { materialKey: "flashcards" }, {}],
                {
                    quiz: { count: 3 },
                    flashcards: { count: 6 },
                }
            )
        ).not.toThrow();
    });

    test("throws when a block references an unallocated material", () => {
        expect(() =>
            assertMaterialKeysMatchAllocation([{ materialKey: "notes" }], {
                quiz: { count: 3 },
            })
        ).toThrow(InvalidInputError);
    });
});

describe("createStudySession", () => {
    const plan = {
        title: "Electricity Session",
        description: "A focused electricity study session",
        topic: "Electricity",
        goals: ["Explain voltage", "Apply Ohm's law"],
        tips: ["Study without distractions"],
        blocks: [
            {
                type: "read",
                title: "Read notes",
                durationMinutes: 20,
                instructions: "Skim the key ideas",
            },
            {
                type: "break",
                title: "Break",
                durationMinutes: 5,
                instructions: "Rest briefly",
            },
            {
                type: "quiz",
                title: "Practice quiz",
                durationMinutes: 20,
                instructions: "Answer the quiz questions",
                materialKey: "quiz",
            },
        ],
        allocation: {
            quiz: { count: 5 },
        },
    };

    beforeEach(() => {
        mockedGenerateText.mockReset();
        mockedGenerateText.mockResolvedValue({
            output: plan,
        } as any);
    });

    test("returns an artifact with study session content and empty materials", async () => {
        const result = await createStudySession({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            durationMinutes: 45,
        });

        expect(result.title).toBe("Electricity Session");
        expect(result.description).toBe("A focused electricity study session");
        expect(result.content.topic).toBe("Electricity");
        expect(result.content.goals).toEqual(plan.goals);
        expect(result.content.tips).toEqual(plan.tips);
        expect(result.content.totalDurationMinutes).toBe(45);
        expect(result.content.materials).toEqual({});
        expect(result.content.blocks).toEqual([
            {
                ...plan.blocks[0],
                id: expect.any(String),
            },
            {
                ...plan.blocks[1],
                id: expect.any(String),
            },
            {
                ...plan.blocks[2],
                id: expect.any(String),
            },
        ]);
        expect(result.metadata).toEqual({
            createdAt: expect.any(String),
            model: "google/gemini-3.6-flash",
            difficulty: "medium",
        });
        expect(result.id).toEqual(expect.any(String));
    });

    test("normalizes block durations within tolerance", async () => {
        mockedGenerateText.mockResolvedValue({
            output: {
                ...plan,
                blocks: [
                    {
                        type: "read",
                        title: "Read notes",
                        durationMinutes: 20,
                        instructions: "Skim the key ideas",
                    },
                    {
                        type: "quiz",
                        title: "Practice quiz",
                        durationMinutes: 23,
                        instructions: "Answer the quiz questions",
                        materialKey: "quiz",
                    },
                ],
            },
        } as any);

        const result = await createStudySession({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            durationMinutes: 45,
        });

        expect(result.content.blocks.map((block) => block.durationMinutes)).toEqual([20, 25]);
    });

    test("does not call generateText for invalid input", async () => {
        await expect(
            createStudySession({
                model: "",
                content: "Electricity",
                durationMinutes: 45,
            })
        ).rejects.toThrow();

        expect(mockedGenerateText).not.toHaveBeenCalled();
    });

    test("uses the provided model", async () => {
        await createStudySession({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            durationMinutes: 45,
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                model: "google/gemini-3.6-flash",
            })
        );
    });

    test("uses the provided difficulty level", async () => {
        await createStudySession({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            durationMinutes: 45,
            difficulty: "hard",
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("hard-difficulty"),
            })
        );
    });

    test("uses default difficulty level", async () => {
        await createStudySession({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            durationMinutes: 45,
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("medium-difficulty"),
            })
        );
    });

    test("includes duration and seed topic or goals in the prompt", async () => {
        await createStudySession({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            durationMinutes: 45,
            topic: "Circuits",
            goals: ["Explain current"],
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("45 minutes"),
            })
        );
        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("Preferred topic: Circuits"),
            })
        );
        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("Explain current"),
            })
        );
    });

    test("passes the shared system prompt", async () => {
        await createStudySession({
            model: "google/gemini-3.6-flash",
            content: "Electricity",
            durationMinutes: 45,
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                system: eduGeneratorSystemPrompt,
            })
        );
    });
});

describe("error handling", () => {
    test("throws InvalidInputError for invalid generation options", async () => {
        await expect(
            createStudySession({
                model: "google/gemini-3.6-flash",
                content: "",
                durationMinutes: 45,
            })
        ).rejects.toBeInstanceOf(InvalidInputError);
    });

    test("throws InvalidInputError when a block references an unallocated material", async () => {
        mockedGenerateText.mockResolvedValue({
            output: {
                title: "Bad Session",
                topic: "Electricity",
                goals: ["Learn"],
                tips: ["Focus"],
                blocks: [
                    {
                        type: "notes",
                        title: "Notes",
                        durationMinutes: 45,
                        instructions: "Read the notes",
                        materialKey: "notes",
                    },
                ],
                allocation: {
                    quiz: { count: 3 },
                },
            },
        } as any);

        await expect(
            createStudySession({
                model: "google/gemini-3.6-flash",
                content: "Electricity",
                durationMinutes: 45,
            })
        ).rejects.toBeInstanceOf(InvalidInputError);
    });
});
