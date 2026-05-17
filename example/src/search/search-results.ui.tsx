import type { UISearchResult } from "./search.types";

interface SearchResultsUiProps {
  searchResults: UISearchResult;
  showFullText: boolean;
  onShowFullTextChange: (showFullText: boolean) => void;
}

function DocumentIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

export function SearchResultsUi({
  searchResults,
  showFullText,
  onShowFullTextChange,
}: SearchResultsUiProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 p-6 shadow-lg">
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-700 rounded-lg flex items-center justify-center mr-3">
            <DocumentIcon className="w-4 h-4 text-white" />
          </div>
          Sources
        </h4>
        {searchResults.files.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {searchResults.files.map((doc, index) => (
              <div
                key={`${doc.entryId}-${index}`}
                className="inline-flex items-center space-x-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DocumentIcon className="w-3 h-3 text-white" />
                </div>
                {doc.url ? (
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                  >
                    {doc.title || doc.url}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {doc.title || doc.filename}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-5 h-5 text-white"
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
            <h3 className="text-xl font-bold text-gray-900">
              Search Results ({searchResults.results.length})
            </h3>
          </div>
          <div className="flex items-center space-x-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-200">
            <span className="text-sm text-gray-700 font-medium">
              Individual Results
            </span>
            <button
              type="button"
              onClick={() => onShowFullTextChange(!showFullText)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                showFullText
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
                  showFullText ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-gray-700 font-medium">
              Combined Context
            </span>
          </div>
        </div>

        {showFullText && searchResults.text ? (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-6 shadow-lg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                <DocumentIcon className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-lg font-bold text-emerald-900">
                Complete Search Text
              </h4>
            </div>
            <div className="text-sm text-gray-900 whitespace-pre-line leading-relaxed bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-emerald-200/50 font-medium">
              {searchResults.text}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {searchResults.results.map((result, index) => (
              <div key={index} className="flex items-start space-x-4 group">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md">
                  {index + 1}
                </div>
                <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm group-hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                        <DocumentIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {result.entry.title || result.entry.filename}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Score:</span>
                      <div className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                        {result.score.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {result.content.map((content, contentIndex) => {
                      const isHighlighted =
                        contentIndex + result.startOrder === result.order;

                      return (
                        <div
                          key={contentIndex}
                          className={`p-4 rounded-xl border transition-all duration-200 ${
                            isHighlighted
                              ? "border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 shadow-md"
                              : "border-gray-200 bg-gray-50/80"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="w-full text-sm leading-relaxed text-gray-900 font-medium whitespace-pre-wrap">
                                {content.text}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
