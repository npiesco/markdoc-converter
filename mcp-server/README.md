# Mark My Words Down — MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that converts Markdown to Microsoft Word (`.doc`) documents. Built with the **MCP TypeScript SDK v2**.

One tool. Zero network calls. Runs entirely locally.

## Tool

### `convert_markdown_to_word`

| Parameter   | Type   | Required | Description                                     |
|-------------|--------|----------|-------------------------------------------------|
| `markdown`  | string | ✅       | The Markdown content to convert                 |
| `filename`  | string | ❌       | Output filename without extension (default: `"document"`) |
| `outputDir` | string | ❌       | Output directory (default: OS temp directory)    |

**Returns:** File path to the generated `.doc` file + base64-encoded document content.

**Supports:** GitHub Flavored Markdown — headings, bold, italic, code blocks with language labels, tables, links, images, blockquotes, ordered/unordered lists.

**Output styling:** Word 2016+ defaults — Calibri/Calibri Light fonts, proper heading colors (#2F5496), black table borders, code blocks with language tabs.

## Quick Start

### Install & Build

The MCP SDK v2 split packages aren't on npm yet, so we reference the repo locally:

```bash
# Clone the SDK (one level up from mcp-server, already done if you cloned this repo)
git clone --depth 1 https://github.com/modelcontextprotocol/typescript-sdk.git _mcp-sdk
cd _mcp-sdk && pnpm install --ignore-scripts && cd packages/server && pnpm run build && cd ../../..

# Then install and build the MCP server
cd mcp-server
npm install
npm run build
```

### Run (stdio)

```bash
# Production
node dist/index.js

# Development
npx tsx src/index.ts
```

### Claude Desktop Integration

Add this to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "mark-my-words-down": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

Or for development:

```json
{
  "mcpServers": {
    "mark-my-words-down": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/mcp-server/src/index.ts"]
    }
  }
}
```

### Example Usage (from an LLM)

> "Convert this markdown to a Word document and save it to my Desktop":

The LLM calls the tool with:
```json
{
  "markdown": "# Hello World\n\nThis is a **test** document.\n\n## Features\n\n- Item 1\n- Item 2\n\n```python\nprint('hello')\n```",
  "filename": "hello-world",
  "outputDir": "C:\\Users\\you\\Desktop"
}
```

Returns: A `.doc` file at `C:\Users\you\Desktop\hello-world.doc` ready to open in Word.

## Architecture

```
mcp-server/
├── src/
│   ├── index.ts        # MCP server + tool registration + stdio transport
│   └── converter.ts    # Markdown → Word HTML generation (pure Node.js, no DOM)
├── package.json
├── tsconfig.json
└── README.md
```

- **`index.ts`** — Creates an `McpServer`, registers the single `convert_markdown_to_word` tool, and connects via `StdioServerTransport`.
- **`converter.ts`** — Pure-function conversion: takes a markdown string, returns a complete HTML document with Office XML namespaces, conditional comments, and Word-accurate inline styles. No browser APIs.

## How the Conversion Works

1. **Parse** — `marked` (GFM mode) parses Markdown to HTML with custom renderers for links, images, code blocks (with language label tabs), bold, and italic — all using inline styles for Word compatibility.
2. **Wrap** — The HTML body is wrapped in a full document with:
   - Office XML namespaces (`urn:schemas-microsoft-com:office:office/word`)
   - Conditional comments for legacy Word versions (`<!--[if gte mso 9]>`)
   - A `<style>` block matching Word 2016+ defaults (Calibri 11pt, heading hierarchy, table borders)
3. **Write** — Prefixed with a UTF-8 BOM (`\uFEFF`) and saved as `.doc`. Word opens the HTML and renders it natively.

## PWA / Browser Runtime (Future)

The MCP SDK v2 includes `WebStandardStreamableHTTPServerTransport` which works on any Web Standards-compatible runtime (browsers, Cloudflare Workers, Deno, Bun). This means the MCP server could run entirely inside a PWA Service Worker — no internet, no Node.js, fully client-side.

The converter logic is already DOM-free. The remaining work to run in-browser would be:
1. Replace `fs.writeFileSync` with the File System Access API or in-memory Blob
2. Swap `StdioServerTransport` for `WebStandardStreamableHTTPServerTransport`
3. Bundle with Vite and register as a Service Worker

## Tech Stack

| Component | Technology |
|-----------|------------|
| Protocol  | MCP (Model Context Protocol) v2 |
| SDK       | `@modelcontextprotocol/server` 2.0.0-alpha.0 (TypeScript SDK v2) |
| Schema    | Zod v4 (`zod/v4`) |
| Markdown  | `marked` 14.x (GFM) |
| Transport | stdio (Node.js) |
| Runtime   | Node.js 20+ |

## License

MIT — same as the parent project.
