import { describe, expect, test } from "vitest";
import { extractContent } from "../src/content/extract-content";
import { resolveContent } from "../src/content/resolve-content";
import { generationOptionsSchema } from "../src/shared/schema";
import { ContentExtractionError, UnsupportedContentError } from "../src/errors/errors";

const sampleText = "Photosynthesis converts light energy into chemical energy.";

function encodeUtf8(value: string): Uint8Array {
    return new TextEncoder().encode(value);
}

function utf8ByteLength(value: string): number {
    return encodeUtf8(value).byteLength;
}

/** Minimal one-page PDF with extractable Helvetica text (built inline for tests). */
function buildSamplePdf(text: string): Uint8Array {
    const stream = `BT /F1 12 Tf 50 700 Td (${text}) Tj ET`;
    const objects = [
        "1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n",
        "2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n",
        "3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj\n",
        `4 0 obj<< /Length ${stream.length} >>stream\n${stream}\nendstream\nendobj\n`,
        "5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\n",
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(utf8ByteLength(pdf));
        pdf += obj;
    }
    const xrefStart = utf8ByteLength(pdf);
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i <= objects.length; i++) {
        pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
    return encodeUtf8(pdf);
}

describe("extractContent", () => {
    test("extracts plain text", async () => {
        const result = await extractContent({
            type: "file",
            data: encodeUtf8(`${sampleText}\n`),
            mimeType: "text/plain",
            filename: "sample.txt",
        });

        expect(result.text).toBe(sampleText);
        expect(result.mimeType).toBe("text/plain");
        expect(result.filename).toBe("sample.txt");
        expect(result.pageCount).toBeUndefined();
    });

    test("extracts markdown", async () => {
        const markdown = `# Photosynthesis\n\n${sampleText}\n`;
        const result = await extractContent({
            type: "file",
            data: encodeUtf8(markdown),
            mimeType: "text/markdown",
            filename: "sample.md",
        });

        expect(result.text).toContain("Photosynthesis");
        expect(result.text).toContain(sampleText);
        expect(result.mimeType).toBe("text/markdown");
    });

    test("extracts text from a PDF", async () => {
        const result = await extractContent({
            type: "file",
            data: buildSamplePdf(sampleText),
            mimeType: "application/pdf",
            filename: "sample.pdf",
        });

        expect(result.text).toContain("Photosynthesis");
        expect(result.mimeType).toBe("application/pdf");
        expect(result.pageCount).toBe(1);
    });

    test("falls back to filename extension when mime is unknown", async () => {
        const result = await extractContent({
            type: "file",
            data: encodeUtf8(sampleText),
            mimeType: "application/octet-stream",
            filename: "notes.txt",
        });

        expect(result.mimeType).toBe("text/plain");
        expect(result.text).toBe(sampleText);
    });

    test("rejects unsupported mime types", async () => {
        await expect(
            extractContent({
                type: "file",
                data: encodeUtf8(sampleText),
                mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                filename: "notes.docx",
            })
        ).rejects.toBeInstanceOf(UnsupportedContentError);
    });

    test("rejects empty files", async () => {
        await expect(
            extractContent({
                type: "file",
                data: new Uint8Array(),
                mimeType: "text/plain",
            })
        ).rejects.toBeInstanceOf(ContentExtractionError);
    });

    test("rejects whitespace-only text files", async () => {
        await expect(
            extractContent({
                type: "file",
                data: encodeUtf8("   \n\t  "),
                mimeType: "text/plain",
            })
        ).rejects.toBeInstanceOf(ContentExtractionError);
    });

    test("accepts ArrayBuffer data", async () => {
        const bytes = encodeUtf8(sampleText);
        const data = bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
        ) as ArrayBuffer;
        const result = await extractContent({
            type: "file",
            data,
            mimeType: "text/plain",
        });

        expect(result.text).toBe(sampleText);
    });
});

describe("resolveContent", () => {
    test("passes through non-empty strings", async () => {
        await expect(resolveContent(sampleText)).resolves.toBe(sampleText);
    });

    test("rejects empty strings", async () => {
        await expect(resolveContent("")).rejects.toBeInstanceOf(ContentExtractionError);
    });

    test("resolves file content to text", async () => {
        const text = await resolveContent({
            type: "file",
            data: encodeUtf8(sampleText),
            mimeType: "text/plain",
        });
        expect(text).toBe(sampleText);
    });
});

describe("generationOptionsSchema content union", () => {
    test("accepts string content", () => {
        const result = generationOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: sampleText,
        });
        expect(result.success).toBe(true);
    });

    test("accepts file content", () => {
        const result = generationOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: {
                type: "file",
                data: encodeUtf8(sampleText),
                mimeType: "text/plain",
                filename: "sample.txt",
            },
        });
        expect(result.success).toBe(true);
    });

    test("rejects empty string content", () => {
        const result = generationOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: "",
        });
        expect(result.success).toBe(false);
    });

    test("rejects file content without data", () => {
        const result = generationOptionsSchema.safeParse({
            model: "openai/gpt-5",
            content: {
                type: "file",
                mimeType: "text/plain",
            },
        });
        expect(result.success).toBe(false);
    });
});
