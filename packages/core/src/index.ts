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

export { createStudyGuide } from './studyguide/create-studyguide.js';
export type { StudyGuide, CreateStudyGuideOptions } from './studyguide/create-studyguide.js';

export { createPracticeProblems } from './practice-problems/create-practice-problems.js';
export type { PracticeProblem, CreatePracticeProblemsOptions } from './practice-problems/create-practice-problems.js';

export type { Difficulty } from './shared/schema.js';

export { EduSDKError, InvalidInputError } from './errors/errors.js';