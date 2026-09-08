import { describe, expect, test } from "vitest";
import { openai } from "@ai-sdk/openai";
import { generationOptionsSchema } from "../src/shared/schema";

describe("generationOptionsSchema model support", () => {
    test("accepts a gateway model string", () => {
        const result = generationOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: "Electricity"
        });

        expect(result.success).toBe(true);
    });

    test("accepts a LanguageModel object", () => {
        const result = generationOptionsSchema.safeParse({
            model: openai("gpt-5"),
            content: "Electricity"
        });

        expect(result.success).toBe(true);
    });

    test("rejects an empty model string", () => {
        const result = generationOptionsSchema.safeParse({
            model: "",
            content: "Electricity"
        });

        expect(result.success).toBe(false);
    });

    test("rejects an invalid model value", () => {
        const result = generationOptionsSchema.safeParse({
            model: 42,
            content: "Electricity"
        });

        expect(result.success).toBe(false);
    });

    test("accepts FileContent as content", () => {
        const result = generationOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: {
                type: "file",
                data: new TextEncoder().encode("Electricity"),
                mimeType: "text/plain",
            },
        });

        expect(result.success).toBe(true);
    });

    test("accepts optional learnerContext", () => {
        const result = generationOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: "Electricity",
            learnerContext: {
                focusAreas: ["Ohm's law"],
                strongAreas: ["Voltage"],
            },
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.learnerContext).toEqual({
                focusAreas: ["Ohm's law"],
                strongAreas: ["Voltage"],
            });
        }
    });

    test("rejects invalid learnerContext values", () => {
        const result = generationOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: "Electricity",
            learnerContext: {
                focusAreas: [""],
            },
        });

        expect(result.success).toBe(false);
    });
});
