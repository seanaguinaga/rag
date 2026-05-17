import { useMemo, useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { usePaginatedQuery } from "convex-helpers/react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  Filter,
  Globe2,
  Image,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Search,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { PublicFile } from "../../convex/rag/engine";
import { UploadSection } from "../components/UploadSection";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Input } from "../components/ui/input";
import { Progress } from "../components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { DocumentChunksUi } from "../search/document-chunks.ui";
import {
  type KnowledgeFile,
  type PublicIngestionJob,
  useKnowledgeLibrary,
} from "./knowledge-library.context";

type LibraryFilter = "all" | "user" | "shared" | "processing" | "failed";

type LibraryItem =
  | {
      id: string;
      kind: "file";
      file: KnowledgeFile;
      searchText: string;
      category?: string;
      global: boolean;
    }
  | {
      id: string;
      kind: "pending";
      file: KnowledgeFile;
      searchText: string;
      category?: string;
      global: boolean;
    }
  | {
      id: string;
      kind: "job";
      job: PublicIngestionJob;
      searchText: string;
      category?: string;
      global: boolean;
    };

export function KnowledgePage() {
  const library = useKnowledgeLibrary();
  const convex = useConvex();
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedEntryId, setSelectedEntryId] = useState<
    KnowledgeFile["entryId"] | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const allCategories = useMemo(
    () => {
      const values = [
        ...library.categories,
        ...library.pendingFiles.flatMap((file) =>
          file.category ? [file.category] : [],
        ),
        ...library.ingestionJobs.results.flatMap((job) =>
          job.category ? [job.category] : [],
        ),
      ];
      return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
    },
    [library.categories, library.ingestionJobs.results, library.pendingFiles],
  );

  const items = useMemo<LibraryItem[]>(() => {
    const readyItems = library.files.map((file) => ({
      id: `file-${file.entryId}`,
      kind: "file" as const,
      file,
      category: file.category,
      global: file.global,
      searchText: [file.filename, file.title, file.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));
    const pendingItems = library.pendingFiles.map((file) => ({
      id: `pending-${file.entryId}`,
      kind: "pending" as const,
      file,
      category: file.category,
      global: file.global,
      searchText: [file.filename, file.title, file.category]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));
    const jobItems = library.ingestionJobs.results.map((job) => ({
      id: `job-${job._id}`,
      kind: "job" as const,
      job,
      category: job.category,
      global: job.global,
      searchText: [job.filename, job.category, "error" in job ? job.error : ""]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));
    return [...pendingItems, ...jobItems, ...readyItems];
  }, [library.files, library.ingestionJobs.results, library.pendingFiles]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      if (filter === "user" && item.global) return false;
      if (filter === "shared" && !item.global) return false;
      if (filter === "processing") {
        if (item.kind === "file") return false;
        if (item.kind === "job" && item.job.status !== "processing") {
          return false;
        }
      }
      if (
        filter === "failed" &&
        (item.kind !== "job" || item.job.status !== "failed")
      ) {
        return false;
      }
      if (category !== "all" && item.category !== category) {
        return false;
      }
      if (normalizedQuery && !item.searchText.includes(normalizedQuery)) {
        return false;
      }
      return true;
    });
  }, [category, filter, items, query]);

  const selectedFile = useMemo(() => {
    if (!selectedEntryId) {
      return null;
    }
    return (
      [...library.files, ...library.pendingFiles].find(
        (file) => file.entryId === selectedEntryId,
      ) ?? null
    );
  }, [library.files, library.pendingFiles, selectedEntryId]);

  const handleDelete = async (file: PublicFile) => {
    try {
      setActionError(null);
      await convex.mutation(api.rag.sources.deleteFile, {
        entryId: file.entryId,
      });
      if (selectedEntryId === file.entryId) {
        setSelectedEntryId(null);
      }
    } catch (error) {
      console.error("Delete failed:", error);
      setActionError(`Failed to delete entry. ${getErrorMessage(error)}`);
    }
  };

  const handleRetryJob = async (job: PublicIngestionJob) => {
    try {
      setActionError(null);
      await convex.action(api.rag.indexing.retryIngestionJob, {
        jobId: job._id,
      });
    } catch (error) {
      console.error("Retry failed:", error);
      setActionError(`Retry failed. ${getErrorMessage(error)}`);
    }
  };

  const handleDismissJob = async (job: PublicIngestionJob) => {
    try {
      setActionError(null);
      await convex.mutation(api.rag.sources.dismissIngestionJob, {
        jobId: job._id,
      });
    } catch (error) {
      console.error("Dismiss failed:", error);
      setActionError(`Failed to dismiss error. ${getErrorMessage(error)}`);
    }
  };

  return (
    <div className="space-y-6">
      <UploadSection />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.8fr)]">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              Library
            </CardTitle>
            <CardDescription>
              {library.files.length} ready · {library.pendingFiles.length}{" "}
              processing · {library.ingestionJobs.results.length} queued
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {actionError && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertTitle>Action failed</AlertTitle>
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-3 xl:grid-cols-[minmax(14rem,1fr)_auto_auto] xl:items-end">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Find files
                </span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="pl-6"
                    placeholder="Search filenames or categories"
                  />
                </div>
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Category
                </span>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full xl:w-52">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {allCategories.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <div className="space-y-2">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <Filter className="size-3" />
                  Status
                </span>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["all", "All"],
                      ["user", "User"],
                      ["shared", "Shared"],
                      ["processing", "Processing"],
                      ["failed", "Failed"],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      type="button"
                      size="xs"
                      variant={filter === value ? "default" : "outline"}
                      onClick={() => setFilter(value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {library.isLoadingFiles && (
                <div className="flex items-center gap-2 border p-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading library
                </div>
              )}

              {filteredItems.map((item) => {
                if (item.kind === "job") {
                  return (
                    <IngestionJobRow
                      key={item.id}
                      job={item.job}
                      onRetry={handleRetryJob}
                      onDismiss={handleDismissJob}
                    />
                  );
                }
                return (
                  <KnowledgeFileRow
                    key={item.id}
                    file={item.file}
                    status={item.kind === "pending" ? "processing" : "ready"}
                    selected={selectedEntryId === item.file.entryId}
                    onSelect={() => setSelectedEntryId(item.file.entryId)}
                    onDelete={handleDelete}
                  />
                );
              })}

              {!library.isLoadingFiles && filteredItems.length === 0 && (
                <div className="border p-8 text-center">
                  <p className="font-medium">No matching knowledge items</p>
                  <p className="text-sm text-muted-foreground">
                    Adjust the search, status, or category filters.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {library.canLoadMoreFiles && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => library.loadMoreFiles()}
                >
                  <RefreshCw />
                  Load more files
                </Button>
              )}
              {library.ingestionJobs.status === "CanLoadMore" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => library.ingestionJobs.loadMore(20)}
                >
                  <RefreshCw />
                  Load more queue
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <KnowledgeDetails selectedFile={selectedFile} />
      </div>
    </div>
  );
}

function KnowledgeFileRow({
  file,
  status,
  selected,
  onSelect,
  onDelete,
}: {
  file: KnowledgeFile;
  status: "ready" | "processing";
  selected: boolean;
  onSelect: () => void;
  onDelete: (file: KnowledgeFile) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <div
      className={[
        "group flex items-start gap-3 border p-3 transition-colors",
        selected ? "border-foreground bg-muted/60" : "bg-card hover:bg-muted/40",
      ].join(" ")}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
        onClick={onSelect}
      >
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center border bg-background">
          {file.isImage ? <Image className="size-4" /> : <FileText className="size-4" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{file.title || file.filename}</p>
            {file.title && (
              <p className="truncate text-sm text-muted-foreground">
                {file.filename}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ScopeBadge global={file.global} />
            <Badge variant={status === "ready" ? "default" : "secondary"}>
              {status === "ready" ? (
                <CheckCircle2 className="size-3" />
              ) : (
                <Clock3 className="size-3" />
              )}
              {status === "ready" ? "Ready" : "Processing"}
            </Badge>
            {file.category && <Badge variant="secondary">{file.category}</Badge>}
          </div>
          {status === "processing" && <PendingProgress file={file} />}
        </div>
      </button>

      {status === "ready" && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${file.filename}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {file.url && (
                <DropdownMenuItem asChild>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink />
                    Open file
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                onSelect={(event) => {
                  event.preventDefault();
                  setDeleteOpen(true);
                }}
              >
                <Trash2 />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes {file.filename} and its indexed chunks from the
                  knowledge library.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => onDelete(file)}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function PendingProgress({ file }: { file: KnowledgeFile }) {
  const chunks = useQuery(api.rag.sources.listChunks, {
    entryId: file.entryId,
    order: "desc",
    paginationOpts: { cursor: null, numItems: 100 },
  });

  const progress = (() => {
    if (!chunks?.page?.length) return { added: 0, live: 0, percent: 0 };
    const added = chunks.page[0].order + 1;
    const firstReadyChunk = chunks.page.find(
      (chunk) => chunk.state === "ready",
    );
    const live = firstReadyChunk ? firstReadyChunk.order + 1 : 0;
    return {
      added,
      live,
      percent: added > 0 ? Math.round((live / added) * 100) : 0,
    };
  })();

  if (!chunks?.page?.length) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
        Generating text
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{progress.added} chunks added</span>
        <span>{progress.live} live</span>
      </div>
      <Progress value={progress.percent} />
    </div>
  );
}

function IngestionJobRow({
  job,
  onRetry,
  onDismiss,
}: {
  job: PublicIngestionJob;
  onRetry: (job: PublicIngestionJob) => void;
  onDismiss: (job: PublicIngestionJob) => void;
}) {
  const isProcessing = job.status === "processing";

  return (
    <div className="border p-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center border bg-background">
          {isProcessing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <XCircle className="size-4 text-destructive" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="truncate font-medium">{job.filename}</p>
            {"error" in job && job.error && (
              <p className="line-clamp-2 text-sm text-destructive">
                {job.error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ScopeBadge global={job.global} />
            <Badge variant={isProcessing ? "secondary" : "destructive"}>
              {isProcessing ? "Processing" : `Failed ${job.attempts}x`}
            </Badge>
            {job.category && <Badge variant="secondary">{job.category}</Badge>}
          </div>
        </div>
        {!isProcessing && (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button type="button" size="xs" onClick={() => onRetry(job)}>
              <RefreshCw />
              Retry
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => onDismiss(job)}
            >
              Dismiss
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function KnowledgeDetails({
  selectedFile,
}: {
  selectedFile: KnowledgeFile | null;
}) {
  const documentChunks = usePaginatedQuery(
    api.rag.sources.listChunks,
    selectedFile?.entryId
      ? {
          entryId: selectedFile.entryId,
          order: "asc",
        }
      : "skip",
    { initialNumItems: 10 },
  );

  if (!selectedFile) {
    return (
      <Card className="min-h-96">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Select a document to inspect its stored file and chunks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-56 items-center justify-center border border-dashed p-8 text-center">
            <div className="space-y-2">
              <FileText className="mx-auto size-8 text-muted-foreground" />
              <p className="font-medium">No document selected</p>
              <p className="text-sm text-muted-foreground">
                The library list controls selection for preview.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <section className="border bg-card p-5 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2">
              {selectedFile.isImage ? (
                <Image className="size-4" />
              ) : (
                <FileText className="size-4" />
              )}
              <h2 className="truncate text-lg font-semibold">
                {selectedFile.title || selectedFile.filename}
              </h2>
            </div>
            {selectedFile.title && (
              <p className="truncate text-sm text-muted-foreground">
                {selectedFile.filename}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <ScopeBadge global={selectedFile.global} />
              {selectedFile.category && (
                <Badge variant="secondary">{selectedFile.category}</Badge>
              )}
            </div>
          </div>
          {selectedFile.url && (
            <Button type="button" variant="outline" asChild>
              <a
                href={selectedFile.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink />
                Open file
              </a>
            </Button>
          )}
        </div>

        {selectedFile.url && selectedFile.isImage && (
          <div className="mt-5 border bg-background p-3">
            <img
              src={selectedFile.url}
              alt={selectedFile.filename}
              className="max-h-80 w-full object-contain"
            />
          </div>
        )}
      </section>

      <DocumentChunksUi
        selectedDocument={selectedFile}
        chunks={documentChunks.results}
        status={documentChunks.status}
        onLoadMore={documentChunks.loadMore}
      />
    </div>
  );
}

function ScopeBadge({ global }: { global: boolean }) {
  return (
    <Badge variant="secondary">
      {global ? <Globe2 className="size-3" /> : <User className="size-3" />}
      {global ? "Shared" : "User"}
    </Badge>
  );
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
