export class EduSDKError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'EduSDKError';
    }
}

export class InvalidInputError extends EduSDKError {
    constructor(message: string) {
        super(message);
        this.name = "InvalidInputError";
    }
}

export class UnsupportedContentError extends EduSDKError {
    constructor(message: string) {
        super(message);
        this.name = "UnsupportedContentError";
    }
}

export class ContentExtractionError extends EduSDKError {
    constructor(message: string) {
        super(message);
        this.name = "ContentExtractionError";
    }
}