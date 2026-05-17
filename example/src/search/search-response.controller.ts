import type { SearchResult } from "@convex-dev/rag";
import type { PublicFile } from "../../convex/rag/engine";
import type { UISearchResult } from "./search.types";

export function attachSources(results: SearchResult[], files: PublicFile[]) {
  const sourcesByEntryId = new Map(
    files.map((file) => [file.entryId, file] as const),
  );

  return results.flatMap((result) => {
    const entry = sourcesByEntryId.get(result.entryId);
    return entry ? [{ ...result, entry }] : [];
  });
}

export function toUiSearchResult<T extends { results: SearchResult[] }>(
  results: T & { files?: PublicFile[]; text: string },
): UISearchResult {
  const sources = results.files || [];

  return {
    ...results,
    files: sources,
    results: attachSources(results.results, sources),
  };
}
