# Indexing

Indexing is the process that turns uploaded source files into searchable RAG
entries and chunks.

## Main Flow

1. Store the uploaded blob in Convex storage.
2. Extract readable text from the file.
3. Add the text to the Convex RAG component.
4. Chunk the text.
5. Embed the chunks with the document embedding model.
6. Store filter values and metadata.
7. Record upload metadata when processing completes.

## Immediate Indexing

Small files use `addFile` in `convex/rag/indexing.ts`.

That action:

- checks the user
- stores the file in Convex storage
- extracts text through `getText`
- calls `rag.add`
- uses `filename` as the RAG key
- sets `filename` and `category` filters
- stores `storageId` and `uploadedBy` as metadata
- uses `contentHashFromArrayBuffer` to avoid duplicate content
- runs `recordUploadMetadata` when indexing completes

If the file already exists by content hash, the newly stored blob is deleted.

## Async Indexing

Large files use `addFileAsync` through `convex/http.ts`.

That path:

- receives the blob at `/upload`
- checks for an existing entry with the same content hash, key, and namespace
- stores the blob
- calls `rag.addAsync`
- delegates chunking to `chunkerAction`

`chunkerAction` reloads the stored file, extracts text, and returns chunks from
`defaultChunker`.

## Embeddings

Embedding configuration lives in `convex/rag/embeddings.ts` and
`convex/rag/config.ts`.

The document embedding model uses:

- model: `gemini-embedding-2-preview`
- dimensions: `1536`
- task type: `RETRIEVAL_DOCUMENT`

Queries use the same embedding model with task type `RETRIEVAL_QUERY`.

## Filters

The RAG component is configured in `convex/rag/engine.ts` with these filter
names:

- `filename`
- `category`

Those filters support general search, category search, and file-specific search.

## Pending And Replaced Content

The UI can show pending async indexing work through `listPendingFiles` and
`listChunks`.

Old replaced content is cleaned up by `deleteOldContent`, which removes RAG
entries that have been replaced for more than one week.

Relevant code:

- RAG engine setup: `convex/rag/engine.ts`
- Indexing actions and jobs: `convex/rag/indexing.ts`
- Embedding models: `convex/rag/embeddings.ts`
- Model constants: `convex/rag/config.ts`
- File extraction: `convex/getText.ts`
- HTTP upload: `convex/http.ts`
- Metadata schema: `convex/schema.ts`
- Compatibility exports: `convex/example.ts`
