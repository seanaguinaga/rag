# Evaluation

This repo has the start of a test harness, but it does not yet contain
behavioral RAG evaluations.

## Current Coverage

`convex/setup.test.ts` verifies that the Convex test environment can register
the schema and the RAG component.

That is useful as a setup smoke test, but it does not check retrieval quality,
answer quality, citation quality, or upload behavior.

## Manual Checks Available Today

The UI exposes several useful manual evaluation paths:

1. Upload a small text file and confirm it appears in the user file list.
2. Upload a large file and confirm it appears as pending, then ready.
3. Select a file and inspect its chunks.
4. Search globally across shared files.
5. Search only user files.
6. Search by category.
7. Search within one selected file.
8. Compare vector, text, and hybrid search modes.
9. Ask a question and inspect both the generated answer and retrieved sources.
10. Delete a file and confirm it disappears from the list and search results.

## Suggested Automated Evaluations

Add tests around a small, deterministic fixture set:

- one document with a known answer
- one document with related but wrong information
- one document in another category
- one document in the other namespace

Useful checks:

- retrieval returns the expected file for a known query
- category filters exclude unrelated categories
- file filters only search the selected file
- namespace selection separates user files from shared files
- chunk context includes the requested before and after chunks
- text search does not require embedding the query
- vector or hybrid search embeds the query
- duplicate uploads do not create duplicate entries
- generated answers include facts supported by retrieved context
- generated answers surface source files in the response payload

## Production Quality Gates

Before treating this as production RAG, add evaluation for:

- groundedness
- unsupported claim rate
- source recall
- source precision
- answer correctness
- latency
- failed extraction rate
- failed indexing rate
- stale or replaced content cleanup
- authorization boundaries

Relevant code:

- Test harness: `convex/setup.test.ts`
- Search and answer actions: `convex/rag/answering.ts`
- Indexing actions and jobs: `convex/rag/indexing.ts`
- Source lifecycle functions: `convex/rag/sources.ts`
- Upload and pending states: `src/components/UploadSection.tsx`,
  `src/components/FileList.tsx`
