import { Component, type ErrorInfo, type ReactNode } from "react";

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-red-200 rounded-2xl p-8 shadow-xl text-center">
            <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              The interface hit a render error. You can reset this view and try
              again.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200"
            >
              Reset view
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
