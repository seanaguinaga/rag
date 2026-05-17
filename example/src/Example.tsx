import "./Example.css";
import { SearchInterface } from "./components/SearchInterface";
import { UploadSection } from "./components/UploadSection";
import { ErrorBoundaryUi } from "./search/error-boundary.ui";
import { SearchFileListController } from "./search/search-file-list.controller";
import { SearchProvider } from "./search/search.provider";
import { SearchResultsController } from "./search/search-results.controller";

function ExampleContent() {
  return (
    <SearchProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex">
        <div className="w-80 bg-white/90 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl">
          <UploadSection />
          <SearchFileListController />
        </div>

        <div className="flex-1 flex flex-col">
          <SearchInterface />
          <SearchResultsController />
        </div>
      </div>
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
