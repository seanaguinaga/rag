import type { QueryMode, SearchState } from "./search.controller";

interface SearchEmptyStateUiProps {
  state: SearchState;
  onRetry: (mode: QueryMode) => void;
  onClear: () => void;
}

export function SearchEmptyStateUi({
  state,
  onRetry,
  onClear,
}: SearchEmptyStateUiProps) {
  if (state.status === "loading") {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center gap-y-4">
          <div className="animate-spin rounded-full size-12 border-b-2 border-blue-600"></div>
          <h3 className="text-xl font-semibold text-zinc-600">Searching&hellip;</h3>
          <p className="text-zinc-500">
            Please wait while we search your documents
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="text-center py-16">
        <div className="max-w-lg mx-auto bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
          <div className="size-14 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="size-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-red-900 mb-2">
            Search needs attention
          </h3>
          <p className="text-red-700 mb-5">{state.message}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => onRetry(state.mode)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors duration-200"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-4 py-2 bg-white hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-semibold transition-colors duration-200"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === "success") {
    return null;
  }

  return (
    <div className="text-center py-16">
      <div className="size-24 bg-gradient-to-r from-zinc-200 to-zinc-300 rounded-3xl flex items-center justify-center mx-auto mb-6">
        <svg
          className="size-12 text-zinc-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-zinc-600 mb-2">
        Ready to Search or Ask
      </h3>
      <p className="text-zinc-500 max-w-md mx-auto">
        Use the search button to search your documents or the Ask button to get
        AI-generated answers using search context.
      </p>
    </div>
  );
}
