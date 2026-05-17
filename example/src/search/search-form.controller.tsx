import type { SearchType } from "@convex-dev/rag";
import { useState } from "react";
import type { PublicFile } from "../../convex/rag/engine";

export type SearchScope = "general" | "category" | "file";

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

export function useSearchSelectionController() {
  const [scope, setScope] = useState<SearchScope>("general");
  const [searchGlobal, setSearchGlobal] = useState(true);
  const [categorySearchGlobal, setCategorySearchGlobal] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<PublicFile | null>(
    null,
  );
  const handleFileSelect = (file: PublicFile | null) => {
    setSelectedDocument(file);
    if (file) setScope("file");
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setScope("category");
  };

  const handleSearchTypeChange = (nextScope: SearchScope, global: boolean) => {
    setScope(nextScope);
    setSearchGlobal(global);
    setSelectedDocument(null);
  };

  return {
    scope,
    setScope,
    searchGlobal,
    setSearchGlobal,
    categorySearchGlobal,
    setCategorySearchGlobal,
    selectedCategory,
    setSelectedCategory,
    selectedDocument,
    handleFileSelect,
    handleCategorySelect,
    handleSearchTypeChange,
  };
}

export function useSearchOptionsController() {
  const [limit, setLimit] = useState(10);
  const [chunksBefore, setChunksBefore] = useState(1);
  const [chunksAfter, setChunksAfter] = useState(1);
  const [searchType, setSearchType] = useState<SearchType>("vector");

  return {
    limit,
    setLimit,
    chunksBefore,
    setChunksBefore,
    chunksAfter,
    setChunksAfter,
    searchType,
    setSearchType,
  };
}

export function useSearchCategoriesController() {
  const [categories, setCategories] = useState<string[]>([]);

  return {
    categories,
    setCategories,
  };
}
