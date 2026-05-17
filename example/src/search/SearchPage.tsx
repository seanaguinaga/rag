import type { SearchType } from "@convex-dev/rag";
import {
  FileText,
  Globe2,
  HelpCircle,
  Library,
  Search,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Textarea } from "../components/ui/textarea";
import {
  type KnowledgeFile,
  useKnowledgeLibrary,
} from "../knowledge/knowledge-library.context";
import { type QueryMode } from "./search.controller";
import {
  useSearchExecution,
  useSearchOptions,
  useSearchSelection,
} from "./search.context";
import type { SearchScope } from "./search-form.controller";
import { SearchResultsController } from "./search-results.controller";

export function SearchPage() {
  const [mode, setMode] = useState<QueryMode>("search");
  const [query, setQuery] = useState("");
  const { search, searchState } = useSearchExecution();
  const isLoading = searchState.status === "loading";
  const canSubmit = Boolean(query.trim()) && !isLoading;

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    search(mode, query);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-visible">
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="size-4" />
                Search knowledge
              </CardTitle>
              <CardDescription>
                Query documents, categories, or a selected file.
              </CardDescription>
            </div>
            <Tabs
              value={mode}
              onValueChange={(value) => setMode(value as QueryMode)}
            >
              <TabsList>
                <TabsTrigger value="search">
                  <Search />
                  Search
                </TabsTrigger>
                <TabsTrigger value="question">
                  <HelpCircle />
                  Ask
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <SourceFilterBar />

          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <label className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Query
              </span>
              <Textarea
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={
                  mode === "question"
                    ? "Ask a question about your selected knowledge..."
                    : "Search for matching document chunks..."
                }
                className="min-h-24"
              />
            </label>

            <div className="flex gap-2">
              <AdvancedSearchOptions />
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="min-w-32"
              >
                {mode === "question" ? <HelpCircle /> : <Search />}
                {isLoading
                  ? mode === "question"
                    ? "Asking"
                    : "Searching"
                  : mode === "question"
                    ? "Ask"
                    : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <SearchResultsController />
    </div>
  );
}

function SourceFilterBar() {
  const library = useKnowledgeLibrary();
  const selection = useSearchSelection();
  const global =
    selection.scope === "general"
      ? selection.searchGlobal
      : selection.categorySearchGlobal;

  return (
    <div className="grid gap-4 border bg-muted/30 p-4 xl:grid-cols-[auto_auto_1fr] xl:items-end">
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Source
        </span>
        <Tabs
          value={selection.scope}
          onValueChange={(value) => selection.setScope(value as SearchScope)}
        >
          <TabsList>
            <TabsTrigger value="general">
              <Library />
              All
            </TabsTrigger>
            <TabsTrigger value="category">
              <Badge variant="secondary">#</Badge>
              Category
            </TabsTrigger>
            <TabsTrigger value="file">
              <FileText />
              File
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {(selection.scope === "general" || selection.scope === "category") && (
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Namespace
          </span>
          <div className="flex h-10 items-center gap-3 border bg-background px-3">
            {global ? (
              <Globe2 className="size-4" />
            ) : (
              <User className="size-4" />
            )}
            <span className="text-sm font-medium">
              {global ? "Shared" : "User"}
            </span>
            <Switch
              checked={global}
              onCheckedChange={selection.setCurrentNamespaceGlobal}
              aria-label="Search shared knowledge"
            />
          </div>
        </div>
      )}

      {selection.scope === "category" && (
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Category
          </span>
          <Select
            value={selection.selectedCategory || "none"}
            onValueChange={(value) => {
              if (value === "none") {
                selection.setSelectedCategory("");
              } else {
                selection.selectCategory(value);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select a category</SelectItem>
              {library.categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      )}

      {selection.scope === "file" && (
        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            File
          </span>
          <Select
            value={selection.selectedDocument?.entryId ?? "none"}
            onValueChange={(value) => {
              if (value === "none") {
                selection.selectFile(null);
                return;
              }
              selection.selectFile(
                library.files.find((file) => file.entryId === value) ?? null,
              );
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a file" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select a file</SelectItem>
              {library.files.map((file) => (
                <SelectItem key={file.entryId} value={file.entryId}>
                  <FileSelectLabel file={file} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      )}
    </div>
  );
}

function FileSelectLabel({ file }: { file: KnowledgeFile }) {
  return (
    <>
      {file.global ? <Globe2 className="size-3" /> : <User className="size-3" />}
      <span className="truncate">{file.title || file.filename}</span>
    </>
  );
}

function AdvancedSearchOptions() {
  const options = useSearchOptions();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" aria-label="Search options">
          <SlidersHorizontal />
          Options
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Search options</PopoverTitle>
        </PopoverHeader>

        <label className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Mode
          </span>
          <Select
            value={options.searchType}
            onValueChange={(value) =>
              options.setSearchType(value as SearchType)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vector">Vector</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </label>

        <div className="grid grid-cols-3 gap-3">
          <NumberOption
            label="Limit"
            value={options.limit}
            min={1}
            max={50}
            onChange={options.setLimit}
          />
          <NumberOption
            label="Before"
            value={options.chunksBefore}
            min={0}
            max={5}
            onChange={options.setChunksBefore}
          />
          <NumberOption
            label="After"
            value={options.chunksAfter}
            min={0}
            max={5}
            onChange={options.setChunksAfter}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NumberOption({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => {
          const nextValue = Number.parseInt(event.target.value, 10);
          onChange(clamp(Number.isNaN(nextValue) ? min : nextValue, min, max));
        }}
      />
    </label>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
