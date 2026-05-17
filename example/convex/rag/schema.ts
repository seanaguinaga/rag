import { defineTable } from "convex/server";
import { v } from "convex/values";

const ingestionJobFields = {
  uploadedBy: v.string(),
  storageId: v.id("_storage"),
  filename: v.string(),
  global: v.boolean(),
  category: v.optional(v.string()),
  attempts: v.number(),
};

const vProcessingIngestionJob = v.object({
  status: v.literal("processing"),
  ...ingestionJobFields,
});

const vFailedIngestionJob = v.object({
  status: v.literal("failed"),
  ...ingestionJobFields,
  error: v.string(),
});

const vIngestionJob = v.union(vProcessingIngestionJob, vFailedIngestionJob);

export const ingestionJobs = defineTable(vIngestionJob).index("by_uploadedBy", [
  "uploadedBy",
]);
