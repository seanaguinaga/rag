import type { SearchType } from "@convex-dev/rag";
import { useState } from "react";
import type { PublicFile } from "../../convex/rag/engine";
import type { QueryMode } from "../search/search.controller";
import { useSearch } from "../search/search.context";
import type { SearchScope } from "../search/search-form.controller";

export function SearchInterface() {
  const { form, search, searchState, setScope, setCurrentNamespaceGlobal } =
    useSearch();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isLoading = searchState.status === "loading";

  return (
    <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 p-6 shadow-sm">
      <SearchHeader />
      <ScopeControls
        scope={form.scope}
        onScopeChange={setScope}
        selectedDocument={form.selectedDocument}
        searchGlobal={form.searchGlobal}
        categorySearchGlobal={form.categorySearchGlobal}
        onNamespaceChange={setCurrentNamespaceGlobal}
      />
      {form.scope === "category" && (
        <CategorySelect
          value={form.selectedCategory}
          onChange={form.setSelectedCategory}
          categories={form.categories}
        />
      )}
      <QueryBox
        query={form.query}
        setQuery={form.setQuery}
        onSearch={search}
        isLoading={isLoading}
      />
      <AdvancedOptions
        open={showAdvanced}
        setOpen={setShowAdvanced}
        searchType={form.searchType}
        setSearchType={form.setSearchType}
        limit={form.limit}
        setLimit={form.setLimit}
        chunksBefore={form.chunksBefore}
        setChunksBefore={form.setChunksBefore}
        chunksAfter={form.chunksAfter}
        setChunksAfter={form.setChunksAfter}
      />
    </div>
  );
}

function SearchHeader() {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      </div>
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Convex RAG Component
        </h1>
        <p className="text-gray-600 mt-1">
          Intelligent search and question answering for your documents
        </p>
      </div>
    </div>
  );
}

interface ScopeControlsProps {
  scope: SearchScope;
  onScopeChange: (scope: SearchScope) => void;
  selectedDocument: PublicFile | null;
  searchGlobal: boolean;
  categorySearchGlobal: boolean;
  onNamespaceChange: (global: boolean) => void;
}

function ScopeControls({
  scope,
  onScopeChange,
  selectedDocument,
  searchGlobal,
  categorySearchGlobal,
  onNamespaceChange,
}: ScopeControlsProps) {
  const global = scope === "general" ? searchGlobal : categorySearchGlobal;

  return (
    <div className="flex items-center space-x-4 mb-6">
      <div className="flex space-x-2">
        {(["general", "category", "file"] as const).map((value) => (
          <button
            key={value}
            onClick={() => onScopeChange(value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              scope === value
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                : "bg-white/80 text-gray-700 hover:bg-white shadow-sm hover:shadow-md"
            }`}
          >
            {scopeLabel(value)}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-4">
        {scope === "file" && selectedDocument && (
          <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="text-sm font-semibold text-blue-800">
              {selectedDocument.filename}
            </div>
          </div>
        )}
        {(scope === "general" || scope === "category") && (
          <NamespaceToggle
            global={global}
            onChange={() => onNamespaceChange(!global)}
          />
        )}
      </div>
    </div>
  );
}

function scopeLabel(scope: SearchScope) {
  if (scope === "general") return "General";
  if (scope === "category") return "Category";
  return "File-Specific";
}

function NamespaceToggle({
  global,
  onChange,
}: {
  global: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center space-x-3 bg-white/80 px-4 py-2 rounded-xl border border-gray-200">
      <span className="text-sm text-gray-600 font-medium">User Files</span>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          global
            ? "bg-gradient-to-r from-blue-500 to-indigo-500"
            : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md ${
            global ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm text-gray-600 font-medium">Shared Files</span>
    </div>
  );
}

function CategorySelect({
  value,
  onChange,
  categories,
}: {
  value: string;
  onChange: (category: string) => void;
  categories: string[];
}) {
  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Category
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-gray-900 appearance-none"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

function QueryBox({
  query,
  setQuery,
  onSearch,
  isLoading,
}: {
  query: string;
  setQuery: (query: string) => void;
  onSearch: (mode: QueryMode) => void;
  isLoading: boolean;
}) {
  const disabled = isLoading || !query.trim();

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSearch("search");
          }
        }}
        placeholder="Enter your search query or question..."
        className="w-full px-6 py-4 pr-32 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm text-gray-900 placeholder-gray-500 text-lg"
      />
      <div className="absolute right-2 top-2 bottom-2 flex space-x-2">
        <button
          onClick={() => onSearch("search")}
          disabled={disabled}
          className={`px-4 text-white rounded-lg font-semibold transition-all duration-300 ${
            disabled
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg hover:shadow-xl"
          }`}
        >
          <span>🔍</span>
        </button>
        <button
          onClick={() => onSearch("question")}
          disabled={disabled}
          className={`px-4 text-white rounded-lg font-semibold transition-all duration-300 ${
            disabled
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl"
          }`}
        >
          <span className="text-sm">Ask</span>
        </button>
      </div>
    </div>
  );
}

interface AdvancedOptionsProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  searchType: SearchType;
  setSearchType: (type: SearchType) => void;
  limit: number;
  setLimit: (limit: number) => void;
  chunksBefore: number;
  setChunksBefore: (chunks: number) => void;
  chunksAfter: number;
  setChunksAfter: (chunks: number) => void;
}

function AdvancedOptions({
  open,
  setOpen,
  searchType,
  setSearchType,
  limit,
  setLimit,
  chunksBefore,
  setChunksBefore,
  chunksAfter,
  setChunksAfter,
}: AdvancedOptionsProps) {
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
      >
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
        <span className="text-sm font-medium">Advanced Options</span>
      </button>

      {open && (
        <div className="mt-3 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 shadow-sm">
          <SearchMode value={searchType} onChange={setSearchType} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NumberOption
              label="Results Limit"
              value={limit}
              min={1}
              max={50}
              onChange={setLimit}
            />
            <NumberOption
              label="Context Before"
              value={chunksBefore}
              min={0}
              max={5}
              onChange={setChunksBefore}
            />
            <NumberOption
              label="Context After"
              value={chunksAfter}
              min={0}
              max={5}
              onChange={setChunksAfter}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SearchMode({
  value,
  onChange,
}: {
  value: SearchType;
  onChange: (type: SearchType) => void;
}) {
  return (
    <div className="flex items-center space-x-3 mb-4">
      <label className="text-sm font-semibold text-gray-700">Search Mode</label>
      <div className="flex space-x-1">
        {(["vector", "text", "hybrid"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onChange(mode)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
              value === mode
                ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {modeLabel(mode)}
          </button>
        ))}
      </div>
    </div>
  );
}

function modeLabel(mode: SearchType) {
  if (mode === "vector") return "Vector";
  if (mode === "text") return "Text";
  return "Hybrid";
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
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(event) =>
          onChange(Math.max(min, parseInt(event.target.value) || min))
        }
        min={min}
        max={max}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm"
      />
    </div>
  );
}
