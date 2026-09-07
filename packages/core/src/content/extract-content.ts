import { extractText } from "unpdf";
import { ContentExtractionError, InvalidInputError, UnsupportedContentError } from "../errors/errors.js";
import type { ExtractedContent, FileContent } from "./types.js";

const textMimeTypes = new Set(["text/plain", "text/markdown"]);
const pdfMimeType = "application/pdf";

function extensionOf(filename: string | undefined): string | undefined {
    if (!filename) {
        return undefined;
    }
    const base = filename.split(/[/\\]/).pop() ?? filename;
    const dot = base.lastIndexOf(".");
    if (dot <= 0 || dot === base.length - 1) {
        return undefined;
    }
    return base.slice(dot + 1).toLowerCase();
}

function resolveMimeType(input: FileContent): string {
    const mime = input.mimeType.trim().toLowerCase();
    if (mime === pdfMimeType || textMimeTypes.has(mime)) {
        return mime;
    }

    const ext = extensionOf(input.filename);
    if (ext === "pdf") {
        return pdfMimeType;
    }
    if (ext === "txt") {
        return "text/plain";
    }
    if (ext === "md" || ext === "markdown") {
        return "text/markdown";
    }

    throw new UnsupportedContentError(
        `Unsupported content type "${input.mimeType}"${input.filename ? ` for file "${input.filename}"` : ""}. Supported types: application/pdf, text/plain, text/markdown.`
    );
}

function toUint8Array(data: Uint8Array | ArrayBuffer): Uint8Array {
    if (data instanceof Uint8Array) {
        return data;
    }
    return new Uint8Array(data);
}

function decodeText(bytes: Uint8Array): string {
    return new TextDecoder("utf-8").decode(bytes).trim();
}

async function extractPdfText(bytes: Uint8Array): Promise<{ text: string; pageCount: number }> {
    try {
        const { text, totalPages } = await extractText(bytes, { mergePages: true });
        const merged = Array.isArray(text) ? text.join("\n") : text;
        return { text: merged.trim(), pageCount: totalPages };
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown PDF extraction error";
        throw new ContentExtractionError(`Failed to extract text from PDF: ${message}`);
    }
}

export async function extractContent(input: FileContent): Promise<ExtractedContent> {
    if (input === null || typeof input !== "object" || input.type !== "file") {
        throw new InvalidInputError('extractContent expects a FileContent object with type: "file"');
    }

    if (!(input.data instanceof Uint8Array) && !(input.data instanceof ArrayBuffer)) {
        throw new InvalidInputError("FileContent.data must be a Uint8Array or ArrayBuffer");
    }

    if (typeof input.mimeType !== "string" || input.mimeType.trim().length === 0) {
        throw new InvalidInputError("FileContent.mimeType must be a non-empty string");
    }

    const bytes = toUint8Array(input.data);
    if (bytes.byteLength === 0) {
        throw new ContentExtractionError("File content is empty");
    }

    const mimeType = resolveMimeType(input);
    let text: string;
    let pageCount: number | undefined;

    if (mimeType === pdfMimeType) {
        const extracted = await extractPdfText(bytes);
        text = extracted.text;
        pageCount = extracted.pageCount;
    } else {
        text = decodeText(bytes);
    }

    if (text.length === 0) {
        throw new ContentExtractionError(
            mimeType === pdfMimeType
                ? "Extracted PDF text is empty (scanned PDFs without OCR are not supported)"
                : "Extracted text content is empty"
        );
    }

    const result: ExtractedContent = {
        text,
        mimeType,
    };

    if (input.filename !== undefined) {
        result.filename = input.filename;
    }
    if (pageCount !== undefined) {
        result.pageCount = pageCount;
    }

    return result;
}
