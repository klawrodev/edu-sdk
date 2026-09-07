import type { StudyGuide as StudyGuideData } from "edu-sdk";
import { cn } from "../utils/index.js";

export type StudyGuideClassNames = {
    root?: string;
    title?: string;
    summary?: string;
    section?: string;
    sectionTitle?: string;
    keyConcepts?: string;
    keyConcept?: string;
    conceptName?: string;
    conceptExplanation?: string;
    reviewQuestions?: string;
    reviewQuestion?: string;
};

export type StudyGuideProps = {
    studyGuide: StudyGuideData;
    className?: string;
    classNames?: StudyGuideClassNames;
};

export function StudyGuide({ studyGuide, className, classNames }: StudyGuideProps) {
    const { summary, keyConcepts, reviewQuestions } = studyGuide.content;

    return (
        <article className={cn("edu-study-guide", className, classNames?.root)}>
            <h2 className={cn("edu-study-guide__title", classNames?.title)}>
                {studyGuide.title}
            </h2>

            <section className={cn("edu-study-guide__section", classNames?.section)}>
                <h3 className={cn("edu-study-guide__section-title", classNames?.sectionTitle)}>
                    Summary
                </h3>

                <p className={cn("edu-study-guide__summary", classNames?.summary)}>
                    {summary}
                </p>
            </section>

            <section className={cn("edu-study-guide__section", classNames?.section)}>
                <h3 className={cn("edu-study-guide__section-title", classNames?.sectionTitle)}>
                    Key Concepts
                </h3>

                <div className={cn("edu-study-guide__key-concepts", classNames?.keyConcepts)}>
                    {keyConcepts.map((item, index) => (
                        <div key={index} className={cn("edu-study-guide__key-concept", classNames?.keyConcept)}>
                            <h4 className={cn("edu-study-guide__concept-name", classNames?.conceptName)}>
                                {item.concept}
                            </h4>

                            <p className={cn("edu-study-guide__concept-explanation", classNames?.conceptExplanation)}>
                                {item.explanation}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className={cn("edu-study-guide__section", classNames?.section)}>
                <h3 className={cn("edu-study-guide__section-title", classNames?.sectionTitle)}>
                    Review Questions
                </h3>

                <ol className={cn("edu-study-guide__review-questions", classNames?.reviewQuestions)}>
                    {reviewQuestions.map((question, index) => (
                        <li key={index} className={cn("edu-study-guide__review-question", classNames?.reviewQuestion)}>
                            {question}
                        </li>
                    ))}
                </ol>
            </section>
        </article>
    );
}
