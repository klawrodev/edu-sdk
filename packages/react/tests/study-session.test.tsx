import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Artifact, QuizQuestion, StudySessionContent } from "edu-sdk";
import { describe, expect, test, vi } from "vitest";
import { StudySession } from "../src/study-session/study-session";

function artifact<T>(content: T, title = "Artifact"): Artifact<T> {
    return {
        id: "artifact-1",
        title,
        metadata: {
            createdAt: "2026-01-01T00:00:00.000Z",
            model: "test-model",
            difficulty: "medium",
        },
        content,
    };
}

const quizQuestions: QuizQuestion[] = [
    {
        id: "question-1",
        question: "What is voltage?",
        options: [
            "Electrical potential difference",
            "Electrical resistance",
            "Electrical current",
            "Electrical power",
        ],
        correctAnswer: 0,
    },
];

function makeSession(overrides: Partial<StudySessionContent> = {}): StudySessionContent {
    return {
        topic: "Circuit basics",
        goals: ["Understand voltage"],
        tips: ["Take notes"],
        totalDurationMinutes: 20,
        blocks: [
            {
                id: "block-1",
                type: "break",
                title: "Warm-up break",
                durationMinutes: 5,
                instructions: "Stretch and reset.",
            },
            {
                id: "block-2",
                type: "read",
                title: "Read overview",
                durationMinutes: 5,
                instructions: "Skim the chapter summary.",
            },
            {
                id: "block-3",
                type: "quiz",
                title: "Knowledge check",
                durationMinutes: 10,
                instructions: "Answer the quiz.",
                materialKey: "quiz",
            },
        ],
        materials: {
            quiz: artifact(quizQuestions, "Voltage quiz"),
        },
        ...overrides,
    };
}

describe("StudySession", () => {
    test("renders the session topic", () => {
        render(<StudySession session={makeSession()} />);

        expect(screen.getByText("Circuit basics")).toBeInTheDocument();
    });

    test("shows instructions for break and read blocks", () => {
        render(<StudySession session={makeSession()} />);

        expect(screen.getByText("Stretch and reset.")).toBeInTheDocument();
        expect(screen.getByText("Warm-up break")).toBeInTheDocument();
        expect(screen.getByText("Block 1 / 3")).toBeInTheDocument();
    });

    test("mounts Quiz when the current block materialKey is quiz", async () => {
        const user = userEvent.setup();
        render(<StudySession session={makeSession()} />);

        await user.click(screen.getByRole("button", { name: "Skip" }));
        await user.click(screen.getByRole("button", { name: "Skip" }));

        expect(screen.getByText("What is voltage?")).toBeInTheDocument();
        expect(screen.getByText("Knowledge check")).toBeInTheDocument();
        expect(
            screen.queryByText("Answer the quiz.")
        ).not.toBeInTheDocument();
    });

    test("Next advances to the next block", async () => {
        const user = userEvent.setup();
        render(<StudySession session={makeSession()} />);

        await user.click(screen.getByRole("button", { name: "Next" }));

        expect(screen.getByText("Read overview")).toBeInTheDocument();
        expect(screen.getByText("Skim the chapter summary.")).toBeInTheDocument();
        expect(screen.getByText("Block 2 / 3")).toBeInTheDocument();
    });

    test("hides Skip when allowSkip is false", () => {
        render(<StudySession session={makeSession()} allowSkip={false} />);

        expect(
            screen.queryByRole("button", { name: "Skip" })
        ).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    });

    test("Skip advances when allowSkip is true", async () => {
        const user = userEvent.setup();
        render(<StudySession session={makeSession()} />);

        await user.click(screen.getByRole("button", { name: "Skip" }));

        expect(screen.getByText("Read overview")).toBeInTheDocument();
        expect(screen.getByText("Block 2 / 3")).toBeInTheDocument();
    });

    test("calls onSessionComplete after finishing the last block", async () => {
        const user = userEvent.setup();
        const onSessionComplete = vi.fn();
        const session = makeSession({
            blocks: [
                {
                    id: "only",
                    type: "break",
                    title: "Solo break",
                    durationMinutes: 5,
                    instructions: "One block only.",
                },
            ],
            materials: {},
        });

        render(
            <StudySession
                session={session}
                onSessionComplete={onSessionComplete}
            />
        );

        await user.click(screen.getByRole("button", { name: "Finish" }));

        expect(onSessionComplete).toHaveBeenCalledTimes(1);
    });

    test("calls onSessionComplete once when finishing a multi-block session", async () => {
        const user = userEvent.setup();
        const onSessionComplete = vi.fn();
        render(
            <StudySession
                session={makeSession()}
                onSessionComplete={onSessionComplete}
            />
        );

        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name: "Next" }));
        await user.click(screen.getByRole("button", { name: "Finish" }));

        expect(onSessionComplete).toHaveBeenCalledTimes(1);
    });

    test("renders nothing when there are no blocks", () => {
        const { container } = render(
            <StudySession
                session={makeSession({ blocks: [], materials: {} })}
            />
        );

        expect(container).toBeEmptyDOMElement();
    });
});
