import { createContext, type ReactNode, useContext } from "react";
import type { PublicFile } from "../../convex/rag/engine";
import { type QueryMode, useRagSearch } from "./search.controller";
import {
  type SearchScope,
  useSearchFormController,
} from "./search-form.controller";

type SearchContextValue = ReturnType<typeof useSearchController>;

const SearchContext = createContext<SearchContextValue | null>(null);

function useSearchController() {
  const form = useSearchFormController();
  const { state: searchState, runSearch, clearSearch } = useRagSearch();
  const {
    buildSearchRequest,
    handleCategorySelect,
    handleFileSelect,
    handleSearchTypeChange,
    scope,
    setCategorySearchGlobal,
    setScope: setFormScope,
    setSearchGlobal,
  } = form;

  const search = (mode: QueryMode) => {
    void runSearch(mode, buildSearchRequest());
  };

  const clear = () => {
    clearSearch();
  };

  const setScope = (scope: SearchScope) => {
    setFormScope(scope);
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

  const selectSidebarScope = (scope: SearchScope, global: boolean) => {
    handleSearchTypeChange(scope, global);
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
    form,
    searchState,
    search,
    clear,
    setScope,
    selectFile,
    selectCategory,
    selectSidebarScope,
    setCurrentNamespaceGlobal,
  };
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const search = useSearchController();

  return (
    <SearchContext.Provider value={search}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return context;
}
