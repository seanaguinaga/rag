import { MarkdownRenderer } from "../MarkdownRenderer";

interface QuestionAnswerUiProps {
  questionResult: {
    answer: string;
  };
}

export function QuestionAnswerUi({ questionResult }: QuestionAnswerUiProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 p-8 shadow-lg">
        <div className="flex items-center gap-x-3 mb-4">
          <div className="size-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg
              className="size-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104a2.25 2.25 0 012.25 0m-2.25 0L12 1.75m0 0l2.25 1.354m-2.25-1.354v9.75m2.25-8.396v5.714c0 .597.237 1.17.659 1.591L19 14.5"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-purple-900">
            Generated Answer
          </h3>
        </div>
        <div className="max-w-none text-zinc-900 leading-relaxed">
          <div className="markdown-content text-zinc-900">
            <MarkdownRenderer>{questionResult.answer}</MarkdownRenderer>
          </div>
        </div>
      </div>
    </div>
  );
}
