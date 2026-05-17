import { google } from "@ai-sdk/google";
import { vSearchType } from "@convex-dev/rag";
import { v } from "convex/values";
import { GOOGLE_ANSWER_MODEL_ID } from "./config";
import { action } from "../_generated/server";
import {
  Filters,
  getUserId,
  queryForSearch,
  ragEngine,
  toFiles,
} from "./engine";

export const search = action({
  args: {
    query: v.string(),
    globalNamespace: v.boolean(),
    limit: v.optional(v.number()),
    chunkContext: v.optional(
      v.object({ before: v.number(), after: v.number() }),
    ),
    searchType: v.optional(vSearchType),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const results = await ragEngine.search(ctx, {
      namespace: args.globalNamespace ? "global" : userId,
      query: await queryForSearch(args.query, args.searchType),
      limit: args.limit ?? 10,
      chunkContext: args.chunkContext,
      searchType: args.searchType,
    });
    return { ...results, files: await toFiles(ctx, results.entries) };
  },
});

export const searchFile = action({
  args: {
    query: v.string(),
    globalNamespace: v.boolean(),
    filename: v.string(),
    limit: v.optional(v.number()),
    chunkContext: v.optional(
      v.object({ before: v.number(), after: v.number() }),
    ),
    searchType: v.optional(vSearchType),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const results = await ragEngine.search(ctx, {
      namespace: args.globalNamespace ? "global" : userId,
      query: await queryForSearch(args.query, args.searchType),
      chunkContext: args.chunkContext ?? { before: 1, after: 1 },
      filters: [{ name: "filename", value: args.filename }],
      limit: args.limit ?? 10,
      searchType: args.searchType,
    });
    return { ...results, files: await toFiles(ctx, results.entries) };
  },
});

export const searchCategory = action({
  args: {
    query: v.string(),
    globalNamespace: v.boolean(),
    category: v.string(),
    limit: v.optional(v.number()),
    chunkContext: v.optional(
      v.object({ before: v.number(), after: v.number() }),
    ),
    searchType: v.optional(vSearchType),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }
    const results = await ragEngine.search(ctx, {
      namespace: args.globalNamespace ? "global" : userId,
      query: await queryForSearch(args.query, args.searchType),
      limit: args.limit ?? 10,
      filters: [{ name: "category", value: args.category }],
      chunkContext: args.chunkContext,
      searchType: args.searchType,
    });
    return { ...results, files: await toFiles(ctx, results.entries) };
  },
});

export const askQuestion = action({
  args: {
    prompt: v.string(),
    globalNamespace: v.boolean(),
    filter: v.optional(
      v.union(
        v.object({
          name: v.literal("category"),
          value: v.union(v.null(), v.string()),
        }),
        v.object({ name: v.literal("filename"), value: v.string() }),
      ),
    ),
    limit: v.optional(v.number()),
    chunkContext: v.optional(
      v.object({ before: v.number(), after: v.number() }),
    ),
    searchType: v.optional(vSearchType),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const { text, context } = await ragEngine.generateText(ctx, {
      search: {
        namespace: args.globalNamespace ? "global" : userId,
        query: await queryForSearch(args.prompt, args.searchType),
        filters: args.filter ? [args.filter] : [],
        limit: args.limit ?? 10,
        chunkContext: args.chunkContext ?? { before: 1, after: 1 },
        searchType: args.searchType,
      },
      prompt: args.prompt,
      model: google(GOOGLE_ANSWER_MODEL_ID),
    });
    return {
      answer: text,
      ...context,
      files: await toFiles(ctx, context.entries),
    };
  },
});

export type { Filters };
