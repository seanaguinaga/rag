import "./Example.css";
import { useCallback, useEffect } from "react";
import { FileList } from "./components/FileList";
import { SearchInterface } from "./components/SearchInterface";
import { UploadSection } from "./components/UploadSection";
import { ErrorBoundaryUi } from "./search/error-boundary.ui";
import { useRagSearch } from "./search/search.controller";
import { useSearchFormController } from "./search/search-form.controller";
import { SearchResultsController } from "./search/search-results.controller";
import type { QueryMode } from "./search/search.types";

function ExampleContent() {
  const searchForm = useSearchFormController();
  const { buildSearchRequest } = searchForm;
  const { state: searchState, runSearch, clearSearch } = useRagSearch();

  const handleSearch = useCallback(
    (mode: QueryMode) => {
      void runSearch(mode, buildSearchRequest());
    },
    [buildSearchRequest, runSearch],
  );

  useEffect(() => {
    clearSearch();
  }, [clearSearch, searchForm.searchScope]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
      <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl">
        <UploadSection />
        <FileList
          onFileSelect={searchForm.handleFileSelect}
          onCategorySelect={searchForm.handleCategorySelect}
          onSearchTypeChange={searchForm.handleSearchTypeChange}
          selectedDocument={searchForm.selectedDocument}
          onCategoriesChange={searchForm.setCategories}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <SearchInterface
          searchQuery={searchForm.searchQuery}
          setSearchQuery={searchForm.setSearchQuery}
          onSearch={handleSearch}
          searchStatus={searchState.status}
          searchScope={searchForm.searchScope}
          setSearchScope={searchForm.setSearchScope}
          searchGlobal={searchForm.searchGlobal}
          setSearchGlobal={searchForm.setSearchGlobal}
          categorySearchGlobal={searchForm.categorySearchGlobal}
          setCategorySearchGlobal={searchForm.setCategorySearchGlobal}
          selectedCategory={searchForm.selectedCategory}
          setSelectedCategory={searchForm.setSelectedCategory}
          selectedDocument={searchForm.selectedDocument}
          limit={searchForm.limit}
          setLimit={searchForm.setLimit}
          chunksBefore={searchForm.chunksBefore}
          setChunksBefore={searchForm.setChunksBefore}
          chunksAfter={searchForm.chunksAfter}
          setChunksAfter={searchForm.setChunksAfter}
          categories={searchForm.categories}
          searchType={searchForm.searchType}
          setSearchType={searchForm.setSearchType}
        />

        <SearchResultsController
          searchState={searchState}
          searchScope={searchForm.searchScope}
          selectedDocument={searchForm.selectedDocument}
          onRetry={handleSearch}
          onClear={clearSearch}
        />
      </div>
    </div>
  );
}

function Example() {
  return (
    <ErrorBoundaryUi>
      <ExampleContent />
    </ErrorBoundaryUi>
  );
}

export default Example;
