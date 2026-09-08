export { createFlashcards } from './flashcard/create-flashcards.js';
export type { Flashcard, CreateFlashcardsOptions } from './flashcard/create-flashcards.js';

export { createNote } from './notes/create-note.js';
export type { Note, CreateNoteOptions } from './notes/create-note.js';

export { createQuiz } from './quizzes/create-quiz.js';
export type { QuizQuestion, CreateQuizOptions } from './quizzes/create-quiz.js';

export { gradeQuiz } from './quizzes/gradeQuiz.js';
export type { GradeQuizOptions, GradeQuizResult } from './quizzes/gradeQuiz.js';

export { createQuizAttempt, completeQuizAttempt } from './assessment/attempt.js';
export type { QuizAttempt, AssessmentResult, CreateQuizAttemptOptions, CompleteQuizAttemptOptions } from './assessment/attempt.js';

export { createLearningSet } from './learning-set/create-learning-set.js';
export type { LearningSetContent, CreateLearningSetOptions } from './learning-set/create-learning-set.js';

export { createStudyGuide } from './studyguide/create-studyguide.js';
export type { StudyGuideContent, CreateStudyGuideOptions } from './studyguide/create-studyguide.js';

export { createPracticeProblems } from './practice-problems/create-practice-problems.js';
export type { PracticeProblem, CreatePracticeProblemsOptions } from './practice-problems/create-practice-problems.js';

export { createStudySession } from './study-session/create-study-session.js';
export type { StudySessionContent, StudySessionBlock, CreateStudySessionOptions } from './study-session/create-study-session.js';

export type { Difficulty } from './shared/schema.js';

export type { Artifact, ArtifactMetadata } from './shared/artifact.js';

export { extractContent } from './content/extract-content.js';
export type { FileContent, ContentInput, ExtractedContent } from './content/types.js';

export { EduSDKError, InvalidInputError, UnsupportedContentError, ContentExtractionError } from './errors/errors.js';
