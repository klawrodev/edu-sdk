'use client'

import { gradeQuiz, type GradeQuizQuestion, type GradeQuizResult } from "edu-sdk";
import { useRef, useState } from "react";
import { cn } from "../utils/index.js";

export type QuizClassNames = {
    root?: string;
    progress?: string;
    question?: string;
    options?: string;
    option?: string;
    selectedOption?: string;
    correctOption?: string;
    incorrectOption?: string;
    feedback?: string;
    result?: string;
    controls?: string;
    previousButton?: string;
    nextButton?: string;
    submitButton?: string;
};

export type QuizProps = {
    questions: GradeQuizQuestion[];
    className?: string;
    classNames?: QuizClassNames;
    onComplete?: (result: GradeQuizResult) => void;
}

export function Quiz({ questions, className, classNames, onComplete }: QuizProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptions, setSelectedOptions] = useState<(number | null)[]>(() => questions.map(() => null));
    const [submittedQuestions, setSubmittedQuestions] = useState<boolean[]>(() => questions.map(() => false));
    const [result, setResult] = useState<GradeQuizResult | null>(null);
    const hasCompleted = useRef(false);

    if (questions.length === 0) return null;

    const currentQuestion = questions[currentIndex];
    const selectedOption = selectedOptions[currentIndex];
    const submitted = submittedQuestions[currentIndex];
    const isCorrect = selectedOption === currentQuestion.correctAnswer;

    function nextQuestion() {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    }

    function prevQuestion() {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    }

    function selectOption(idx: number) {
        if (submitted) return;
        setSelectedOptions(prev => {
            const updated = [...prev]
            updated[currentIndex] = idx;
            return updated;
        });
    }

    function submitQuestion() {
        if (selectedOption === null) return;

        const updatedSubmitted = [...submittedQuestions];
        updatedSubmitted[currentIndex] = true;
        setSubmittedQuestions(updatedSubmitted);

        if (updatedSubmitted.every(Boolean) && !hasCompleted.current) {
            hasCompleted.current = true;
            const result = gradeQuiz({
                questions,
                answers: selectedOptions,
            });
            setResult(result);
            onComplete?.(result);
        }
    }

    return (
        <div className={cn("edu-quiz", className, classNames?.root)}>
            <div className={cn("edu-quiz__progress", classNames?.progress)}>
                {currentIndex + 1} / {questions.length}
            </div>

            <div className={cn("edu-quiz__question", classNames?.question)}>
                {currentQuestion.question}
            </div>
            <div className={cn("edu-quiz__options", classNames?.options)}>
                {currentQuestion.options.map((option, idx) => {
                    const selected = selectedOption === idx;
                    const correct = submitted && idx === currentQuestion.correctAnswer
                    const incorrect = submitted && selected && idx !== currentQuestion.correctAnswer
                    return (
                        <button key={idx} type="button" onClick={() => selectOption(idx)}
                            className={cn(
                                "edu-quiz__option",
                                classNames?.option,
                                selected && "edu-quiz__option--selected",
                                correct && "edu-quiz__option--correct",
                                incorrect && "edu-quiz__option--incorrect",
                                selected && classNames?.selectedOption,
                                correct && classNames?.correctOption,
                                incorrect && classNames?.incorrectOption)}
                        >
                            {option}
                        </button>
                    )
                })}
            </div>

            {submitted && (
                <div className={cn("edu-quiz__feedback", classNames?.feedback)}>
                    {isCorrect ? "Correct!" : `Incorrect. The correct answer is ${currentQuestion.options[currentQuestion.correctAnswer]}`}
                </div>
            )}

            <div className={cn("edu-quiz__controls", classNames?.controls)}>
                <button type="button" onClick={prevQuestion} disabled={currentIndex === 0}
                    className={cn("edu-quiz__previous", classNames?.previousButton)}
                >
                    Previous
                </button>
                {!submitted ? (
                    <button type="button" onClick={submitQuestion} disabled={selectedOption === null}
                        className={cn(
                            "edu-quiz__submit",
                            classNames?.submitButton
                        )}
                    >
                        Submit
                    </button>
                ) : currentIndex < questions.length - 1 ? (
                    <button type="button" onClick={nextQuestion} className={cn("edu-quiz__next", classNames?.nextButton)}
                    >
                        Next
                    </button>
                ) : null}
            </div>

            {result && (
                <div className={cn("edu-quiz__result", classNames?.result)}>
                    Score: {result.score} / {result.total}
                </div>
            )}
        </div>
    )
}
