import { type ReactNode } from "react";
import type { PublicFile } from "../../convex/rag/engine";
import {
  ExecutionContext,
  OptionsContext,
  RuntimeContext,
  SelectionContext,
  useSearchOptions,
  useSearchRuntime,
  useSearchSelection,
} from "./search.context";
import { type QueryMode, useRagSearch } from "./search.controller";
import {
  type SearchScope,
  useSearchOptionsController,
  useSearchSelectionController,
} from "./search-form.controller";

export type SearchRuntimeValue = ReturnType<typeof useSearchRuntimeValue>;
export type SearchSelectionValue = ReturnType<typeof useSearchSelectionValue>;
export type SearchOptionsValue = ReturnType<typeof useSearchOptionsValue>;
export type SearchExecutionValue = ReturnType<typeof useSearchExecutionValue>;

export function SearchProvider({ children }: { children: ReactNode }) {
  return (
    <SearchRuntimeProvider>
      <SearchSelectionProvider>
        <SearchOptionsProvider>
          <SearchExecutionProvider>{children}</SearchExecutionProvider>
        </SearchOptionsProvider>
      </SearchSelectionProvider>
    </SearchRuntimeProvider>
  );
}

function SearchRuntimeProvider({ children }: { children: ReactNode }) {
  const value = useSearchRuntimeValue();

  return (
    <RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider>
  );
}

function useSearchRuntimeValue() {
  const { state, runSearch, retrySearch, clearSearch } = useRagSearch();

  return {
    searchState: state,
    runSearch,
    retrySearch,
    clearSearch,
  };
}

function SearchSelectionProvider({ children }: { children: ReactNode }) {
  const value = useSearchSelectionValue();

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

function useSearchSelectionValue() {
  const { clearSearch } = useSearchRuntime();
  const selectionState = useSearchSelectionController();
  const {
    handleCategorySelect,
    handleFileSelect,
    handleSearchTypeChange,
    scope,
    setCategorySearchGlobal,
    setScope: setFormScope,
    setSearchGlobal,
  } = selectionState;

  const setScope = (nextScope: SearchScope) => {
    setFormScope(nextScope);
    clearSearch();
  };

  const selectFile = (file: PublicFile | null) => {
    handleFileSelect(file);
    clearSearch();
  };

  const selectCategory = (category: string) => {
    handleCategorySelect(category);
    clearSearch();
  };

  const selectSidebarScope = (nextScope: SearchScope, global: boolean) => {
    handleSearchTypeChange(nextScope, global);
    clearSearch();
  };

  const setCurrentNamespaceGlobal = (global: boolean) => {
    if (scope === "general") {
      setSearchGlobal(global);
    } else if (scope === "category") {
      setCategorySearchGlobal(global);
    }
    clearSearch();
  };

  return {
    scope: selectionState.scope,
    setScope,
    searchGlobal: selectionState.searchGlobal,
    categorySearchGlobal: selectionState.categorySearchGlobal,
    selectedCategory: selectionState.selectedCategory,
    setSelectedCategory: selectionState.setSelectedCategory,
    selectedDocument: selectionState.selectedDocument,
    selectFile,
    selectCategory,
    selectSidebarScope,
    setCurrentNamespaceGlobal,
  };
}

function SearchOptionsProvider({ children }: { children: ReactNode }) {
  const value = useSearchOptionsValue();

  return (
    <OptionsContext.Provider value={value}>{children}</OptionsContext.Provider>
  );
}

function useSearchOptionsValue() {
  return useSearchOptionsController();
}

function SearchExecutionProvider({ children }: { children: ReactNode }) {
  const value = useSearchExecutionValue();

  return (
    <ExecutionContext.Provider value={value}>
      {children}
    </ExecutionContext.Provider>
  );
}

function useSearchExecutionValue() {
  const { searchState, runSearch, retrySearch, clearSearch } =
    useSearchRuntime();
  const selection = useSearchSelection();
  const options = useSearchOptions();

  const search = (mode: QueryMode, query: string) => {
    void runSearch(mode, {
      query,
      scope: selection.scope,
      searchGlobal: selection.searchGlobal,
      categorySearchGlobal: selection.categorySearchGlobal,
      selectedCategory: selection.selectedCategory,
      selectedDocument: selection.selectedDocument,
      limit: options.limit,
      chunksBefore: options.chunksBefore,
      chunksAfter: options.chunksAfter,
      searchType: options.searchType,
    });
  };

  return {
    searchState,
    search,
    retrySearch,
    clear: clearSearch,
  };
}
