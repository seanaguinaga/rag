import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
} from "react";
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

  const search = useCallback(
    (mode: QueryMode) => {
      void runSearch(mode, buildSearchRequest());
    },
    [buildSearchRequest, runSearch],
  );

  const clear = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  const setScope = useCallback(
    (scope: SearchScope) => {
      setFormScope(scope);
      clearSearch();
    },
    [clearSearch, setFormScope],
  );

  const selectFile = useCallback(
    (file: PublicFile | null) => {
      handleFileSelect(file);
      clearSearch();
    },
    [clearSearch, handleFileSelect],
  );

  const selectCategory = useCallback(
    (category: string) => {
      handleCategorySelect(category);
      clearSearch();
    },
    [clearSearch, handleCategorySelect],
  );

  const selectSidebarScope = useCallback(
    (scope: SearchScope, global: boolean) => {
      handleSearchTypeChange(scope, global);
      clearSearch();
    },
    [clearSearch, handleSearchTypeChange],
  );

  const setCurrentNamespaceGlobal = useCallback(
    (global: boolean) => {
      if (scope === "general") {
        setSearchGlobal(global);
      } else if (scope === "category") {
        setCategorySearchGlobal(global);
      }
      clearSearch();
    },
    [clearSearch, scope, setCategorySearchGlobal, setSearchGlobal],
  );

  return useMemo(
    () => ({
      form,
      searchState,
      search,
      clear,
      setScope,
      selectFile,
      selectCategory,
      selectSidebarScope,
      setCurrentNamespaceGlobal,
    }),
    [
      form,
      searchState,
      search,
      clear,
      setScope,
      selectFile,
      selectCategory,
      selectSidebarScope,
      setCurrentNamespaceGlobal,
    ],
  );
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
