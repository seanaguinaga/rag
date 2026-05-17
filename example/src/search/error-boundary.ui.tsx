import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

interface ErrorBoundaryUiProps {
  children: ReactNode;
}

interface ErrorBoundaryUiState {
  error: Error | null;
}

export class ErrorBoundaryUi extends Component<
  ErrorBoundaryUiProps,
  ErrorBoundaryUiState
> {
  state: ErrorBoundaryUiState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryUiState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Render error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-destructive" />
                Something went wrong
              </CardTitle>
              <CardDescription>
                The interface hit a render error. Reset this view and try
                again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                onClick={() => this.setState({ error: null })}
              >
                Reset view
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
