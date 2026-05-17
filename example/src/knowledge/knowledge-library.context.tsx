/* eslint-disable react-refresh/only-export-components */
import { createContext, use, useMemo, type ReactNode } from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { PublicFile } from "../../convex/rag/engine";

export type KnowledgeFile = PublicFile & { global: boolean };
export type PublicIngestionJob =
  (typeof api.rag.sources.listIngestionJobs)["_returnType"]["page"][number];
export type KnowledgeLibraryValue = ReturnType<typeof useKnowledgeLibraryValue>;

const KnowledgeLibraryContext = createContext<KnowledgeLibraryValue | null>(
  null,
);

export function KnowledgeLibraryProvider({
  children,
}: {
  children: ReactNode;
}) {
  const value = useKnowledgeLibraryValue();

  return (
    <KnowledgeLibraryContext.Provider value={value}>
      {children}
    </KnowledgeLibraryContext.Provider>
  );
}

export function useKnowledgeLibrary() {
  const context = use(KnowledgeLibraryContext);
  if (!context) {
    throw new Error(
      "useKnowledgeLibrary must be used within KnowledgeLibraryProvider",
    );
  }
  return context;
}

function useKnowledgeLibraryValue() {
  const globalFiles = usePaginatedQuery(
    api.rag.sources.listFiles,
    { globalNamespace: true },
    { initialNumItems: 20 },
  );
  const userFiles = usePaginatedQuery(
    api.rag.sources.listFiles,
    { globalNamespace: false },
    { initialNumItems: 20 },
  );
  const pendingFiles = useQuery(api.rag.sources.listPendingFiles);
  const ingestionJobs = usePaginatedQuery(
    api.rag.sources.listIngestionJobs,
    {},
    { initialNumItems: 20 },
  );

  const files = useMemo<KnowledgeFile[]>(() => {
    const shared = (globalFiles.results ?? []).map((file) => ({
      ...file,
      global: true,
    }));
    const personal = (userFiles.results ?? []).map((file) => ({
      ...file,
      global: false,
    }));
    return [...shared, ...personal];
  }, [globalFiles.results, userFiles.results]);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          files.flatMap((file) => (file.category ? [file.category] : [])),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [files],
  );

  const canLoadMoreFiles =
    globalFiles.status === "CanLoadMore" ||
    userFiles.status === "CanLoadMore";
  const isLoadingFiles =
    globalFiles.status === "LoadingFirstPage" ||
    userFiles.status === "LoadingFirstPage";

  const loadMoreFiles = (numItems = 20) => {
    if (globalFiles.status === "CanLoadMore") {
      globalFiles.loadMore(numItems);
    }
    if (userFiles.status === "CanLoadMore") {
      userFiles.loadMore(numItems);
    }
  };

  return {
    files,
    categories,
    pendingFiles: pendingFiles ?? [],
    ingestionJobs,
    globalFiles,
    userFiles,
    canLoadMoreFiles,
    isLoadingFiles,
    loadMoreFiles,
  };
}
