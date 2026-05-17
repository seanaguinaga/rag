import type { SearchType } from "@convex-dev/rag";
import { useCallback, useState } from "react";
import type { PublicFile } from "../../convex/rag/engine";
import type { SearchRequest, SearchScope } from "./search.types";

export function useSearchFormController() {
  const [searchScope, setSearchScope] = useState<SearchScope>("general");
  const [searchGlobal, setSearchGlobal] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<PublicFile | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categorySearchGlobal, setCategorySearchGlobal] = useState(true);
  const [limit, setLimit] = useState(10);
  const [chunksBefore, setChunksBefore] = useState(1);
  const [chunksAfter, setChunksAfter] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchType, setSearchType] = useState<SearchType>("vector");

  const buildSearchRequest = useCallback(
    (): SearchRequest => ({
      query: searchQuery,
      scope: searchScope,
      searchGlobal,
      categorySearchGlobal,
      selectedCategory,
      selectedDocument,
      limit,
      chunksBefore,
      chunksAfter,
      searchType,
    }),
    [
      searchQuery,
      searchScope,
      searchGlobal,
      categorySearchGlobal,
      selectedCategory,
      selectedDocument,
      limit,
      chunksBefore,
      chunksAfter,
      searchType,
    ],
  );

  const handleFileSelect = (file: PublicFile | null) => {
    setSelectedDocument(file);
    if (file) {
      setSearchScope("file");
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchScope("category");
  };

  const handleSearchTypeChange = (type: SearchScope, global: boolean) => {
    setSearchScope(type);
    setSearchGlobal(global);
    setSelectedDocument(null);
  };

  return {
    searchScope,
    setSearchScope,
    searchGlobal,
    setSearchGlobal,
    searchQuery,
    setSearchQuery,
    selectedDocument,
    selectedCategory,
    setSelectedCategory,
    categorySearchGlobal,
    setCategorySearchGlobal,
    limit,
    setLimit,
    chunksBefore,
    setChunksBefore,
    chunksAfter,
    setChunksAfter,
    categories,
    setCategories,
    searchType,
    setSearchType,
    buildSearchRequest,
    handleFileSelect,
    handleCategorySelect,
    handleSearchTypeChange,
  };
}
