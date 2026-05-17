import { Entry, RAG, SearchEntry, vSearchType } from "@convex-dev/rag";
import { type WorkflowId } from "@convex-dev/workflow";
import { assert } from "convex-helpers";
import { embed } from "ai";
import { components } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { ActionCtx, MutationCtx, QueryCtx } from "../_generated/server";
import { StorageReader } from "convex/server";
import { GOOGLE_EMBEDDING_DIMENSIONS } from "./config";
import { documentEmbeddingModel, queryEmbeddingModel } from "./embeddings";

export type Filters = { filename: string; category: string | null };
export type Metadata = {
  storageId: Id<"_storage">;
  uploadedBy: string;
  mimeType?: string;
  ingestionJobId?: Id<"ingestionJobs">;
  workflowId?: WorkflowId;
};
export type PublicFile = Awaited<ReturnType<typeof toFile>>;

export const ragEngine = new RAG<Filters, Metadata>(components.rag, {
  filterNames: ["filename", "category"],
  textEmbeddingModel: documentEmbeddingModel,
  embeddingDimension: GOOGLE_EMBEDDING_DIMENSIONS,
});

export async function queryForSearch(
  query: string,
  searchType: typeof vSearchType.type | undefined,
) {
  if (searchType === "text") {
    return query;
  }
  const result = await embed({
    model: queryEmbeddingModel,
    value: query,
  });
  return result.embedding;
}

export async function toFiles(
  ctx: ActionCtx,
  files: SearchEntry<Filters, Metadata>[],
) {
  return await Promise.all(files.map((entry) => toFile(ctx, entry, false)));
}

export async function toFile(
  ctx: { storage: StorageReader },
  entry: Entry<Filters, Metadata>,
  global: boolean,
) {
  assert(entry.metadata, "Entry metadata not found");
  const storageId = entry.metadata.storageId;
  return {
    entryId: entry.entryId,
    filename: entry.key!,
    storageId,
    global,
    category:
      entry.filterValues.find((f) => f.name === "category")?.value ?? undefined,
    title: entry.title,
    isImage: entry.metadata.mimeType?.startsWith("image/") ?? false,
    url: await ctx.storage.getUrl(storageId),
  };
}

export async function getUserId(_ctx: QueryCtx | MutationCtx | ActionCtx) {
  // Demo-only identity. Production code should derive this from Convex auth.
  return "test user";
}
