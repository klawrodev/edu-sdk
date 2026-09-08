import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Quiz } from '../src/quiz/quiz';
import userEvent from "@testing-library/user-event";

const questions = [
    {
        id: "q-1",
        question: "What is voltage?",
        options: [
            "Electrical potential difference",
            "Electrical resistance",
            "Electrical current",
            "Electrical power"
        ],
        correctAnswer: 0
    },
    {
        id: "q-2",
        question: "What is the unit of current?",
        options: [
            "Volt",
            "Ampere",
            "Ohm",
            "Watt"
        ],
        correctAnswer: 1
    }
];

describe('Quiz', () => {
    test('shows the first question', () => {
        render(<Quiz questions={questions} />);

        expect(screen.getByText('What is voltage?')).toBeInTheDocument();
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    test('moves to the next question', async () => {
        const user = userEvent.setup();
        render(<Quiz questions={questions} />);
        await user.click(screen.getByRole('button', {
            name: 'Electrical potential difference'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));

        expect(screen.getByText('What is the unit of current?')).toBeInTheDocument();
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    test('shows correct/incorrect message', async () => {
        const user = userEvent.setup();
        render(<Quiz questions={questions} />);

        await user.click(screen.getByRole('button', {
            name: 'Electrical potential difference'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));

        expect(screen.getByText('Correct!')).toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Volt'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));

        expect(screen.getByText('Incorrect. The correct answer is Ampere')).toBeInTheDocument();
    });

    test('disables submit until an option is selected', async () => {
        const user = userEvent.setup();
        render(<Quiz questions={questions} />);

        const submitButton = screen.getByRole('button', {
            name: 'Submit'
        });

        expect(submitButton).toBeDisabled();

        await user.click(screen.getByRole('button', {
            name: 'Electrical potential difference'
        }));

        expect(submitButton).not.toBeDisabled();
    });

    test('starts the next question without a selected answer', async () => {
        const user = userEvent.setup();
        render(<Quiz questions={questions} />);

        await user.click(screen.getByRole('button', {
            name: 'Electrical potential difference'
        }));

        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));

        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));

        const submitButton = screen.getByRole('button', {
            name: 'Submit'
        });

        expect(submitButton).toBeDisabled();
        expect(screen.queryByText('Correct!')).not.toBeInTheDocument();
    });

    test('preserves submitted answers when returning to a previous question', async () => {
        const user = userEvent.setup();
        render(<Quiz questions={questions} />);

        await user.click(screen.getByRole('button', {
            name: 'Electrical potential difference'
        }));

        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));

        expect(screen.getByText('Correct!')).toBeInTheDocument();

        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));

        await user.click(screen.getByRole('button', {
            name: 'Previous'
        }));

        expect(screen.getByText('What is voltage?')).toBeInTheDocument();
        expect(screen.getByText('Correct!')).toBeInTheDocument();
    });

    test('shows score at the end of quiz', async () => {
        const user = userEvent.setup();
        render(<Quiz questions={questions} />);

        await user.click(screen.getByRole('button', {
            name: 'Electrical potential difference'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Volt'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));

        expect(screen.getByText('Score: 1 / 2')).toBeInTheDocument();
    });

    test('calls onComplete with the grade result when the quiz is finished', async () => {
        const user = userEvent.setup();
        const onComplete = vi.fn();
        render(<Quiz questions={questions} onComplete={onComplete} />);

        await user.click(screen.getByRole('button', {
            name: 'Electrical potential difference'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Ampere'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(onComplete).toHaveBeenCalledWith({
            score: 2,
            total: 2,
            percentage: 100,
            results: [
                {
                    questionIndex: 0,
                    selectedAnswer: 0,
                    correctAnswer: 0,
                    isCorrect: true,
                    isAnswered: true,
                },
                {
                    questionIndex: 1,
                    selectedAnswer: 1,
                    correctAnswer: 1,
                    isCorrect: true,
                    isAnswered: true,
                },
            ],
        });
    });

    test('does not call onComplete before the quiz is complete', async () => {
        const user = userEvent.setup();
        const onComplete = vi.fn();
        render(<Quiz questions={questions} onComplete={onComplete} />);

        await user.click(screen.getByRole('button', {
            name: 'Electrical potential difference'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));

        expect(onComplete).not.toHaveBeenCalled();
    });

    test('does not call onComplete again after navigating Previous', async () => {
        const user = userEvent.setup();
        const onComplete = vi.fn();
        render(<Quiz questions={questions} onComplete={onComplete} />);

        await user.click(screen.getByRole('button', {
            name: 'Electrical potential difference'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Next'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Volt'
        }));
        await user.click(screen.getByRole('button', {
            name: 'Submit'
        }));

        expect(onComplete).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: 'Previous' }));

        expect(onComplete).toHaveBeenCalledTimes(1);
        expect(screen.getByText('Score: 1 / 2')).toBeInTheDocument();
    });

    test('renders nothing when there are no questions', () => {
        const { container } = render(<Quiz questions={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    test("applies a custom root class", () => {
        const { container } = render(<Quiz questions={questions} className="custom-quiz" />);

        expect(container.firstChild).toHaveClass("edu-quiz", "custom-quiz");
    });
});
