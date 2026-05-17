import { type KeyboardEvent, useEffect } from "react";
import { useConvex, usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { PublicFile } from "../../convex/rag/engine";

interface FileListProps {
  onFileSelect: (file: PublicFile | null) => void;
  onCategorySelect: (category: string) => void;
  onSearchTypeChange: (type: "general", global: boolean) => void;
  onCategoriesChange: (categories: string[]) => void;
  selectedDocument: PublicFile | null;
}

type PublicIngestionJob =
  (typeof api.rag.sources.listIngestionJobs)["_returnType"]["page"][number];

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function selectOnKeyboard(
  event: KeyboardEvent<HTMLElement>,
  select: () => void,
) {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  event.preventDefault();
  select();
}

function PendingDocumentProgress({ doc }: { doc: PublicFile }) {
  const chunks = useQuery(api.rag.sources.listChunks, {
    entryId: doc.entryId,
    order: "desc",
    paginationOpts: { cursor: null, numItems: 100 },
  });

  // Calculate progress info
  const progress = (() => {
    if (!chunks?.page?.length) return { added: 0, live: 0 };

    // Total chunks added (highest order number + 1, since order is 0-based)
    const added = chunks.page[0].order + 1;

    // Find first chunk with state "ready" to get live count
    const firstReadyChunk = chunks.page.find(
      (chunk) => chunk.state === "ready",
    );
    const live = firstReadyChunk ? firstReadyChunk.order + 1 : 0;

    return { added, live };
  })();

  return (
    <div className="group relative p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-x-3">
            <div className="relative">
              <div className="size-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <svg
                  className="size-4 text-white"
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
              </div>
              <div className="absolute -top-1 -right-1 size-3 bg-orange-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-orange-900 truncate">
                {doc.filename}
              </div>
              {doc.category && (
                <div className="text-xs text-orange-700 font-medium bg-orange-100 px-2 py-1 rounded-full inline-block mt-1">
                  {doc.category}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <div className="flex items-center text-xs text-orange-600">
              <span className="mr-2">
                {doc.global ? "🌍 Shared" : "👤 User"}
              </span>
              <span className="px-2 py-1 bg-orange-100 rounded-full font-medium">
                Processing&hellip;
              </span>
            </div>
            {!chunks?.page?.length ? (
              <div className="flex items-center gap-x-2">
                <div className="animate-spin rounded-full size-3 border-b border-orange-500"></div>
                <span className="text-xs text-orange-600">
                  ⚙️ Generating text&hellip;
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-x-4 text-xs text-orange-700">
                  <span className="flex items-center">
                    <span className="size-2 bg-orange-400 rounded-full mr-1"></span>
                    📝 Added: {progress.added} chunks
                  </span>
                  <span className="flex items-center">
                    <span className="size-2 bg-emerald-400 rounded-full mr-1"></span>
                    ✅ Live: {progress.live} chunks
                  </span>
                </div>
                {progress.live > 0 && progress.added > progress.live && (
                  <div className="flex items-center gap-x-2">
                    <div className="flex-1 bg-orange-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(progress.live / progress.added) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs text-orange-700 font-medium">
                      {Math.round((progress.live / progress.added) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function IngestionJobCard({
  job,
  onRetry,
  onDismiss,
}: {
  job: PublicIngestionJob;
  onRetry: (job: PublicIngestionJob) => void;
  onDismiss: (job: PublicIngestionJob) => void;
}) {
  const isProcessing = job.status === "processing";

  return (
    <div
      className={`group relative p-4 border-2 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
        isProcessing
          ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200"
          : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-x-3">
            <div
              className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isProcessing
                  ? "bg-gradient-to-r from-orange-500 to-amber-500"
                  : "bg-gradient-to-r from-red-500 to-rose-500"
              }`}
            >
              <svg
                className="size-4 text-white"
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
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-semibold truncate ${
                  isProcessing ? "text-orange-950" : "text-red-950"
                }`}
              >
                {job.filename}
              </div>
              {job.category && (
                <div
                  className={`text-xs font-medium px-2 py-1 rounded-full inline-block mt-1 ${
                    isProcessing
                      ? "text-orange-700 bg-orange-100"
                      : "text-red-700 bg-red-100"
                  }`}
                >
                  {job.category}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {job.status === "failed" && job.error && (
              <div className="text-xs text-red-700 line-clamp-3">
                {job.error}
              </div>
            )}
            <div
              className={`flex items-center gap-2 text-xs ${
                isProcessing ? "text-orange-600" : "text-red-600"
              }`}
            >
              <span
                className={`px-2 py-1 rounded-full font-medium ${
                  isProcessing ? "bg-orange-100" : "bg-red-100"
                }`}
              >
                {job.global ? "Shared" : "User"}
              </span>
              <span
                className={`px-2 py-1 rounded-full font-medium ${
                  isProcessing ? "bg-orange-100" : "bg-red-100"
                }`}
              >
                {isProcessing ? "Processing…" : `Failed ${job.attempts}x`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onRetry(job)}
            disabled={isProcessing}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
          >
            Retry
          </button>
          <button
            onClick={() => onDismiss(job)}
            disabled={isProcessing}
            className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-white/80 hover:bg-red-100 disabled:text-red-300 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

interface FileRowProps {
  doc: PublicFile;
  globalNamespace: boolean;
  isSelected: boolean;
  onSelect: (file: PublicFile) => void;
  onCategorySelect: (category: string) => void;
  onDelete: (doc: PublicFile) => void;
}

function FileRow({
  doc,
  globalNamespace,
  isSelected,
  onSelect,
  onCategorySelect,
  onDelete,
}: FileRowProps) {
  const selectedClass = globalNamespace
    ? "bg-gradient-to-r from-blue-50 to-violet-50 border-2 border-blue-200 shadow-lg"
    : "bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-lg";
  const categoryClass = globalNamespace
    ? "text-blue-600 hover:text-blue-800 bg-blue-100 hover:bg-blue-200"
    : "text-emerald-600 hover:text-emerald-800 bg-emerald-100 hover:bg-emerald-200";
  const select = () => onSelect({ ...doc, global: globalNamespace });

  return (
    <div
      className={`group relative p-4 rounded-xl transition-all duration-300 hover:shadow-md ${
        isSelected
          ? selectedClass
          : "bg-white/60 backdrop-blur-sm border border-zinc-200/50 hover:bg-white/80"
      }`}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          role="button"
          tabIndex={0}
          onClick={select}
          onKeyDown={(event) => selectOnKeyboard(event, select)}
        >
          <div className="flex items-center gap-x-3">
            <div className="size-8 bg-gradient-to-r from-zinc-500 to-zinc-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg
                className="size-4 text-white"
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
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-900 truncate">
                {doc.filename}
              </div>
              {doc.category && (
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onCategorySelect(doc.category!);
                  }}
                  className={`inline-flex items-center text-xs px-2 py-1 rounded-full transition-colors duration-200 mt-1 ${categoryClass}`}
                >
                  <svg
                    className="size-3 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  {doc.category}
                </button>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onDelete(doc);
          }}
          className="ml-3 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="Delete entry"
        >
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function FileList({
  onFileSelect,
  onCategorySelect,
  onSearchTypeChange,
  onCategoriesChange,
  selectedDocument,
}: FileListProps) {
  const convex = useConvex();

  const globalFiles = usePaginatedQuery(
    api.rag.sources.listFiles,
    {
      globalNamespace: true,
    },
    { initialNumItems: 10 },
  );

  const userFiles = usePaginatedQuery(
    api.rag.sources.listFiles,
    {
      globalNamespace: false,
    },
    { initialNumItems: 10 },
  );

  const pendingFiles = useQuery(api.rag.sources.listPendingFiles);
  const ingestionJobs = usePaginatedQuery(
    api.rag.sources.listIngestionJobs,
    {},
    { initialNumItems: 10 },
  );

  const handleDelete = async (doc: PublicFile) => {
    try {
      await convex.mutation(api.rag.sources.deleteFile, {
        entryId: doc.entryId,
      });

      // Clear selected entry if it was the one being deleted
      if (selectedDocument?.entryId === doc.entryId) {
        onFileSelect(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      alert(
        `Failed to delete entry. ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const handleRetryJob = async (job: PublicIngestionJob) => {
    try {
      await convex.action(api.rag.indexing.retryIngestionJob, {
        jobId: job._id,
      });
    } catch (retryError) {
      console.error("Retry failed:", retryError);
      alert(`Retry failed. ${getErrorMessage(retryError)}`);
    }
  };

  const handleDismissJob = async (job: PublicIngestionJob) => {
    try {
      await convex.mutation(api.rag.sources.dismissIngestionJob, {
        jobId: job._id,
      });
    } catch (dismissError) {
      console.error("Dismiss failed:", dismissError);
      alert(`Failed to dismiss error. ${getErrorMessage(dismissError)}`);
    }
  };

  useEffect(() => {
    const categories = new Set<string>();
    globalFiles?.results?.forEach(
      (doc) => doc.category && categories.add(doc.category),
    );
    userFiles?.results?.forEach(
      (doc) => doc.category && categories.add(doc.category),
    );
    onCategoriesChange(Array.from(categories).sort());
  }, [globalFiles?.results, userFiles?.results, onCategoriesChange]);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Pending Files Status */}
      {pendingFiles && pendingFiles.length > 0 && (
        <div className="p-6 border-b border-zinc-200/50">
          <div className="space-y-3">
            <div className="flex items-center mb-4">
              <div className="animate-spin rounded-full size-5 border-b-2 border-gradient-to-r from-orange-500 to-red-500 mr-3"></div>
              <h4 className="text-sm font-semibold text-orange-800">
                Processing {pendingFiles.length} document
                {pendingFiles.length !== 1 ? "s" : ""}&hellip;
              </h4>
            </div>
            {pendingFiles.map((doc) => (
              <PendingDocumentProgress key={doc.entryId} doc={doc} />
            ))}
          </div>
        </div>
      )}

      {ingestionJobs.results.length > 0 && (
        <div className="p-6 border-b border-zinc-200/50">
          <div className="space-y-3">
            <div className="flex items-center mb-4">
              <h4 className="text-sm font-semibold text-red-800">
                Ingestion queue ({ingestionJobs.results.length})
              </h4>
            </div>
            {ingestionJobs.results.map((job) => (
              <IngestionJobCard
                key={job._id}
                job={job}
                onRetry={handleRetryJob}
                onDismiss={handleDismissJob}
              />
            ))}
            {ingestionJobs.status === "CanLoadMore" && (
              <button
                onClick={() => ingestionJobs.loadMore(10)}
                className="w-full px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
              >
                Load more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Shared Files */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-x-3">
            <div className="size-8 bg-gradient-to-r from-blue-500 to-violet-500 rounded-lg flex items-center justify-center">
              <svg
                className="size-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900">Shared Files</h3>
          </div>
          <button
            onClick={() => onSearchTypeChange("general", true)}
            className="p-2 text-blue-700 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
            title="Search all shared documents"
          >
            <svg
              className="size-5"
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
          </button>
        </div>
        <div className="space-y-3">
          {globalFiles?.results?.map((doc) => (
            <FileRow
              key={doc.entryId}
              doc={doc}
              globalNamespace={true}
              isSelected={
                selectedDocument?.entryId === doc.entryId &&
                selectedDocument?.global === true
              }
              onSelect={onFileSelect}
              onCategorySelect={onCategorySelect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* User Files */}
      <div className="p-6 border-t border-zinc-200/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-x-3">
            <div className="size-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <svg
                className="size-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-zinc-900">User Files</h3>
          </div>
          <button
            onClick={() => onSearchTypeChange("general", false)}
            className="p-2 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            title="Search all user documents"
          >
            <svg
              className="size-5"
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
          </button>
        </div>
        <div className="space-y-3">
          {userFiles?.results?.map((doc) => (
            <FileRow
              key={doc.entryId}
              doc={doc}
              globalNamespace={false}
              isSelected={
                selectedDocument?.entryId === doc.entryId &&
                selectedDocument?.global === false
              }
              onSelect={onFileSelect}
              onCategorySelect={onCategorySelect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
