# AI Document Vault

A dark-themed web app for uploading PDFs, searching your document library, and chatting with an AI about document contents using OpenAI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/doc-vault run dev` — run the frontend (port 19025)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `DEFAULT_OBJECT_STORAGE_BUCKET_ID` — Replit object storage bucket
- Optional env: `OPENAI_API_KEY` — enables AI chat (gracefully degrades without it)
- Optional env: `INDEXER_RPC` — 0G Storage indexer RPC URL (enables 0G uploads)
- Optional env: `BLOCKCHAIN_RPC` — 0G chain RPC URL (e.g. https://evmrpc-testnet.0g.ai)
- Optional env: `PRIVATE_KEY` — Ethereum wallet private key with balance for gas

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (tables: `documents`, `conversations`, `messages`)
- Storage: 0G Decentralized Storage (`@0gfoundation/0g-storage-ts-sdk` + `ethers`) with Replit App Storage fallback
- AI: Groq SDK (`llama-3.3-70b-versatile`) with SSE streaming
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Drizzle schema: `documents.ts`, `conversations.ts`, `messages.ts`
- `artifacts/api-server/src/routes/` — Express route handlers (documents, chat, storage)
- `artifacts/doc-vault/src/pages/` — React pages (dashboard, documents, document-detail, chat-list, chat-view)

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → React Query hooks + Zod schemas used in both client and server.
- Upload flow: POST /api/documents/upload (multer memoryStorage) → tries 0G Storage first (if INDEXER_RPC+BLOCKCHAIN_RPC+PRIVATE_KEY are set), falls back to Replit App Storage → pdf-parse(buffer) → DB insert with rootHash/txHash/storageProvider.
- 0G Storage upload: `MemData(buffer)` → `Indexer.upload(file, blockchainRpc, signer)` → returns `{ rootHash, txHash }`. SDK: `@0gfoundation/0g-storage-ts-sdk` (NOT `@0glabs/0g-ts-sdk`).
- PDF text extraction happens inline during upload via `pdf-parse` on the in-memory buffer.
- SSE streaming for AI chat: Express streams Groq chunks directly to the client using `text/event-stream`.
- AI chat gracefully degrades: if `GROQ_API_KEY` is missing, the server returns a `{ noApiKey: true }` signal and the UI shows a notice instead of crashing.
- Document schema tracks `rootHash`, `txHash`, `storageProvider` (`replit` | `zerog`) for provenance.

## Product

Users can upload PDFs to an encrypted vault, browse and search their document library, view per-document metadata and extracted text, and start AI chat conversations that can be optionally grounded in a specific document's content.

## User preferences

- Dark theme throughout.
- Uses React + Vite (not Next.js) + Replit PostgreSQL + Replit App Storage.
- Using direct OpenAI SDK with user-provided `OPENAI_API_KEY` secret (Replit AI integrations require paid plan).

## Gotchas

- `@workspace/api-zod` Zod schemas use operation-derived names (e.g., `CreateDocumentBody`), NOT the `$ref` schema names (`DocumentInput`). Always use the generated Zod schema names in route handlers.
- `lib/object-storage-web` is excluded from root `tsconfig.json` references (its Uppy deps are not installed) — upload flow uses plain `fetch` with presigned URLs instead.
- Run `pnpm run typecheck:libs` after any change to `lib/*` packages before checking artifact typechecks.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
