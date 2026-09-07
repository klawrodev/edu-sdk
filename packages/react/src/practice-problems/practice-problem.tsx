'use client'

import type { PracticeProblem } from "edu-sdk";
import { useState } from "react";
import { cn } from "../utils/index.js";

export type PracticeProblemsClassNames = {
    root?: string;
    progress?: string;
    problem?: string;
    question?: string;
    actions?: string;
    hintButton?: string;
    answerButton?: string;
    solutionButton?: string;
    hint?: string;
    answer?: string;
    solution?: string;
    controls?: string;
    previousButton?: string;
    nextButton?: string;
}

export type PracticeProblemsProps = {
    problems: PracticeProblem[];
    className?: string;
    classNames?: PracticeProblemsClassNames
}

export function PracticeProblems({ problems, className, classNames }: PracticeProblemsProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showSolution, setShowSolution] = useState(false);

    if (problems.length === 0) return null;

    const currentProblem = problems[currentIndex];

    function resetReveals() {
        setShowHint(false);
        setShowAnswer(false);
        setShowSolution(false);
    }

    function prevProblem() {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            resetReveals();
        }
    }

    function nextProblem() {
        if (currentIndex < problems.length - 1) {
            setCurrentIndex(prev => prev + 1);
            resetReveals();
        }
    }

    function revealSolution() {
        setShowAnswer(true);
        setShowSolution(true);
    }

    return (
        <div className={cn("edu-practice-problems", className, classNames?.root)}>
            <div className={cn("edu-practice-problems__progress", classNames?.progress)}>
                {currentIndex + 1} / {problems.length}
            </div>

            <div className={cn("edu-practice-problems__problem", classNames?.problem)}>
                <div className={cn("edu-practice-problems__question", classNames?.question)}>
                    {currentProblem.question}
                </div>
            </div>

            <div className={cn("edu-practice-problems__actions", classNames?.actions)}>
                <button type="button" onClick={() => setShowHint(true)}
                    className={cn("edu-practice-problems__hint-button", classNames?.hintButton)}
                >
                    Show Hint
                </button>
                <button type="button" onClick={() => setShowAnswer(true)}
                    className={cn("edu-practice-problems__answer-button", classNames?.answerButton)}
                >
                    Show Answer
                </button>
                <button type="button" onClick={revealSolution}
                    className={cn("edu-practice-problems__solution-button", classNames?.solutionButton)}
                >
                    Show Solution
                </button>
            </div>

            {showHint && (
                <div className={cn("edu-practice-problems__hint", classNames?.hint)}>
                    <strong>Hint:</strong> {currentProblem.hint}
                </div>
            )}

            {showAnswer && (
                <div className={cn("edu-practice-problems__answer", classNames?.answer)}>
                    <strong>Answer:</strong> {currentProblem.answer}
                </div>
            )}

            {showSolution && (
                <div className={cn("edu-practice-problems__solution", classNames?.solution)}>
                    <strong>Solution:</strong> {currentProblem.solution}
                </div>
            )}

            <div className={cn("edu-practice-problems__controls", classNames?.controls)}>
                <button type="button"
                    onClick={prevProblem} disabled={currentIndex === 0}
                    className={cn("edu-practice-problems__previous", classNames?.previousButton)}
                >
                    Previous
                </button>
                <button type="button"
                    onClick={nextProblem} disabled={currentIndex === problems.length - 1}
                    className={cn("edu-practice-problems__next", classNames?.nextButton)}
                >
                    Next
                </button>
            </div>
        </div>
    )
}