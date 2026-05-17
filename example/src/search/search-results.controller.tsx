import { usePaginatedQuery } from "convex-helpers/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { DocumentChunksUi } from "./document-chunks.ui";
import { QuestionAnswerUi } from "./question-answer.ui";
import { useSearch } from "./search.context";
import { SearchEmptyStateUi } from "./search-empty-state.ui";
import { SearchResultsUi } from "./search-results.ui";

export function SearchResultsController() {
  const { form, searchState, search, clear } = useSearch();
  const selectedDocument = form.selectedDocument;
  const [showFullText, setShowFullText] = useState(false);

  const documentChunks = usePaginatedQuery(
    api.rag.sources.listChunks,
    selectedDocument?.entryId
      ? {
          entryId: selectedDocument.entryId,
          order: "asc",
        }
      : "skip",
    { initialNumItems: 10 },
  );

  const searchResults =
    searchState.status === "success" ? searchState.searchResults : null;
  const questionResult =
    searchState.status === "success" ? searchState.questionResult : null;
  const showDocumentChunks =
    form.scope === "file" &&
    selectedDocument &&
    documentChunks.status !== "LoadingFirstPage" &&
    searchState.status === "idle";
  const showEmptyState =
    !searchResults && !questionResult && !showDocumentChunks;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {questionResult && <QuestionAnswerUi questionResult={questionResult} />}

      {showDocumentChunks && selectedDocument && (
        <DocumentChunksUi
          selectedDocument={selectedDocument}
          chunks={documentChunks.results}
          status={documentChunks.status}
          onLoadMore={documentChunks.loadMore}
        />
      )}

      {searchResults && (
        <SearchResultsUi
          searchResults={searchResults}
          showFullText={showFullText}
          onShowFullTextChange={setShowFullText}
        />
      )}

      {showEmptyState && (
        <SearchEmptyStateUi
          state={searchState}
          onRetry={search}
          onClear={clear}
        />
      )}
    </div>
  );
}
