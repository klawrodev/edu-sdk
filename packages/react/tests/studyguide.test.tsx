import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { StudyGuide } from "../src/studyguide/studyguide";

const studyGuide = {
    id: "guide-1",
    title: "Electricity",
    metadata: {
        createdAt: "2026-01-01T00:00:00.000Z",
        model: "google/gemini-3.6-flash",
        difficulty: "medium" as const,
    },
    content: {
        summary: "Electricity involves the behavior and movement of electric charge.",
        keyConcepts: [
            {
                concept: "Voltage",
                explanation: "Voltage is the electric potential difference between two points."
            },
            {
                concept: "Current",
                explanation: "Current is the rate of flow of electric charge."
            }
        ],
        reviewQuestions: [
            "What is voltage?",
            "How is current measured?"
        ]
    }
};

describe("StudyGuide", () => {
    test("renders the study guide title and summary", () => {
        render(<StudyGuide studyGuide={studyGuide} />);

        expect(screen.getByRole("heading", {
            name: "Electricity"
        })).toBeInTheDocument();

        expect(screen.getByText("Electricity involves the behavior and movement of electric charge.")).toBeInTheDocument();
    });

    test("renders all key concepts", () => {
        render(<StudyGuide studyGuide={studyGuide} />);

        expect(screen.getByText("Voltage")).toBeInTheDocument();

        expect(screen.getByText("Voltage is the electric potential difference between two points.")).toBeInTheDocument();

        expect(screen.getByText("Current")).toBeInTheDocument();

        expect(screen.getByText("Current is the rate of flow of electric charge.")).toBeInTheDocument();
    });

    test("renders all review questions", () => {
        render(<StudyGuide studyGuide={studyGuide} />);

        expect(screen.getByText("What is voltage?")).toBeInTheDocument();

        expect(screen.getByText("How is current measured?")).toBeInTheDocument();
    });

    test("applies a custom root class", () => {
        const { container } = render(<StudyGuide studyGuide={studyGuide} className="custom-study-guide"/>);

        expect(container.firstChild).toHaveClass("edu-study-guide", "custom-study-guide");
    });

    test("applies custom slot classes", () => {
        render(<StudyGuide studyGuide={studyGuide} 
            classNames={{
                title: "custom-title",
                keyConcept: "custom-concept",
                reviewQuestion: "custom-review-question"
            }}
        />);

        expect(screen.getByRole("heading", {
            name: "Electricity"
        })).toHaveClass("custom-title");

        expect(screen.getByText("Voltage").parentElement).toHaveClass("custom-concept");

        expect(screen.getByText("What is voltage?")).toHaveClass("custom-review-question");
    });
});
