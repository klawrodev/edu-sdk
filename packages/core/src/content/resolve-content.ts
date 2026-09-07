import { ContentExtractionError } from "../errors/errors.js";
import { extractContent } from "./extract-content.js";
import type { ContentInput } from "./types.js";

export async function resolveContent(content: ContentInput): Promise<string> {
    if (typeof content === "string") {
        if (content.length === 0) {
            throw new ContentExtractionError("Content cannot be empty");
        }
        return content;
    }

    const extracted = await extractContent(content);
    return extracted.text;
}
