import { AlertTriangle, Loader2, RotateCcw, Search, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import type { SearchState } from "./search.controller";

interface SearchEmptyStateUiProps {
  state: SearchState;
  onRetry: () => void;
  onClear: () => void;
}

export function SearchEmptyStateUi({
  state,
  onRetry,
  onClear,
}: SearchEmptyStateUiProps) {
  if (state.status === "loading") {
    return (
      <Card>
        <CardContent className="flex min-h-72 items-center justify-center">
          <div className="space-y-3 text-center">
            <Loader2 className="mx-auto size-8 animate-spin" />
            <p className="font-medium">
              {state.mode === "question" ? "Asking" : "Searching"}
            </p>
            <p className="text-sm text-muted-foreground">
              Reading the selected knowledge context.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Search needs attention</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>{state.message}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={onRetry}>
              <RotateCcw />
              Retry
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClear}>
              <X />
              Clear
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "success") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="size-4" />
          Ready
        </CardTitle>
        <CardDescription>
          Search or ask across the selected knowledge source.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-56 items-center justify-center border border-dashed p-8 text-center">
          <div className="space-y-2">
            <Search className="mx-auto size-8 text-muted-foreground" />
            <p className="font-medium">No query has run yet</p>
            <p className="text-sm text-muted-foreground">
              Results and generated answers will appear here.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
