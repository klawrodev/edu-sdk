import { beforeEach, describe, expect, test, vi } from "vitest";
import { generateText } from "ai";
import { analyzePastWork, analyzePastWorkOptionsSchema } from "../src/personalization/analyze-past-work.js";
import { InvalidInputError } from "../src/errors/errors";

vi.mock(import("ai"), async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        generateText: vi.fn(),
    };
});

const mockedGenerateText = vi.mocked(generateText);

describe("analyzePastWorkOptionsSchema", () => {
    test("rejects empty content", () => {
        const result = analyzePastWorkOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: "",
        });
        expect(result.success).toBe(false);
    });

    test("rejects an empty content array", () => {
        const result = analyzePastWorkOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: [],
        });
        expect(result.success).toBe(false);
    });

    test("accepts a single content string and optional sourceLabel", () => {
        const result = analyzePastWorkOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: "Midterm exam answers...",
            sourceLabel: "Fall midterm",
        });
        expect(result.success).toBe(true);
    });

    test("accepts multiple content inputs", () => {
        const result = analyzePastWorkOptionsSchema.safeParse({
            model: "google/gemini-3.6-flash",
            content: ["Exam 1", "Homework 4"],
        });
        expect(result.success).toBe(true);
    });
});

describe("analyzePastWork", () => {
    beforeEach(() => {
        mockedGenerateText.mockReset();
        mockedGenerateText.mockResolvedValue({
            output: {
                title: "Midterm diagnostic",
                description: "Weak on circuits",
                weakTopics: ["Ohm's law", "Series circuits"],
                strongTopics: ["Voltage"],
                missedConcepts: ["Equivalent resistance"],
                suggestedFocusAreas: ["Circuit analysis"],
                notes: "Missed multi-step resistor problems",
            },
        } as never);
    });

    test("returns an artifact with analysis content", async () => {
        const result = await analyzePastWork({
            model: "google/gemini-3.6-flash",
            content: "Past exam text",
            sourceLabel: "Fall midterm",
        });

        expect(result.title).toBe("Midterm diagnostic");
        expect(result.description).toBe("Weak on circuits");
        expect(result.content).toEqual({
            weakTopics: ["Ohm's law", "Series circuits"],
            strongTopics: ["Voltage"],
            missedConcepts: ["Equivalent resistance"],
            suggestedFocusAreas: ["Circuit analysis"],
            notes: "Missed multi-step resistor problems",
            sourceLabel: "Fall midterm",
        });
        expect(result.metadata).toEqual({
            createdAt: expect.any(String),
            model: "google/gemini-3.6-flash",
            difficulty: "medium",
        });
        expect(result.id).toEqual(expect.any(String));
    });

    test("omits sourceLabel when not provided", async () => {
        const result = await analyzePastWork({
            model: "google/gemini-3.6-flash",
            content: "Past exam text",
        });

        expect(result.content.sourceLabel).toBeUndefined();
    });

    test("joins multiple content sources in the prompt", async () => {
        await analyzePastWork({
            model: "google/gemini-3.6-flash",
            content: ["First exam", "Second homework"],
        });

        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("Source 1:\nFirst exam"),
            })
        );
        expect(mockedGenerateText).toHaveBeenCalledWith(
            expect.objectContaining({
                prompt: expect.stringContaining("Source 2:\nSecond homework"),
            })
        );
    });

    test("does not call generateText for invalid input", async () => {
        await expect(
            analyzePastWork({
                model: "google/gemini-3.6-flash",
                content: "",
            })
        ).rejects.toThrow(InvalidInputError);

        expect(mockedGenerateText).not.toHaveBeenCalled();
    });

    test("omits empty optional arrays from content", async () => {
        mockedGenerateText.mockResolvedValue({
            output: {
                title: "Sparse diagnostic",
                weakTopics: ["Current"],
                strongTopics: [],
                missedConcepts: [],
                suggestedFocusAreas: [],
            },
        } as never);

        const result = await analyzePastWork({
            model: "google/gemini-3.6-flash",
            content: "Past exam text",
        });

        expect(result.content).toEqual({
            weakTopics: ["Current"],
        });
    });
});
