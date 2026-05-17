import type { SearchResult, SearchType } from "@convex-dev/rag";
import type { PublicFile } from "../../convex/rag/engine";

export type SearchScope = "general" | "category" | "file";
export type QueryMode = "search" | "question";

export type DecoratedSearchResult = SearchResult & {
  entry: PublicFile;
};

export interface UISearchResult {
  results: DecoratedSearchResult[];
  text: string;
  files: PublicFile[];
}

export interface UIQuestionResult {
  answer: string;
  results: DecoratedSearchResult[];
  files: PublicFile[];
}

export interface SearchRequest {
  query: string;
  scope: SearchScope;
  searchGlobal: boolean;
  categorySearchGlobal: boolean;
  selectedCategory: string;
  selectedDocument: PublicFile | null;
  limit: number;
  chunksBefore: number;
  chunksAfter: number;
  searchType: SearchType;
}

export type SearchState =
  | { status: "idle" }
  | { status: "loading"; mode: QueryMode }
  | {
      status: "success";
      mode: QueryMode;
      searchResults: UISearchResult;
      questionResult: UIQuestionResult | null;
    }
  | { status: "error"; mode: QueryMode; message: string };
