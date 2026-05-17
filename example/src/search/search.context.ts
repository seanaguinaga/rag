import { createContext, use } from "react";
import type {
  SearchCategoriesValue,
  SearchExecutionValue,
  SearchOptionsValue,
  SearchRuntimeValue,
  SearchSelectionValue,
} from "./search.provider";

export const RuntimeContext = createContext<SearchRuntimeValue | null>(null);
export const SelectionContext = createContext<SearchSelectionValue | null>(
  null,
);
export const OptionsContext = createContext<SearchOptionsValue | null>(null);
export const CategoriesContext = createContext<SearchCategoriesValue | null>(
  null,
);
export const ExecutionContext = createContext<SearchExecutionValue | null>(
  null,
);

function useRequiredContext<T>(context: T | null, hookName: string) {
  if (!context) {
    throw new Error(`${hookName} must be used within SearchProvider`);
  }
  return context;
}

export function useSearchRuntime() {
  return useRequiredContext(use(RuntimeContext), "useSearchRuntime");
}

export function useSearchSelection() {
  return useRequiredContext(use(SelectionContext), "useSearchSelection");
}

export function useSearchOptions() {
  return useRequiredContext(use(OptionsContext), "useSearchOptions");
}

export function useSearchCategories() {
  return useRequiredContext(use(CategoriesContext), "useSearchCategories");
}

export function useSearchExecution() {
  return useRequiredContext(use(ExecutionContext), "useSearchExecution");
}
