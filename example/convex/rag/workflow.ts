import { WorkflowManager } from "@convex-dev/workflow";
import { components } from "../_generated/api";

export const ragWorkflow = new WorkflowManager(components.ragWorkflow, {
  workpoolOptions: {
    maxParallelism: 2,
    retryActionsByDefault: true,
    defaultRetryBehavior: {
      maxAttempts: 5,
      initialBackoffMs: 10_000,
      base: 2,
    },
  },
});
