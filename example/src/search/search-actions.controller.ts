import type { EntryFilter } from "@convex-dev/rag";
import type { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Filters } from "../../convex/rag/engine";
import type { SearchState } from "./search.controller";
import type { SearchRequest } from "./search-form.controller";
import { toUiSearchResult } from "./search-response.controller";

type ConvexClient = ReturnType<typeof useConvex>;
type SearchActionSuccess = Omit<
  Extract<SearchState, { status: "success" }>,
  "request"
>;

export async function runQuestionAction(
  convex: ConvexClient,
  request: SearchRequest,
): Promise<SearchActionSuccess> {
  const questionResults = await convex.action(api.rag.answering.askQuestion, {
    prompt: request.query,
    globalNamespace: getQuestionNamespace(request),
    filter: getQuestionFilter(request),
    limit: request.limit,
    chunkContext: {
      before: request.chunksBefore,
      after: request.chunksAfter,
    },
    searchType: request.searchType,
  });
  const searchResults = toUiSearchResult(questionResults);

  return {
    status: "success",
    mode: "question",
    searchResults,
    questionResult: {
      answer: questionResults.answer,
      results: searchResults.results,
      files: searchResults.files,
    },
  };
}

export async function runSearchAction(
  convex: ConvexClient,
  request: SearchRequest,
): Promise<SearchActionSuccess> {
  const chunkContext = {
    before: request.chunksBefore,
    after: request.chunksAfter,
  };

  if (request.scope === "general") {
    const results = await convex.action(api.rag.answering.search, {
      query: request.query,
      globalNamespace: request.searchGlobal,
      limit: request.limit,
      chunkContext,
      searchType: request.searchType,
    });

    return {
      status: "success",
      mode: "search",
      searchResults: toUiSearchResult(results),
      questionResult: null,
    };
  }

  if (request.scope === "category") {
    const results = await convex.action(api.rag.answering.searchCategory, {
      query: request.query,
      globalNamespace: request.categorySearchGlobal,
      category: request.selectedCategory,
      limit: request.limit,
      chunkContext,
      searchType: request.searchType,
    });

    return {
      status: "success",
      mode: "search",
      searchResults: toUiSearchResult(results),
      questionResult: null,
    };
  }

  if (!request.selectedDocument) {
    throw new Error("Please select a file to search.");
  }

  const results = await convex.action(api.rag.answering.searchFile, {
    query: request.query,
    globalNamespace: request.selectedDocument.global || false,
    filename: request.selectedDocument.filename || "",
    limit: request.limit,
    chunkContext,
    searchType: request.searchType,
  });

  return {
    status: "success",
    mode: "search",
    searchResults: toUiSearchResult(results),
    questionResult: null,
  };
}

function getQuestionFilter(
  request: SearchRequest,
): EntryFilter<Filters> | undefined {
  if (request.scope === "category") {
    return { name: "category", value: request.selectedCategory };
  }

  if (request.scope === "file" && request.selectedDocument) {
    return {
      name: "filename",
      value: request.selectedDocument.filename,
    };
  }

  return undefined;
}

function getQuestionNamespace(request: SearchRequest) {
  if (request.scope === "general") {
    return request.searchGlobal;
  }

  if (request.scope === "category") {
    return request.categorySearchGlobal;
  }

  return request.selectedDocument?.global || false;
}
