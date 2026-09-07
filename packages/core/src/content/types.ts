export type FileContent = {
    type: "file";
    data: Uint8Array | ArrayBuffer;
    mimeType: string;
    filename?: string;
};

export type ContentInput = string | FileContent;

export type ExtractedContent = {
    text: string;
    mimeType: string;
    filename?: string;
    pageCount?: number;
};
