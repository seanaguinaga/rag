import { defineSchema, defineTable } from "convex/server";
import { vEntryId } from "@convex-dev/rag";
import { v } from "convex/values";
import { ingestionJobs } from "./rag/schema";

export default defineSchema({
  // We can use a table with extra metadata to track extra things
  fileMetadata: defineTable({
    entryId: vEntryId,
    filename: v.string(),
    storageId: v.id("_storage"),
    global: v.boolean(),
    category: v.optional(v.string()),
    uploadedBy: v.string(),
  })
    .index("global_category", ["global", "category"])
    .index("entryId", ["entryId"]),
  ingestionJobs,
  // Any tables used by the example app go here.
});
