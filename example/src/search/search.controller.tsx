import { useConvex } from "convex/react";
import { useState } from "react";
import {
  runQuestionAction,
  runSearchAction,
} from "./search-actions.controller";
import type { SearchRequest } from "./search-form.controller";
import type { UISearchResult } from "./search-response.controller";

export type QueryMode = "search" | "question";

export type SearchState =
  | { status: "idle" }
  | { status: "loading"; mode: QueryMode; request: SearchRequest }
  | {
      status: "success";
      mode: QueryMode;
      request: SearchRequest;
      searchResults: UISearchResult;
      questionResult: {
        answer: string;
        results: UISearchResult["results"];
        files: UISearchResult["files"];
      } | null;
    }
  | {
      status: "error";
      mode: QueryMode;
      request: SearchRequest;
      message: string;
    };

export function useRagSearch() {
  const convex = useConvex();
  const [state, setState] = useState<SearchState>({ status: "idle" });

  const clearSearch = () => {
    setState({ status: "idle" });
  };

  const runSearch = async (mode: QueryMode, request: SearchRequest) => {
    const validationResult = validateSearchRequest(mode, request);

    if (validationResult === "empty") {
      setState({ status: "idle" });
      return;
    }

    if (validationResult !== "valid") {
      setState(validationResult);
      return;
    }

    setState({ status: "loading", mode, request });

    try {
      const nextState =
        mode === "question"
          ? await runQuestionAction(convex, request)
          : await runSearchAction(convex, request);

      setState({ ...nextState, request });
    } catch (error) {
      console.error("Search/Question failed:", error);
      setState({
        status: "error",
        mode,
        request,
        message: `${mode === "question" ? "Question" : "Search"} failed. ${getErrorMessage(error)}`,
      });
    }
  };

  const retrySearch = () => {
    if (state.status !== "error") {
      return;
    }
    void runSearch(state.mode, state.request);
  };

  return {
    state,
    isLoading: state.status === "loading",
    runSearch,
    retrySearch,
    clearSearch,
  };
}

function validateSearchRequest(
  mode: QueryMode,
  request: SearchRequest,
): SearchState | "empty" | "valid" {
  if (!request.query.trim()) {
    return "empty";
  }

  if (request.scope === "file" && !request.selectedDocument) {
    return {
      status: "error",
      mode,
      request,
      message: "Please select a file to search.",
    };
  }

  if (request.scope === "category" && !request.selectedCategory.trim()) {
    return {
      status: "error",
      mode,
      request,
      message: "Please select a category for category search.",
    };
  }

  return "valid";
}

function getErrorMessage(error: unknown) {
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
