'use client'

import type {
    Artifact, Flashcard, PracticeProblem, QuizQuestion, StudyGuideContent,
    StudySessionBlock, StudySessionContent
} from "edu-sdk";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Flashcards, type FlashcardsProps } from "../flashcards/flashcards.js";
import { PracticeProblems, type PracticeProblemsProps } from "../practice-problems/practice-problem.js";
import { Quiz, type QuizProps } from "../quiz/quiz.js";
import { StudyGuide, type StudyGuideProps } from "../studyguide/studyguide.js";
import { cn } from "../utils/index.js";

export type StudySessionClassNames = {
    root?: string;
    header?: string;
    topic?: string;
    goals?: string;
    goal?: string;
    tips?: string;
    tip?: string;
    progress?: string;
    timer?: string;
    blockTitle?: string;
    blockType?: string;
    instructions?: string;
    body?: string;
    notes?: string;
    controls?: string;
    previousButton?: string;
    nextButton?: string;
    skipButton?: string;
};

export type StudySessionProps = {
    session: StudySessionContent;
    className?: string;
    classNames?: StudySessionClassNames;
    allowSkip?: boolean;
    autoAdvance?: boolean;
    renderNotes?: (markdown: string) => ReactNode;
    renderQuiz?: (questions: QuizQuestion[]) => ReactNode;
    renderFlashcards?: (flashcards: Flashcard[]) => ReactNode;
    renderPracticeProblems?: (problems: PracticeProblem[]) => ReactNode;
    renderStudyGuide?: (studyGuide: Artifact<StudyGuideContent>) => ReactNode;
    quizProps?: Omit<QuizProps, "questions">;
    flashcardsProps?: Omit<FlashcardsProps, "flashcards">;
    practiceProblemsProps?: Omit<PracticeProblemsProps, "problems">;
    studyGuideProps?: Omit<StudyGuideProps, "studyGuide">;
    onBlockComplete?: (block: StudySessionBlock, index: number) => void;
    onSessionComplete?: () => void;
};

