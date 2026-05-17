import { EntryId, vEntryId } from "@convex-dev/rag";
import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { Doc } from "../_generated/dataModel";
import { MutationCtx, mutation, query } from "../_generated/server";
import { getUserId, ragEngine, toFile } from "./engine";

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
    const [globalNamespace, userNamespace] = await Promise.all([
      ragEngine.getNamespace(ctx, { namespace: "global" }),
      ragEngine.getNamespace(ctx, { namespace: userId }),
    ]);
    const paginationOpts = { numItems: 10, cursor: null };
    const [globalResults, userResults] = await Promise.all([
      globalNamespace
        ? ragEngine.list(ctx, {
            namespaceId: globalNamespace.namespaceId,
            status: "pending",
            paginationOpts,
          })
        : null,
      userNamespace
        ? ragEngine.list(ctx, {
            namespaceId: userNamespace.namespaceId,
            status: "pending",
            paginationOpts,
          })
        : null,
    ]);

    const globalFiles = pendingFiles(ctx, globalResults?.page ?? [], true);
    const userFiles = pendingFiles(ctx, userResults?.page ?? [], false);

    return await Promise.all([...globalFiles, ...userFiles]);
  },
});

export const listIngestionJobs = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const results = await ctx.db
      .query("ingestionJobs")
      .withIndex("by_uploadedBy", (q) => q.eq("uploadedBy", userId))
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: results.page.map(toPublicIngestionJob),
    };
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

export const dismissIngestionJob = mutation({
  args: { jobId: v.id("ingestionJobs") },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    const job = await ctx.db.get(args.jobId);
    if (!job) {
      return;
    }
    if (job.uploadedBy !== userId) {
      throw new Error("Unauthorized");
    }
    if (job.status === "processing") {
      throw new ConvexError({
        code: "INGESTION_JOB_PROCESSING",
        message: "Wait for processing to finish before dismissing this file.",
      });
    }

    await ctx.storage.delete(job.storageId);
    await ctx.db.delete(args.jobId);
  },
});

export async function deleteFileByEntryId(ctx: MutationCtx, entryId: EntryId) {
  const file = await ctx.db
    .query("fileMetadata")
    .withIndex("entryId", (q) => q.eq("entryId", entryId))
    .unique();
  if (file) {
    await Promise.all([
      ctx.db.delete("fileMetadata", file._id),
      ctx.storage.delete(file.storageId),
      ragEngine.deleteAsync(ctx, { entryId }),
    ]);
  }
}

function pendingFiles(
  ctx: Parameters<typeof toFile>[0],
  entries: Awaited<ReturnType<typeof ragEngine.list>>["page"],
  global: boolean,
) {
  return entries.reduce<ReturnType<typeof toFile>[]>((files, entry) => {
    if (!entry.metadata?.ingestionJobId) {
      files.push(toFile(ctx, entry, global));
    }
    return files;
  }, []);
}

function toPublicIngestionJob(job: Doc<"ingestionJobs">) {
  const fields = {
    _id: job._id,
    _creationTime: job._creationTime,
    filename: job.filename,
    global: job.global,
    ...(job.category === undefined ? {} : { category: job.category }),
    attempts: job.attempts,
  };

  if (job.status === "failed") {
    return { ...fields, status: job.status, error: job.error };
  }
  return { ...fields, status: job.status };
}
