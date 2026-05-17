import {
  EntryId,
  contentHashFromArrayBuffer,
  defaultChunker,
  guessMimeTypeFromContents,
  guessMimeTypeFromExtension,
  vEntryId,
} from "@convex-dev/rag";
import {
  defineEvent,
  type WorkflowId,
  vWorkflowId,
} from "@convex-dev/workflow";
import { vResultValidator } from "@convex-dev/workpool";
import { assert } from "convex-helpers";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import { DataModel, Doc, Id } from "../_generated/dataModel";
import {
  ActionCtx,
  MutationCtx,
  action,
  internalAction,
  internalMutation,
  internalQuery,
} from "../_generated/server";
import { assertSupportedMimeType, getText } from "../getText";
import { deleteFileByEntryId } from "./sources";
import { getUserId, ragEngine } from "./engine";
import { ragWorkflow } from "./workflow";

const MAX_ERROR_MESSAGE_LENGTH = 500;

type FileCategory = string | null | undefined;

const ragIngestionComplete = defineEvent({
  name: "ragIngestionComplete",
  validator: v.object({ entryId: vEntryId }),
});

function formatErrorMessage(error: string) {
  const message = error.trim() || "Document ingestion failed.";
  if (message.length <= MAX_ERROR_MESSAGE_LENGTH) {
    return message;
  }
  return `${message.slice(0, MAX_ERROR_MESSAGE_LENGTH - 3)}...`;
}

function unauthorizedError() {
  return new Error("Unauthorized");
}

