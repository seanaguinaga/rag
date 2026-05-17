import { ExternalLink, FileText, Search } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import type { UISearchResult } from "./search-response.controller";

interface SearchResultsUiProps {
  searchResults: UISearchResult;
  showFullText: boolean;
  onShowFullTextChange: (showFullText: boolean) => void;
}

export function SearchResultsUi({
  searchResults,
  showFullText,
  onShowFullTextChange,
}: SearchResultsUiProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-4" />
            Sources
          </CardTitle>
          <CardDescription>
            {searchResults.files.length} source
            {searchResults.files.length === 1 ? "" : "s"} matched this query.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchResults.files.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {searchResults.files.map((doc) => (
                <SourceBadge key={doc.entryId} doc={doc} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No source files were returned.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="size-4" />
                Search results
              </CardTitle>
              <CardDescription>
                {searchResults.results.length} chunk
                {searchResults.results.length === 1 ? "" : "s"} returned.
              </CardDescription>
            </div>
            <label className="flex items-center gap-3 border bg-background px-3 py-2">
              <span className="text-sm font-medium">Combined context</span>
              <Switch
                checked={showFullText}
                onCheckedChange={onShowFullTextChange}
                aria-label="Show combined search context"
              />
            </label>
          </div>
        </CardHeader>
        <CardContent>
          {showFullText && searchResults.text ? (
            <div className="border bg-muted/30 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6">
                {searchResults.text}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.results.map((result, index) => (
                <article
                  key={`${result.entryId}-${result.order}`}
                  className="border p-4"
                >
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-8 shrink-0 items-center justify-center border bg-muted text-xs font-semibold">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {result.entry.title || result.entry.filename}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Chunk {result.order}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      Score {result.score.toFixed(3)}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {result.content.map((content, offset) => {
                      const order = result.startOrder + offset;
                      const isHighlighted = order === result.order;

                      return (
                        <div
                          key={`${result.entryId}-${order}`}
                          className={[
                            "border p-4",
                            isHighlighted ? "bg-muted" : "bg-background",
                          ].join(" ")}
                        >
                          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                            Chunk {order}
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-6">
                            {content.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}

              {searchResults.results.length === 0 && (
                <div className="border border-dashed p-8 text-center">
                  <Search className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-2 font-medium">No chunks matched</p>
                  <p className="text-sm text-muted-foreground">
                    Try a broader query or a different source filter.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SourceBadge({
  doc,
}: {
  doc: UISearchResult["files"][number];
}) {
  const label = doc.title || doc.filename || doc.url || "Untitled source";

  if (doc.url) {
    return (
      <Button type="button" variant="outline" size="sm" asChild>
        <a href={doc.url} target="_blank" rel="noopener noreferrer">
          <FileText />
          <span className="max-w-72 truncate">{label}</span>
          <ExternalLink />
        </a>
      </Button>
    );
  }

  return (
    <Badge variant="secondary">
      <FileText className="size-3" />
      {label}
    </Badge>
  );
}
