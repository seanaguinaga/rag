import "./Example.css";
import { BookOpen, Search } from "lucide-react";
import { useState } from "react";
import { Button } from "./components/ui/button";
import { KnowledgeLibraryProvider } from "./knowledge/knowledge-library.context";
import { KnowledgePage } from "./knowledge/KnowledgePage";
import { ErrorBoundaryUi } from "./search/error-boundary.ui";
import { SearchPage } from "./search/SearchPage";
import { SearchProvider } from "./search/search.provider";

type AppPage = "search" | "knowledge";

function ExampleContent() {
  const [page, setPage] = useState<AppPage>("search");

  return (
    <SearchProvider>
      <KnowledgeLibraryProvider>
        <div className="min-h-screen bg-background text-foreground">
          <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Convex RAG
                </p>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Document knowledge example
                </h1>
              </div>
              <nav className="flex w-full gap-2 md:w-auto" aria-label="Primary">
                <Button
                  type="button"
                  variant={page === "search" ? "default" : "outline"}
                  className="flex-1 md:flex-none"
                  onClick={() => setPage("search")}
                >
                  <Search />
                  Search
                </Button>
                <Button
                  type="button"
                  variant={page === "knowledge" ? "default" : "outline"}
                  className="flex-1 md:flex-none"
                  onClick={() => setPage("knowledge")}
                >
                  <BookOpen />
                  Knowledge
                </Button>
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">
            {page === "search" ? <SearchPage /> : <KnowledgePage />}
          </main>
        </div>
      </KnowledgeLibraryProvider>
    </SearchProvider>
  );
}

function Example() {
  return (
    <ErrorBoundaryUi>
      <ExampleContent />
    </ErrorBoundaryUi>
  );
}

export default Example;