function ingestionJobNotFound() {
  return new ConvexError({
    code: "INGESTION_JOB_NOT_FOUND",
    message: "This ingestion job no longer exists.",
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof ConvexError) {
    if (
      error.data &&
      typeof error.data === "object" &&
      "message" in error.data &&
      typeof error.data.message === "string"
    ) {
      return error.data.message;
    }
    if (typeof error.data === "string") {
      return error.data;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export const ingestFileWorkflow = ragWorkflow
  .define({
    args: { jobId: v.id("ingestionJobs") },
    returns: vEntryId,
  })
  .handler(async (step, args): Promise<EntryId> => {
    try {
      const result = await step.runAction(
        internal.rag.indexing.enqueueIngestionJob,
        { jobId: args.jobId, workflowId: step.workflowId },
        { retry: true },
      );
      if (result.status === "ready") {
        return result.entryId;
      }

      const completed = await step.awaitEvent(ragIngestionComplete);
      await step.runMutation(internal.rag.indexing.markIngestionJobReady, {
        jobId: args.jobId,
      });
      return completed.entryId;
    } catch (error) {
      await step.runMutation(
        internal.rag.indexing.markIngestionJobFailed,
        { jobId: args.jobId, error: getErrorMessage(error) },
        { unstableArgs: true },
      );
      throw error;
    }
  });

export const addFile = action({
  args: {
    globalNamespace: v.boolean(),
    filename: v.string(),
    mimeType: v.string(),
    bytes: v.bytes(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx);
    if (!userId) throw unauthorizedError();
    const { globalNamespace, bytes, filename, category } = args;

    const mimeType = args.mimeType || guessMimeType(filename, bytes);
    assertSupportedMimeType(mimeType);
    const blob = new Blob([bytes], { type: mimeType });
    const storageId = await ctx.storage.store(blob);
    const text = await getText(ctx, { storageId, filename, bytes, mimeType });
    const namespace = namespaceForFile(globalNamespace, userId);
    const { entryId, created } = await ragEngine.add(ctx, {
      namespace,
      text,
      key: filename,
      title: filename,
      filterValues: fileFilterValues(filename, category),
      metadata: fileMetadata({ storageId, uploadedBy: userId, mimeType }),
      contentHash: await contentHashFromArrayBuffer(bytes),
      onComplete: internal.rag.indexing.recordUploadMetadata,
    });
    if (!created) {
      console.debug("entry already exists, skipping upload metadata");
      await ctx.storage.delete(storageId);
    }
    return { url: (await ctx.storage.getUrl(storageId))!, entryId };
  },
});

export async function addFileAsync(
  ctx: ActionCtx,
  args: {
    globalNamespace: boolean;
    filename: string;
    blob: Blob;
    category: string | null;
  },
) {
  const userId = await getUserId(ctx);
  if (!userId) throw unauthorizedError();
  const { globalNamespace, blob, filename, category } = args;

  const bytes = await blob.arrayBuffer();
  const mimeType = blob.type || guessMimeType(filename, bytes);
  assertSupportedMimeType(mimeType);
  const storageId = await ctx.storage.store(
    new Blob([bytes], { type: mimeType }),
  );
  const jobId: Id<"ingestionJobs"> = await ctx.runMutation(
    internal.rag.indexing.createIngestionJob,
    {
      uploadedBy: userId,
      storageId,
      filename,
      global: globalNamespace,
      category: category ?? undefined,
    },
  );
  await startIngestionWorkflow(ctx, jobId);
  return { url: (await ctx.storage.getUrl(storageId))!, jobId };
}

export const createIngestionJob = internalMutation({
  args: {
    uploadedBy: v.string(),
    storageId: v.id("_storage"),
    filename: v.string(),
    global: v.boolean(),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ingestionJobs", {
      status: "processing",
      uploadedBy: args.uploadedBy,
      storageId: args.storageId,
      filename: args.filename,
      global: args.global,
      ...(args.category === undefined ? {} : { category: args.category }),
      attempts: 0,
    });
  },
});

export const getIngestionJob = internalQuery({
  args: { jobId: v.id("ingestionJobs") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const markIngestionJobProcessing = internalMutation({
  args: { jobId: v.id("ingestionJobs") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      return;
    }
    await ctx.db.replace(args.jobId, {
      status: "processing",
      ...ingestionJobFields(job),
      attempts: job.attempts + 1,
    });
  },
});

export const markIngestionJobReady = internalMutation({
  args: {
    jobId: v.id("ingestionJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) {
      return;
    }
    await ctx.db.delete(args.jobId);
  },
});

export const markIngestionJobFailed = internalMutation({
  args: {
    jobId: v.id("ingestionJobs"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await markJobFailed(ctx, args.jobId, args.error);
  },
});

export const completeIngestionWorkflow = internalMutation({
  args: {
    workflowId: vWorkflowId,
    result: vResultValidator,
    context: v.id("ingestionJobs"),
  },
  handler: async (ctx, args) => {
    if (args.result.kind === "success") {
      return;
    }

    await markJobFailed(
      ctx,
      args.context,
      args.result.kind === "failed"
        ? args.result.error
        : "Document ingestion was canceled.",
    );
  },
});

export const enqueueIngestionJob = internalAction({
  args: { jobId: v.id("ingestionJobs"), workflowId: vWorkflowId },
  handler: async (
    ctx,
    args,
  ): Promise<{ entryId: EntryId; status: "ready" | "pending" }> => {
    const job = await ctx.runQuery(internal.rag.indexing.getIngestionJob, {
      jobId: args.jobId,
    });
    if (!job) {
      throw ingestionJobNotFound();
    }
    await ctx.runMutation(internal.rag.indexing.markIngestionJobProcessing, {
      jobId: args.jobId,
    });

    const blob = await getJobBlob(ctx, job);
    const bytes = await blob.arrayBuffer();
    const mimeType = await getJobMimeType(ctx, job, blob, bytes);
    assertSupportedMimeType(mimeType);
    const namespace = namespaceForFile(job.global, job.uploadedBy);
    const contentHash = await contentHashFromArrayBuffer(bytes);
    const existing = await findReadyEntryByContentHash(ctx, {
      namespace,
      filename: job.filename,
      contentHash,
    });
    if (existing) {
      await ctx.storage.delete(job.storageId);
      await ctx.runMutation(internal.rag.indexing.markIngestionJobReady, {
        jobId: args.jobId,
      });
      return { entryId: existing.entryId, status: "ready" };
    }

    const { entryId, status } = await enqueueFileIndexing(ctx, {
      namespace,
      filename: job.filename,
      category: job.category,
      storageId: job.storageId,
      uploadedBy: job.uploadedBy,
      mimeType,
      ingestionJobId: args.jobId,
      workflowId: args.workflowId,
      contentHash,
    });
    if (status === "ready") {
      await ctx.storage.delete(job.storageId);
      await ctx.runMutation(internal.rag.indexing.markIngestionJobReady, {
        jobId: args.jobId,
      });
    }
    return { entryId, status };
  },
});

export const retryIngestionJob = action({
  args: { jobId: v.id("ingestionJobs") },
  handler: async (ctx, args): Promise<void> => {
    const userId = await getUserId(ctx);
    if (!userId) throw unauthorizedError();

    const job = await ctx.runQuery(internal.rag.indexing.getIngestionJob, {
      jobId: args.jobId,
    });
    if (!job) {
      throw ingestionJobNotFound();
    }
    if (job.uploadedBy !== userId) {
      throw unauthorizedError();
    }
    if (job.status === "processing") {
      throw new ConvexError({
        code: "INGESTION_JOB_PROCESSING",
        message: "This file is already being processed.",
      });
    }

    await startIngestionWorkflow(ctx, args.jobId);
  },
});

async function enqueueFileIndexing(
  ctx: ActionCtx,
  {
    namespace,
    filename,
    category,
    storageId,
    uploadedBy,
    mimeType,
    ingestionJobId,
    workflowId,
    contentHash,
  }: {
    namespace: string;
    filename: string;
    category: FileCategory;
    storageId: Id<"_storage">;
    uploadedBy: string;
    mimeType: string;
    ingestionJobId?: Id<"ingestionJobs">;
    workflowId?: WorkflowId;
    contentHash: string;
  },
): Promise<{ entryId: EntryId; status: "ready" | "pending" }> {
  return await ragEngine.addAsync(ctx, {
    namespace,
    key: filename,
    title: filename,
    filterValues: fileFilterValues(filename, category),
    metadata: fileMetadata({
      storageId,
      uploadedBy,
      mimeType,
      ingestionJobId,
      workflowId,
    }),
    contentHash,
    chunkerAction: internal.rag.indexing.chunkerAction,
    onComplete: internal.rag.indexing.recordUploadMetadata,
  });
}

async function startIngestionWorkflow(
  ctx: ActionCtx,
  jobId: Id<"ingestionJobs">,
) {
  await ragWorkflow.start(
    ctx,
    internal.rag.indexing.ingestFileWorkflow,
    { jobId },
    {
      startAsync: true,
      onComplete: internal.rag.indexing.completeIngestionWorkflow,
      context: jobId,
    },
  );
}

export const chunkerAction = ragEngine.defineChunkerAction(
  async (ctx, args) => {
    assert(args.entry.metadata, "Entry metadata not found");
    const storageId = args.entry.metadata.storageId;
    const filename = args.entry.title!;
    const fallbackBlob = args.entry.metadata.mimeType
      ? null
      : await ctx.storage.get(storageId);
    const fallbackBytes = fallbackBlob
      ? await fallbackBlob.arrayBuffer()
      : undefined;
    const mimeType =
      args.entry.metadata.mimeType ||
      fallbackBlob?.type ||
      (fallbackBytes ? guessMimeType(filename, fallbackBytes) : undefined);
    assert(mimeType, "MIME type not found");
    const text = await getText(ctx, {
      storageId,
      filename,
      bytes: fallbackBytes,
      mimeType,
    });
    return { chunks: defaultChunker(text) };
  },
);

export const recordUploadMetadata = ragEngine.defineOnComplete<DataModel>(
  async (ctx, args) => {
    const { replacedEntry, entry, namespace, error } = args;
    if (replacedEntry) {
      console.debug("deleting previous entry", replacedEntry.entryId);
      await deleteFileByEntryId(ctx, replacedEntry.entryId);
    }
    const category =
      entry.filterValues.find((f) => f.name === "category")?.value ?? undefined;
    const metadata = {
      entryId: entry.entryId,
      filename: entry.key!,
      storageId: entry.metadata!.storageId,
      global: namespace.namespace === "global",
      uploadedBy: entry.metadata!.uploadedBy,
      ...(category === undefined ? {} : { category }),
    };
    const existing = await ctx.db
      .query("fileMetadata")
      .withIndex("entryId", (q) => q.eq("entryId", entry.entryId))
      .unique();
    if (existing) {
      console.debug("replacing file", existing._id, entry);
      await ctx.db.replace("fileMetadata", existing._id, metadata);
      await notifyRagIngestionReady(ctx, entry);
    } else if (entry.status === "ready") {
      console.debug("inserting file", entry);
      await ctx.db.insert("fileMetadata", metadata);
      await notifyRagIngestionReady(ctx, entry);
    } else if (error) {
      console.debug("adding file failed", entry, error);
      if (entry.metadata?.workflowId) {
        await ragWorkflow.sendEvent(ctx, {
          name: ragIngestionComplete.name,
          workflowId: entry.metadata.workflowId,
          error,
        });
      } else if (entry.metadata?.ingestionJobId) {
        await markJobFailed(ctx, entry.metadata.ingestionJobId, error);
      }
      await ragEngine.deleteAsync(ctx, { entryId: entry.entryId });
    }
  },
);

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;

export const deleteOldContent = internalMutation({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const toDelete = await ragEngine.list(ctx, {
      status: "replaced",
      paginationOpts: { cursor: args.cursor ?? null, numItems: 100 },
    });

    const expiredEntries = [];
    let reachedRecentEntry = false;
    for (const entry of toDelete.page) {
      assert(entry.status === "replaced");
      if (entry.replacedAt >= Date.now() - WEEK) {
        reachedRecentEntry = true;
        break;
      }
      expiredEntries.push(entry);
    }
    await Promise.all(
      expiredEntries.map((entry) =>
        ragEngine.deleteAsync(ctx, { entryId: entry.entryId }),
      ),
    );
    if (!reachedRecentEntry && !toDelete.isDone) {
      await ctx.scheduler.runAfter(0, internal.rag.indexing.deleteOldContent, {
        cursor: toDelete.continueCursor,
      });
    }
  },
});

function guessMimeType(filename: string, bytes: ArrayBuffer) {
  return (
    guessMimeTypeFromExtension(filename) || guessMimeTypeFromContents(bytes)
  );
}

function namespaceForFile(globalNamespace: boolean, userId: string) {
  return globalNamespace ? "global" : userId;
}

function fileFilterValues(filename: string, category: FileCategory) {
  return [
    { name: "filename" as const, value: filename },
    { name: "category" as const, value: category ?? null },
  ];
}

function fileMetadata({
  storageId,
  uploadedBy,
  mimeType,
  ingestionJobId,
  workflowId,
}: {
  storageId: Id<"_storage">;
  uploadedBy: string;
  mimeType: string;
  ingestionJobId?: Id<"ingestionJobs">;
  workflowId?: WorkflowId;
}) {
  return {
    storageId,
    uploadedBy,
    mimeType,
    ...(ingestionJobId ? { ingestionJobId } : {}),
    ...(workflowId ? { workflowId } : {}),
  };
}

async function findReadyEntryByContentHash(
  ctx: ActionCtx,
  {
    namespace,
    filename,
    contentHash,
  }: {
    namespace: string;
    filename: string;
    contentHash: string;
  },
) {
  const existing = await ragEngine.findEntryByContentHash(ctx, {
    namespace,
    key: filename,
    contentHash,
  });
  return existing?.status === "ready" ? existing : null;
}

async function getJobBlob(ctx: ActionCtx, job: Doc<"ingestionJobs">) {
  const blob = await ctx.storage.get(job.storageId);
  if (!blob) {
    throw new ConvexError({
      code: "INGESTION_STORAGE_MISSING",
      message: "The uploaded file is no longer available.",
    });
  }
  return blob;
}

async function getJobMimeType(
  ctx: ActionCtx,
  job: Doc<"ingestionJobs">,
  blob: Blob,
  bytes: ArrayBuffer,
) {
  return blob.type || guessMimeType(job.filename, bytes);
}

async function markJobReady(ctx: MutationCtx, jobId: Id<"ingestionJobs">) {
  const job = await ctx.db.get(jobId);
  if (job) {
    await ctx.db.delete(jobId);
  }
}

async function notifyRagIngestionReady(
  ctx: MutationCtx,
  entry: {
    entryId: EntryId;
    metadata?: {
      workflowId?: WorkflowId;
      ingestionJobId?: Id<"ingestionJobs">;
    };
  },
) {
  if (entry.metadata?.workflowId) {
    await ragWorkflow.sendEvent(ctx, {
      ...ragIngestionComplete,
      workflowId: entry.metadata.workflowId,
      value: { entryId: entry.entryId },
    });
  } else if (entry.metadata?.ingestionJobId) {
    await markJobReady(ctx, entry.metadata.ingestionJobId);
  }
}

async function markJobFailed(
  ctx: MutationCtx,
  jobId: Id<"ingestionJobs">,
  error: string,
) {
  const job = await ctx.db.get(jobId);
  if (job) {
    await ctx.db.replace(jobId, {
      status: "failed",
      ...ingestionJobFields(job),
      attempts: job.attempts,
      error: formatErrorMessage(error),
    });
  }
}

function ingestionJobFields(job: Doc<"ingestionJobs">) {
  return {
    uploadedBy: job.uploadedBy,
    storageId: job.storageId,
    filename: job.filename,
    global: job.global,
    ...(job.category === undefined ? {} : { category: job.category }),
  };
}
