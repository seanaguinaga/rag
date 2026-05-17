import {
  contentHashFromArrayBuffer,
  defaultChunker,
  guessMimeTypeFromContents,
  guessMimeTypeFromExtension,
} from "@convex-dev/rag";
import { assert } from "convex-helpers";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { DataModel } from "../_generated/dataModel";
import { ActionCtx, action, internalMutation } from "../_generated/server";
import { getText } from "../getText";
import { deleteFileByEntryId } from "./sources";
import { getUserId, ragEngine } from "./rag";

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
    if (!userId) throw new Error("Unauthorized");
    const { globalNamespace, bytes, filename, category } = args;

    const mimeType = args.mimeType || guessMimeType(filename, bytes);
    const blob = new Blob([bytes], { type: mimeType });
    const storageId = await ctx.storage.store(blob);
    const text = await getText(ctx, { storageId, filename, bytes, mimeType });
    const { entryId, created } = await ragEngine.add(ctx, {
      namespace: globalNamespace ? "global" : userId,
      text,
      key: filename,
      title: filename,
      filterValues: [
        { name: "filename", value: filename },
        { name: "category", value: category ?? null },
      ],
      metadata: { storageId, uploadedBy: userId },
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
  if (!userId) throw new Error("Unauthorized");
  const { globalNamespace, blob, filename, category } = args;

  const namespace = globalNamespace ? "global" : userId;
  const bytes = await blob.arrayBuffer();
  const existing = await ragEngine.findEntryByContentHash(ctx, {
    contentHash: await contentHashFromArrayBuffer(bytes),
    key: filename,
    namespace,
  });
  if (existing) {
    console.debug("entry already exists, skipping async add");
    return { entryId: existing.entryId };
  }
  const storageId = await ctx.storage.store(
    new Blob([bytes], { type: blob.type }),
  );
  const { entryId } = await ragEngine.addAsync(ctx, {
    namespace,
    key: filename,
    title: filename,
    filterValues: [
      { name: "filename", value: filename },
      { name: "category", value: category ?? null },
    ],
    metadata: { storageId, uploadedBy: userId },
    chunkerAction: internal.rag.indexing.chunkerAction,
    onComplete: internal.rag.indexing.recordUploadMetadata,
  });
  return { url: (await ctx.storage.getUrl(storageId))!, entryId };
}

export const chunkerAction = ragEngine.defineChunkerAction(
  async (ctx, args) => {
    assert(args.entry.metadata, "Entry metadata not found");
    const storageId = args.entry.metadata.storageId;
    const metadata = await ctx.storage.getMetadata(storageId);
    assert(metadata, "Metadata not found");
    const text = await getText(ctx, {
      storageId,
      filename: args.entry.title!,
      mimeType: metadata.contentType!,
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
    const metadata = {
      entryId: entry.entryId,
      filename: entry.key!,
      storageId: entry.metadata!.storageId,
      global: namespace.namespace === "global",
      uploadedBy: entry.metadata!.uploadedBy,
      category:
        entry.filterValues.find((f) => f.name === "category")?.value ??
        undefined,
    };
    const existing = await ctx.db
      .query("fileMetadata")
      .withIndex("entryId", (q) => q.eq("entryId", entry.entryId))
      .unique();
    if (existing) {
      console.debug("replacing file", existing._id, entry);
      await ctx.db.replace("fileMetadata", existing._id, metadata);
    } else if (entry.status === "ready") {
      console.debug("inserting file", entry);
      await ctx.db.insert("fileMetadata", metadata);
    } else if (error) {
      console.debug("adding file failed", entry, error);
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

    for (const entry of toDelete.page) {
      assert(entry.status === "replaced");
      if (entry.replacedAt >= Date.now() - WEEK) {
        return;
      }
      await ragEngine.delete(ctx, { entryId: entry.entryId });
    }
    if (!toDelete.isDone) {
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
