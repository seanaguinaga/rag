import { useConvex } from "convex/react";
import { useCallback, useState } from "react";
import {
  runQuestionAction,
  runSearchAction,
} from "./search-actions.controller";
import {
  getErrorMessage,
  validateSearchRequest,
} from "./search-request.controller";
import type { QueryMode, SearchRequest, SearchState } from "./search.types";

export function useRagSearch() {
  const convex = useConvex();
  const [state, setState] = useState<SearchState>({ status: "idle" });

  const clearSearch = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const runSearch = useCallback(
    async (mode: QueryMode, request: SearchRequest) => {
      const validationResult = validateSearchRequest(mode, request);

      if (validationResult === "empty") {
        setState({ status: "idle" });
        return;
      }

      if (validationResult !== "valid") {
        setState(validationResult);
        return;
      }

      setState({ status: "loading", mode });

      try {
        const nextState =
          mode === "question"
            ? await runQuestionAction(convex, request)
            : await runSearchAction(convex, request);

        setState(nextState);
      } catch (error) {
        console.error("Search/Question failed:", error);
        setState({
          status: "error",
          mode,
          message: `${mode === "question" ? "Question" : "Search"} failed. ${getErrorMessage(error)}`,
        });
      }
    },
    [convex],
  );

  return {
    state,
    isLoading: state.status === "loading",
    runSearch,
    clearSearch,
  };
}
