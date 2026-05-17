# Answering

Answering covers both retrieval-only search and generated answers grounded in
retrieved context.

## User Flow

The user enters a query in `src/components/SearchInterface.tsx` and chooses
either:

- search, which returns matching chunks
- ask, which generates an answer using retrieved context

The user can also choose:

- general search
- category search
- file-specific search
- user files or shared files
- vector, text, or hybrid search
- result limit
- chunks before and after each match

The frontend dispatches the request from `handleSearch` in `src/Example.tsx` to
`api.rag.answering.*`.

## Query Preparation

`queryForSearch` in `convex/rag/engine.ts` prepares the query for the selected
search type.

- `text` search sends the raw query string.
- `vector` and `hybrid` search embed the query with the query embedding model.

The query embedding model uses the `RETRIEVAL_QUERY` task type.

## Retrieval

Retrieval is implemented by three actions in `convex/rag/answering.ts`:

- `search` for namespace-wide search
- `searchCategory` for category-filtered search
- `searchFile` for filename-filtered search

Each action calls `rag.search` with:

- namespace
- query
- optional filters
- limit
- optional surrounding chunk context
- search type

Search results are enriched with file metadata through `toFiles`.

## Augmentation And Generation

Question answering is implemented by `askQuestion` in `convex/rag/answering.ts`.

It calls `rag.generateText` with:

- the same retrieval configuration used for search
- the user's prompt
- the answer model from `GOOGLE_ANSWER_MODEL_ID`

The default answer model is `gemini-2.5-flash`.

`rag.generateText` returns both the generated text and the retrieval context.
The app returns:

- `answer`
- search context
- source file metadata

## Display

Generated answers are rendered with `MarkdownRenderer` in `src/Example.tsx`.

Retrieved sources and chunks are shown below the answer or search results. The
UI can show either individual search results or the combined context text.

Relevant code:

- Query UI: `src/components/SearchInterface.tsx`
- Frontend dispatch: `src/Example.tsx`
- Shared RAG engine and query preparation: `convex/rag/engine.ts`
- Model constants: `convex/rag/config.ts`
- Search actions: `convex/rag/answering.ts`
- Answer action: `convex/rag/answering.ts` `askQuestion`
- Compatibility exports: `convex/example.ts`
- Markdown display: `src/MarkdownRenderer.tsx`
