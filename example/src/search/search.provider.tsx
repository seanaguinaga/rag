import type { ReactNode } from "react";
import { SearchContext } from "./search.context";
import { useSearchController } from "./search-controller";

export function SearchProvider({ children }: { children: ReactNode }) {
  const search = useSearchController();

  return (
    <SearchContext.Provider value={search}>{children}</SearchContext.Provider>
  );
}
