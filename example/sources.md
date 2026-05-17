# Sources

This app treats uploaded files as the source material for RAG. A source can be a
user file or a shared file, and it can optionally belong to a category.

## User Flow

1. The user selects a file in `src/components/UploadSection.tsx`.
2. The user can set:
   - `category`
   - `filename`
   - whether the file is shared with the global namespace
3. Small files are sent directly to `api.example.addFile`.
4. Large files are sent to the `/upload` HTTP endpoint.

## Source Types

The backend accepts text, PDFs, images, and audio when the extraction model can
turn them into text.

Text extraction is centralized in `convex/getText.ts`:

- Images are described or transcribed.
- Audio is transcribed.
- PDFs are transformed into text.
- Text-like files are decoded directly, or normalized to markdown for non-plain
  text.

The frontend also pre-extracts PDF text in `src/components/UploadSection.tsx`
with `src/pdfUtils.ts`. When that succeeds, the app uploads the extracted text
as `text/plain`.

## Source Metadata

The app tracks source metadata in `convex/schema.ts` using the `fileMetadata`
table:

- `entryId`
- `filename`
- `storageId`
- `global`
- `category`
- `uploadedBy`

The metadata is recorded after the RAG component finishes processing an entry
through `recordUploadMetadata` in `convex/rag/indexing.ts`.

## Namespaces

Sources are separated into two search spaces:

- `global` for shared files
- the current user id for user files

The current demo uses a placeholder user id of `test user` in `getUserId`. A
production app should replace this with real authentication and authorization.

## Source Lifecycle

Sources can be listed, selected, searched, and deleted from the UI.

Relevant code:

- Upload UI: `src/components/UploadSection.tsx`
- File list UI: `src/components/FileList.tsx`
- Shared RAG engine and file shape: `convex/rag/engine.ts`
- Source lifecycle queries and mutations: `convex/rag/sources.ts`
- Upload action: `convex/rag/indexing.ts` `addFile`
- Large upload endpoint: `convex/http.ts` `/upload`
- Async upload helper: `convex/rag/indexing.ts` `addFileAsync`
- Extraction model config: `convex/rag/config.ts`
- Delete mutation: `convex/rag/sources.ts` `deleteFile`
- Compatibility exports: `convex/example.ts`
