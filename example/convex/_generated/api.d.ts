/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as example from "../example.js";
import type * as getText from "../getText.js";
import type * as http from "../http.js";
import type * as rag_answering from "../rag/answering.js";
import type * as rag_config from "../rag/config.js";
import type * as rag_embeddings from "../rag/embeddings.js";
import type * as rag_engine from "../rag/engine.js";
import type * as rag_indexing from "../rag/indexing.js";
import type * as rag_sources from "../rag/sources.js";
import type * as rag_workflow from "../rag/workflow.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  example: typeof example;
  getText: typeof getText;
  http: typeof http;
  "rag/answering": typeof rag_answering;
  "rag/config": typeof rag_config;
  "rag/embeddings": typeof rag_embeddings;
  "rag/engine": typeof rag_engine;
  "rag/indexing": typeof rag_indexing;
  "rag/sources": typeof rag_sources;
  "rag/workflow": typeof rag_workflow;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rag: import("@convex-dev/rag/_generated/component.js").ComponentApi<"rag">;
  ragWorkflow: import("@convex-dev/workflow/_generated/component.js").ComponentApi<"ragWorkflow">;
};
