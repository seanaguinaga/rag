import type { PublicFile } from "../../convex/rag/engine";
import { type QueryMode, useRagSearch } from "./search.controller";
import {
  type SearchScope,
  useSearchFormController,
} from "./search-form.controller";

export function useSearchController() {
  const form = useSearchFormController();
  const {
    state: searchState,
    runSearch,
    retrySearch,
    clearSearch,
  } = useRagSearch();
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

  const search = (mode: QueryMode, query: string) => {
    void runSearch(mode, buildSearchRequest(query));
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
    retrySearch,
    clear,
    setScope,
    selectFile,
    selectCategory,
    selectSidebarScope,
    setCurrentNamespaceGlobal,
  };
}
