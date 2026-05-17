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

export function useSearchFormController() {
  const [scope, setScope] = useState<SearchScope>("general");
  const [searchGlobal, setSearchGlobal] = useState(true);
  const [categorySearchGlobal, setCategorySearchGlobal] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<PublicFile | null>(
    null,
  );
  const [limit, setLimit] = useState(10);
  const [chunksBefore, setChunksBefore] = useState(1);
  const [chunksAfter, setChunksAfter] = useState(1);
  const [searchType, setSearchType] = useState<SearchType>("vector");
  const [categories, setCategories] = useState<string[]>([]);

  const buildSearchRequest = (query: string): SearchRequest => ({
    query,
    scope,
    searchGlobal,
    categorySearchGlobal,
    selectedCategory,
    selectedDocument,
    limit,
    chunksBefore,
    chunksAfter,
    searchType,
  });

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
    limit,
    setLimit,
    chunksBefore,
    setChunksBefore,
    chunksAfter,
    setChunksAfter,
    searchType,
    setSearchType,
    categories,
    setCategories,
    buildSearchRequest,
    handleFileSelect,
    handleCategorySelect,
    handleSearchTypeChange,
  };
}
