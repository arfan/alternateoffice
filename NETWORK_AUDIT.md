# Network audit

This is the pre-removal inventory. It intentionally distinguishes Office
format namespaces and documentation URLs from runtime network calls.

## AI/cloud destinations to remove

| Destination/category | Current area | Data at risk | Action |
| --- | --- | --- | --- |
| Genspark proxy/auth endpoints (`genspark.ai`) | `packages/ai-provider`, `packages/ai-search`, shell cloud-project code | Prompts, document context, images, model output | Remove with the AI packages and cloud UI. |
| OpenAI-compatible provider endpoints | `packages/ai-provider` | Prompt/document context and generated media | Remove provider registry and settings. |
| Anthropic and Gemini endpoints | `packages/ai-provider` | Prompt/document context and media | Remove provider adapters. |
| Serper, Serply, Tavily, Parallel, DuckDuckGo/search MCP | `packages/ai-search` | Search queries and requested media | Remove web/image search and reranking. |
| Codex app-server integration | `packages/ai-provider/codex-app-server.ts` | Agent context and tool calls | Remove agent integration. |

The shell's former decision-model file-search client (`file-index/decider.ts`
and `file-index/rerank.ts`) has now been removed. Local file search uses the
SQLite/indexer result order directly and has no remote or model fallback.

## Non-AI or conditional network calls to review

| Destination/category | Current area | Purpose | Document-content transmission |
| --- | --- | --- | --- |
| User-supplied HTTP image URLs in HTML | HTML editor/main process | Explicitly resolving an image referenced by an opened HTML document | May fetch user-selected remote image data; retain only as an explicit local editor feature and document the behavior. |
| Font/catalog/update/release URLs | packaging, font tooling, documentation | Build-time assets or user-requested updates | Not part of normal document editing; keep outside the offline editing path. |
| `http://127.0.0.1` MCP bridge | shell MCP files | Local agent integration | Remove with MCP/agent functionality. |

## Required post-removal checks

Search runtime source (excluding tests, fixtures, schemas, and documentation)
for `fetch(`, `axios`, `WebSocket`, `EventSource`, provider SDK imports,
`GSK_`, `SERPER_`, `SERPLY_`, `TAVILY_`, `PARALLEL_`, and
`ALTERNATEOFFICE_CLOUD_SLIDE`. Every remaining result must have a local Office
purpose, an explicit user action, or a documented packaging-only purpose.

The final local editing path must not require DNS, login, an API key, or a
remote service.
