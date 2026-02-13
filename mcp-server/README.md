<div align="center">
  <h1>Mark My Words Down — MCP Server</h1>
  <p><strong>Convert Markdown to Word through one local MCP tool</strong></p>
  
  <p><em>Runs entirely on your machine via stdio. No external API calls. No document upload.</em></p>

[![MCP](https://img.shields.io/badge/protocol-MCP%20v2-6366f1)](.)
[![Tool Count](https://img.shields.io/badge/tools-1-blue)](.)
[![Runtime](https://img.shields.io/badge/runtime-Node.js%2020%2B-green)](.)
</div>

---

## What is this MCP server?

This folder contains an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server for Mark My Words Down.

It exposes a single tool, `convert_markdown_to_word`, that converts Markdown into a Word-compatible `.doc` file with Word 2016+ styling.

## Tool

### `convert_markdown_to_word`

| Parameter   | Type   | Required | Description |
|-------------|--------|----------|-------------|
| `markdown`  | string | yes      | Markdown content to convert |
| `filename`  | string | no       | Output file name without extension (default: `document`) |
| `outputDir` | string | no       | Output directory (default: OS temp directory) |

**Returns:**
- Saved `.doc` file path
- Base64-encoded document payload

**Supports:** GitHub Flavored Markdown (headings, emphasis, lists, tables, links, images, blockquotes, fenced code blocks with language labels).

## Quick Start

### Prerequisites

- Node.js 20+
- npm
- pnpm (only needed to build local v2 SDK dependency)

### Install & Build

The MCP SDK v2 split packages are referenced locally from the SDK repo clone.

```bash
# From repository root
git clone --depth 1 https://github.com/modelcontextprotocol/typescript-sdk.git _mcp-sdk
cd _mcp-sdk
pnpm install --ignore-scripts
cd packages/server
pnpm run build

# Back to this project
cd ../../..
cd mcp-server
npm install
npm run build
```

### Run

```bash
# Production
node dist/index.js

# Development
npx tsx src/index.ts
```

## VS Code / MCP Client Setup

If you are using VS Code MCP, configure `.vscode/mcp.json` in the workspace root:

```json
{
  "servers": {
    "mark-my-words-down": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts        # MCP server + tool registration + stdio transport
│   └── converter.ts    # Markdown → Word HTML generation (Node.js, no DOM)
├── package.json
├── tsconfig.json
└── README.md
```

- `index.ts`: initializes `McpServer`, registers `convert_markdown_to_word`, writes output file, and returns file path + base64.
- `converter.ts`: parses Markdown via `marked`, applies custom renderers, and builds Office-compatible HTML for `.doc` output.

## Conversion Details

1. Parse Markdown with `marked` (GFM enabled)
2. Render links/images/code blocks with Word-safe styles
3. Wrap in Office namespaced HTML (`xmlns:o`, `xmlns:w`) with Word-specific style rules
4. Prefix with UTF-8 BOM (`\uFEFF`) and save as `.doc`

## Future: Browser/PWA MCP Runtime

The core conversion logic is already DOM-free. To run MCP fully client-side in a PWA:

1. Replace Node filesystem writes with Blob/File System Access API
2. Use `WebStandardStreamableHTTPServerTransport`
3. Host transport/runtime in service worker or browser-compatible environment

## Remote Server (Vercel)

The MCP server is also deployed on Vercel as a stateless serverless function
using the Streamable HTTP transport. No local install required.

**Endpoint:** `https://markdoc-converter.vercel.app/api/mcp`

Connect from any MCP client (Cursor, VS Code, Claude Desktop):

```json
{
  "mcpServers": {
    "mark-my-words-down": {
      "url": "https://markdoc-converter.vercel.app/api/mcp"
    }
  }
}
```

The remote server exposes the same `convert_markdown_to_word` tool but returns
the Word document purely as a base64 data URI (no filesystem writes in serverless).

The Vercel API route lives at `api/mcp.ts` in the repository root and uses the
[`mcp-handler`](https://www.npmjs.com/package/mcp-handler) package from the
official Vercel MCP deployment guide.

## Tech Stack

| Component  | Technology |
|------------|------------|
| Protocol   | MCP v2 |
| SDK (local)| `@modelcontextprotocol/server` (2.0.0-alpha.0) |
| SDK (remote)| `@modelcontextprotocol/sdk` via `mcp-handler` |
| Validation | Zod v4 |
| Markdown   | `marked` 14.x |
| Transport  | stdio (local) · Streamable HTTP (Vercel) |
| Runtime    | Node.js 20+ |

## License

MIT (same as parent project).
