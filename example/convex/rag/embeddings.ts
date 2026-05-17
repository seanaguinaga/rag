import { google, type GoogleEmbeddingModelOptions } from "@ai-sdk/google";
import { defaultEmbeddingSettingsMiddleware, wrapEmbeddingModel } from "ai";
import {
  GOOGLE_DOCUMENT_EMBEDDING_TASK_TYPE,
  GOOGLE_EMBEDDING_DIMENSIONS,
  GOOGLE_EMBEDDING_MODEL_ID,
  GOOGLE_QUERY_EMBEDDING_TASK_TYPE,
} from "./config";

export const documentEmbeddingProviderOptions = {
  google: {
    outputDimensionality: GOOGLE_EMBEDDING_DIMENSIONS,
    taskType: GOOGLE_DOCUMENT_EMBEDDING_TASK_TYPE,
  } satisfies GoogleEmbeddingModelOptions,
};

export const queryEmbeddingProviderOptions = {
  google: {
    outputDimensionality: GOOGLE_EMBEDDING_DIMENSIONS,
    taskType: GOOGLE_QUERY_EMBEDDING_TASK_TYPE,
  } satisfies GoogleEmbeddingModelOptions,
};

export const documentEmbeddingModel = wrapEmbeddingModel({
  middleware: defaultEmbeddingSettingsMiddleware({
    settings: {
      providerOptions: documentEmbeddingProviderOptions,
    },
  }),
  model: google.embeddingModel(GOOGLE_EMBEDDING_MODEL_ID),
});

export const queryEmbeddingModel = wrapEmbeddingModel({
  middleware: defaultEmbeddingSettingsMiddleware({
    settings: {
      providerOptions: queryEmbeddingProviderOptions,
    },
  }),
  model: google.embeddingModel(GOOGLE_EMBEDDING_MODEL_ID),
});