function formatRemaining(totalSeconds: number): string {
    const clamped = Math.max(0, totalSeconds);
    const minutes = Math.floor(clamped / 60);
    const seconds = clamped % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function StudySession({
    session,
    className,
    classNames,
    allowSkip = true,
    autoAdvance = false,
    renderNotes,
    renderQuiz,
    renderFlashcards,
    renderPracticeProblems,
    renderStudyGuide,
    quizProps,
    flashcardsProps,
    practiceProblemsProps,
    studyGuideProps,
    onBlockComplete,
    onSessionComplete,
}: StudySessionProps) {
    const { topic, goals, tips, blocks, materials } = session;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [remainingSeconds, setRemainingSeconds] = useState(() =>
        blocks[0] ? blocks[0].durationMinutes * 60 : 0
    );

    const hasCompletedSession = useRef(false);
    const completedBlockIds = useRef(new Set<string>());
    const onBlockCompleteRef = useRef(onBlockComplete);
    const onSessionCompleteRef = useRef(onSessionComplete);
    const autoAdvanceRef = useRef(autoAdvance);

    onBlockCompleteRef.current = onBlockComplete;
    onSessionCompleteRef.current = onSessionComplete;
    autoAdvanceRef.current = autoAdvance;

    function markBlockComplete(block: StudySessionBlock, index: number) {
        if (completedBlockIds.current.has(block.id)) return;
        completedBlockIds.current.add(block.id);
        onBlockCompleteRef.current?.(block, index);
    }

    function completeSessionIfNeeded() {
        if (hasCompletedSession.current) return;
        hasCompletedSession.current = true;
        onSessionCompleteRef.current?.();
    }

    useEffect(() => {
        const block = blocks[currentIndex];
        if (!block) return;

        let remaining = block.durationMinutes * 60;
        setRemainingSeconds(remaining);

        const id = window.setInterval(() => {
            remaining -= 1;
            setRemainingSeconds(Math.max(0, remaining));

            if (remaining > 0) return;

            window.clearInterval(id);
            markBlockComplete(block, currentIndex);

            if (!autoAdvanceRef.current) return;

            if (currentIndex < blocks.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                return;
            }

            completeSessionIfNeeded();
        }, 1000);

        return () => window.clearInterval(id);
    }, [blocks, currentIndex]);

    if (blocks.length === 0) return null;

    const currentBlock = blocks[currentIndex];
    const isLastBlock = currentIndex === blocks.length - 1;

    function goPrevious() {
        if (currentIndex > 0) {
            setCurrentIndex((prev) => prev - 1);
        }
    }

    function goNext() {
        markBlockComplete(currentBlock, currentIndex);

        if (isLastBlock) {
            completeSessionIfNeeded();
            return;
        }

        setCurrentIndex((prev) => prev + 1);
    }

    function skipBlock() {
        if (!allowSkip) return;
        goNext();
    }

    function renderMaterial(): ReactNode {
        switch (currentBlock.materialKey) {
            case "quiz": {
                if (!materials.quiz) return null;
                if (renderQuiz) return renderQuiz(materials.quiz.content);
                return <Quiz questions={materials.quiz.content} {...quizProps} />;
            }
            case "flashcards": {
                if (!materials.flashcards) return null;
                if (renderFlashcards) return renderFlashcards(materials.flashcards.content);
                return (
                    <Flashcards
                        flashcards={materials.flashcards.content}
                        {...flashcardsProps}
                    />
                );
            }
            case "practiceProblems": {
                if (!materials.practiceProblems) return null;
                if (renderPracticeProblems) return renderPracticeProblems(materials.practiceProblems.content);
                return (
                    <PracticeProblems
                        problems={materials.practiceProblems.content}
                        {...practiceProblemsProps}
                    />
                );
            }
            case "studyGuide": {
                if (!materials.studyGuide) return null;
                if (renderStudyGuide) return renderStudyGuide(materials.studyGuide);
                return (
                    <StudyGuide studyGuide={materials.studyGuide} {...studyGuideProps} />
                );
            }
            case "notes":
                return materials.notes ? (
                    <div className={cn("edu-study-session__notes", classNames?.notes)}>
                        {renderNotes ? (
                            renderNotes(materials.notes.content)
                        ) : (
                            <pre className="edu-study-session__notes-text">
                                {materials.notes.content}
                            </pre>
                        )}
                    </div>
                ) : null;
            default:
                return null;
        }
    }

    const material = renderMaterial();

    return (
        <div className={cn("edu-study-session", className, classNames?.root)}>
            <header className={cn("edu-study-session__header", classNames?.header)}>
                <h2 className={cn("edu-study-session__topic", classNames?.topic)}>
                    {topic}
                </h2>

                {goals.length > 0 && (
                    <ul className={cn("edu-study-session__goals", classNames?.goals)}>
                        {goals.map((goal) => (
                            <li
                                key={goal}
                                className={cn("edu-study-session__goal", classNames?.goal)}
                            >
                                {goal}
                            </li>
                        ))}
                    </ul>
                )}

                {tips.length > 0 && (
                    <ul className={cn("edu-study-session__tips", classNames?.tips)}>
                        {tips.map((tip) => (
                            <li
                                key={tip}
                                className={cn("edu-study-session__tip", classNames?.tip)}
                            >
                                {tip}
                            </li>
                        ))}
                    </ul>
                )}
            </header>

            <div className={cn("edu-study-session__progress", classNames?.progress)}>
                <span>
                    Block {currentIndex + 1} / {blocks.length}
                </span>
                <span className={cn("edu-study-session__block-type", classNames?.blockType)}>
                    {currentBlock.type}
                </span>
                <span className={cn("edu-study-session__timer", classNames?.timer)}>
                    {formatRemaining(remainingSeconds)}
                </span>
            </div>

            <h3 className={cn("edu-study-session__block-title", classNames?.blockTitle)}>
                {currentBlock.title}
            </h3>

            <div className={cn("edu-study-session__body", classNames?.body)}>
                {material ?? (
                    <p
                        className={cn(
                            "edu-study-session__instructions",
                            classNames?.instructions
                        )}
                    >
                        {currentBlock.instructions}
                    </p>
                )}
            </div>

            <div className={cn("edu-study-session__controls", classNames?.controls)}>
                <button
                    type="button"
                    onClick={goPrevious}
                    disabled={currentIndex === 0}
                    className={cn(
                        "edu-study-session__previous",
                        classNames?.previousButton
                    )}
                >
                    Previous
                </button>

                <div className="edu-study-session__controls-end">
                    {allowSkip && !isLastBlock && (
                        <button
                            type="button"
                            onClick={skipBlock}
                            className={cn(
                                "edu-study-session__skip",
                                classNames?.skipButton
                            )}
                        >
                            Skip
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={goNext}
                        className={cn("edu-study-session__next", classNames?.nextButton)}
                    >
                        {isLastBlock ? "Finish" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
}
