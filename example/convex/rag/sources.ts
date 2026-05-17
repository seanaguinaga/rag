import { EntryId, vEntryId } from "@convex-dev/rag";
import { assert } from "convex-helpers";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { MutationCtx, mutation, query } from "../_generated/server";
import { getUserId, ragEngine, toFile } from "./rag";

export const listFiles = query({
  args: {
    globalNamespace: v.boolean(),
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const namespace = await ragEngine.getNamespace(ctx, {
      namespace: args.globalNamespace ? "global" : userId,
    });
    if (!namespace) {
      return { page: [], isDone: true, continueCursor: "" };
    }
    const results = await ragEngine.list(ctx, {
      namespaceId: namespace.namespaceId,
      paginationOpts: args.paginationOpts,
    });
    return {
      ...results,
      page: await Promise.all(
        results.page.map((entry) => toFile(ctx, entry, args.globalNamespace)),
      ),
    };
  },
});

export const listPendingFiles = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const globalNamespace = await ragEngine.getNamespace(ctx, {
      namespace: "global",
    });
    const userNamespace = await ragEngine.getNamespace(ctx, {
      namespace: userId,
    });
    const paginationOpts = { numItems: 10, cursor: null };
    const globalResults =
      globalNamespace &&
      (await ragEngine.list(ctx, {
        namespaceId: globalNamespace.namespaceId,
        status: "pending",
        paginationOpts,
      }));
    const userResults =
      userNamespace &&
      (await ragEngine.list(ctx, {
        namespaceId: userNamespace.namespaceId,
        status: "pending",
        paginationOpts,
      }));

    const globalFiles =
      globalResults?.page.map((entry) => toFile(ctx, entry, true)) ?? [];
    const userFiles =
      userResults?.page.map((entry) => toFile(ctx, entry, false)) ?? [];

    return await Promise.all([...globalFiles, ...userFiles]);
  },
});

export const listChunks = query({
  args: {
    entryId: vEntryId,
    paginationOpts: paginationOptsValidator,
    order: v.union(v.literal("desc"), v.literal("asc")),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return await ragEngine.listChunks(ctx, {
      entryId: args.entryId,
      paginationOpts: args.paginationOpts,
      order: args.order,
    });
  },
});

export const deleteFile = mutation({
  args: { entryId: vEntryId },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    await deleteFileByEntryId(ctx, args.entryId);
  },
});

export async function deleteFileByEntryId(ctx: MutationCtx, entryId: EntryId) {
  const file = await ctx.db
    .query("fileMetadata")
    .withIndex("entryId", (q) => q.eq("entryId", entryId))
    .unique();
  if (file) {
    await ctx.db.delete("fileMetadata", file._id);
    await ctx.storage.delete(file.storageId);
    await ragEngine.deleteAsync(ctx, { entryId });
  }
}
