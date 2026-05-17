import type { useConvex } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { SearchRequest, SearchState } from "./search.types";
import {
  getQuestionFilter,
  getQuestionNamespace,
} from "./search-request.controller";
import { toUiSearchResult } from "./search-response.controller";

type ConvexClient = ReturnType<typeof useConvex>;

export async function runQuestionAction(
  convex: ConvexClient,
  request: SearchRequest,
): Promise<Extract<SearchState, { status: "success" }>> {
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
): Promise<Extract<SearchState, { status: "success" }>> {
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
