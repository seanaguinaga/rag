import type { PublicFile } from "../../convex/rag/engine";

export type DocumentChunksStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

export interface DocumentChunk {
  order: number;
  text: string;
}

interface DocumentChunksUiProps {
  selectedDocument: PublicFile;
  chunks: DocumentChunk[];
  status: DocumentChunksStatus;
  onLoadMore: (numItems: number) => void;
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

export function DocumentChunksUi({
  selectedDocument,
  chunks,
  status,
  onLoadMore,
}: DocumentChunksUiProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-2xl border border-blue-200 p-6 h-full shadow-lg">
      <div className="flex items-center gap-x-3 mb-6">
        <div className="size-10 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
          <DocumentIcon className="size-5 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-blue-900">
          Document Chunks ({chunks.length || 0})
        </h3>
      </div>

      {selectedDocument.url && (
        <div className="mb-6">
          {selectedDocument.isImage ? (
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <img
                src={selectedDocument.url}
                alt={selectedDocument.filename}
                className="h-auto max-h-96 object-contain rounded-xl w-full"
              />
            </div>
          ) : (
            <a
              href={selectedDocument.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-x-2 bg-white hover:bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-200 transition-all duration-200 hover:shadow-md"
            >
              <svg
                className="size-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span className="text-blue-600 font-medium">
                {selectedDocument.filename}
              </span>
            </a>
          )}
        </div>
      )}

      <div
        className="overflow-y-auto space-y-4"
        style={{ height: "calc(100% - 8rem)" }}
      >
        {chunks.map((chunk) => (
          <div key={chunk.order} className="flex items-start gap-x-4 group">
            <div className="flex-shrink-0 size-8 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
              {chunk.order}
            </div>
            <div className="flex-1 bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-zinc-200/50 shadow-sm group-hover:shadow-md transition-all duration-200">
              <div className="text-sm text-zinc-900 leading-relaxed font-medium">
                {chunk.text}
              </div>
            </div>
          </div>
        ))}

        {status === "CanLoadMore" && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => onLoadMore(10)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-violet-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center gap-x-2">
                <svg
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Load More</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
