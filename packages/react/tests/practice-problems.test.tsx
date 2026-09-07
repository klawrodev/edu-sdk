import { describe, expect, test } from "vitest";
import { PracticeProblems } from '../src/practice-problems/practice-problem';
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const problems = [
    {
        id: 'p-1',
        question: 'A 12 V battery is connected to a 4 Ω resistor. What current flows through it?',
        hint: 'Think about the relationship between voltage, current, and resistance.',
        answer: '3 A',
        solution: "Using Ohm's law, I = V / R. Therefore, I = 12 / 4 = 3 A."
    },
    {
        id: 'p-2',
        question: 'A resistor has 6 V across it and carries 2 A. What is its resistance?',
        hint: "Use Ohm's law to relate voltage, current, and resistance.",
        answer: '3 Ω',
        solution: "Using Ohm's law, R = V / I. Therefore, R = 6 / 2 = 3 Ω."
    }
];

describe('PracticeProblems', () => {
    test('shows the first problem', () => {
        render(<PracticeProblems problems={problems} />);
        expect(screen.getByText('A 12 V battery is connected to a 4 Ω resistor. What current flows through it?')).toBeInTheDocument();
    });

    test('shows hint', async () => {
        const user = userEvent.setup();
        render(<PracticeProblems problems={problems} />);

        await user.click(screen.getByRole('button', {
            name: 'Show Hint'
        }));

        expect(screen.getByText('Think about the relationship between voltage, current, and resistance.')).toBeInTheDocument();
    });

    test('shows answer', async () => {
        const user = userEvent.setup();
        render(<PracticeProblems problems={problems} />);

        await user.click(screen.getByRole('button', {
            name: 'Show Answer'
        }));

        expect(screen.getByText('3 A')).toBeInTheDocument();
    });

    test('shows solution and answer together', async () => {
        const user = userEvent.setup();
        render(<PracticeProblems problems={problems} />);

        await user.click(screen.getByRole('button', {
            name: 'Show Solution'
        }));

        expect(screen.getByText('3 A')).toBeInTheDocument();
        expect(screen.getByText("Using Ohm's law, I = V / R. Therefore, I = 12 / 4 = 3 A.")).toBeInTheDocument();
    });

    test('navigates between problems', async () => {
        const user = userEvent.setup();
        render(<PracticeProblems problems={problems} />);

        expect(screen.getByText('1 / 2')).toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));

        expect(screen.getByText('2 / 2')).toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: 'Previous'
        }));

        expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    test('hides revealed content when moving to another problem', async () => {
        const user = userEvent.setup();
        render(<PracticeProblems problems={problems} />);

        await user.click(screen.getByRole('button', {
            name: 'Show Hint'
        }));

        await user.click(screen.getByRole('button', {
            name: 'Show Solution'
        }));

        expect(screen.getByText('Think about the relationship between voltage, current, and resistance.')).toBeInTheDocument();

        expect(screen.getByText('3 A')).toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));

        expect(screen.queryByText('Think about the relationship between voltage, current, and resistance.')).not.toBeInTheDocument();

        expect(screen.queryByText('3 Ω')).not.toBeInTheDocument();

        expect(screen.queryByText("Using Ohm's law, R = V / I. Therefore, R = 6 / 2 = 3 Ω.")).not.toBeInTheDocument();
    });

    test('disables navigation at boundaries', async () => {
        const user = userEvent.setup();
        render(<PracticeProblems problems={problems} />);

        const prevButton = screen.getByRole('button', {
            name: 'Previous'
        });

        const nextButton = screen.getByRole('button', {
            name: 'Next'
        });

        expect(prevButton).toBeDisabled();
        expect(nextButton).not.toBeDisabled();

        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));

        expect(nextButton).toBeDisabled();
        expect(prevButton).not.toBeDisabled();
    });

    test('renders nothing when there are no practice problems', () => {
        const { container } = render(<PracticeProblems problems={[]} />);

        expect(container).toBeEmptyDOMElement();
    });

    test("applies a custom root class", () => {
        const { container } = render(<PracticeProblems problems={problems} className="custom-practice-problems" />);

        expect(container.firstChild).toHaveClass("edu-practice-problems", "custom-practice-problems");
    });

    test("applies custom problem and question slot classes", () => {
        render(
            <PracticeProblems
                problems={problems}
                classNames={{
                    problem: "custom-problem",
                    question: "custom-question",
                }}
            />
        );

        const question = screen.getByText(
            "A 12 V battery is connected to a 4 Ω resistor. What current flows through it?"
        );

        expect(question).toHaveClass("edu-practice-problems__question", "custom-question");
        expect(question.parentElement).toHaveClass("edu-practice-problems__problem", "custom-problem");
    });
})