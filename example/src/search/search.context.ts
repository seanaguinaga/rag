import { createContext, use } from "react";
import type { useSearchController } from "./search-controller";

type SearchContextValue = ReturnType<typeof useSearchController>;

export const SearchContext = createContext<SearchContextValue | null>(null);

export function useSearch() {
  const context = use(SearchContext);
  if (!context) {
    throw new Error("useSearch must be used within SearchProvider");
  }
  return context;
}
