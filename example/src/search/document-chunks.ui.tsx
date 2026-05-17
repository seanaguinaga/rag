import { ExternalLink, FileText, Image, Loader2, RefreshCw } from "lucide-react";
import type { PublicFile } from "../../convex/rag/engine";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export type DocumentChunksStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

export interface DocumentChunk {
  order: number;
  text: string;
}

interface DocumentChunksUiProps {
  selectedDocument: PublicFile;
  chunks: DocumentChunk[];
  status: DocumentChunksStatus;
  onLoadMore: (numItems: number) => void;
}

export function DocumentChunksUi({
  selectedDocument,
  chunks,
  status,
  onLoadMore,
}: DocumentChunksUiProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              Document chunks
            </CardTitle>
            <CardDescription>
              {chunks.length} loaded from {selectedDocument.filename}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {selectedDocument.global ? "Shared" : "User"}
            </Badge>
            {selectedDocument.category && (
              <Badge variant="secondary">{selectedDocument.category}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {selectedDocument.url && selectedDocument.isImage && (
          <div className="border bg-background p-3">
            <img
              src={selectedDocument.url}
              alt={selectedDocument.filename}
              className="max-h-96 w-full object-contain"
            />
          </div>
        )}

        {selectedDocument.url && !selectedDocument.isImage && (
          <Button type="button" variant="outline" asChild>
            <a
              href={selectedDocument.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />
              Open source file
            </a>
          </Button>
        )}

        {status === "LoadingFirstPage" && (
          <div className="flex items-center gap-2 border p-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading chunks
          </div>
        )}

        {status !== "LoadingFirstPage" && chunks.length === 0 && (
          <div className="border border-dashed p-8 text-center">
            {selectedDocument.isImage ? (
              <Image className="mx-auto size-8 text-muted-foreground" />
            ) : (
              <FileText className="mx-auto size-8 text-muted-foreground" />
            )}
            <p className="mt-2 font-medium">No chunks available yet</p>
            <p className="text-sm text-muted-foreground">
              Processing may still be catching up for this document.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {chunks.map((chunk) => (
            <article
              key={chunk.order}
              className="grid gap-3 border p-4 sm:grid-cols-[3rem_1fr]"
            >
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                #{chunk.order}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6">
                {chunk.text}
              </p>
            </article>
          ))}
        </div>

        {status === "CanLoadMore" && (
          <Button type="button" variant="outline" onClick={() => onLoadMore(10)}>
            <RefreshCw />
            Load more chunks
          </Button>
        )}

        {status === "LoadingMore" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading more chunks
          </div>
        )}
      </CardContent>
    </Card>
  );
}
