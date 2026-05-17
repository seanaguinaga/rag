import type { EntryFilter } from "@convex-dev/rag";
import type { Filters } from "../../convex/rag/engine";
import type { QueryMode, SearchRequest, SearchState } from "./search.types";

export type SearchValidationResult =
  | Extract<SearchState, { status: "error" }>
  | "empty"
  | "valid";

export function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data &&
    typeof error.data === "object" &&
    "message" in error.data &&
    typeof error.data.message === "string"
  ) {
    return error.data.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export function getQuestionFilter(
  request: SearchRequest,
): EntryFilter<Filters> | undefined {
  if (request.scope === "category") {
    return {
      name: "category",
      value: request.selectedCategory,
    };
  }

  if (request.scope === "file" && request.selectedDocument) {
    return {
      name: "filename",
      value: request.selectedDocument.filename,
    };
  }

  return undefined;
}

export function getQuestionNamespace(request: SearchRequest) {
  if (request.scope === "general") {
    return request.searchGlobal;
  }

  if (request.scope === "category") {
    return request.categorySearchGlobal;
  }

  return request.selectedDocument?.global || false;
}

export function validateSearchRequest(
  mode: QueryMode,
  request: SearchRequest,
): SearchValidationResult {
  if (!request.query.trim()) {
    return "empty";
  }

  if (request.scope === "file" && !request.selectedDocument) {
    return {
      status: "error",
      mode,
      message: "Please select a file to search.",
    };
  }

  if (request.scope === "category" && !request.selectedCategory.trim()) {
    return {
      status: "error",
      mode,
      message: "Please select a category for category search.",
    };
  }

  return "valid";
}
