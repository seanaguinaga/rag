export const GOOGLE_EMBEDDING_MODEL_ID = "gemini-embedding-2-preview";
export const GOOGLE_EMBEDDING_DIMENSIONS = 1536;
export const GOOGLE_DOCUMENT_EMBEDDING_TASK_TYPE = "RETRIEVAL_DOCUMENT";
export const GOOGLE_QUERY_EMBEDDING_TASK_TYPE = "RETRIEVAL_QUERY";

export const GOOGLE_ANSWER_MODEL_ID =
  process.env.GOOGLE_ANSWER_MODEL_ID ?? "gemini-2.5-flash";
export const GOOGLE_EXTRACTION_MODEL_ID =
  process.env.GOOGLE_EXTRACTION_MODEL_ID ?? "gemini-2.5-flash";
