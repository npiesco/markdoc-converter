#!/usr/bin/env node

/**
 * Mark My Words Down — MCP Server
 *
 * A single-tool MCP server that converts Markdown to Microsoft Word (.doc).
 * Uses the MCP TypeScript SDK v2 with StdioServerTransport for local
 * integrations (Claude Desktop, CLI clients, etc.).
 *
 * Tool:  convert_markdown_to_word
 *   → Accepts markdown text
 *   → Generates a Word-compatible .doc file
 *   → Returns file path + base64-encoded content
 *
 * Usage:
 *   npx mark-my-words-down-mcp          # stdio (for Claude Desktop)
 *   node dist/index.js                   # after build
 *   npx tsx src/index.ts                 # dev mode
 */

import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { fileURLToPath } from 'node:url';

import { markdownToWordHtml } from './converter.js';

/**
 * Normalize a file path to use the OS-native separator.
 * Handles both Windows backslashes and POSIX forward slashes.
 */
function normalizePath(p: string): string {
  return path.resolve(p);
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = new McpServer(
  {
    name: 'mark-my-words-down',
    version: '1.0.0',
  },
  {
    capabilities: { tools: {} },
  },
);

// ── Tool: convert_markdown_to_word ───────────────────────────────────────────

server.registerTool(
  'convert_markdown_to_word',
  {
    title: 'Convert Markdown to Word',
    description:
      'Converts Markdown text into a Microsoft Word (.doc) document. ' +
      'Supports GitHub Flavored Markdown: headings, bold/italic, code blocks ' +
      'with language labels, tables, links, images, blockquotes, and lists. ' +
      'Output uses Word 2016+ default formatting (Calibri, proper heading ' +
      'colors, black table borders). Returns the saved file path and the ' +
      'document encoded as base64.',
    inputSchema: z.object({
      markdown: z
        .string()
        .describe('The Markdown content to convert to a Word document'),
      filename: z
        .string()
        .optional()
        .describe(
          'Output filename without extension. Defaults to "document".',
        ),
      outputDir: z
        .string()
        .optional()
        .describe(
          'Directory to write the .doc file into. Defaults to the OS temp directory.',
        ),
    }),
    annotations: {
      title: 'Markdown → Word Converter',
      readOnlyHint: false,
      openWorldHint: false,
    },
  },
  async ({ markdown, filename, outputDir }) => {
    try {
      const docTitle = filename ?? 'document';
      // Normalize paths for cross-platform (Windows + WSL/Unix)
      const dir = normalizePath(outputDir ?? os.tmpdir());

      // Ensure output directory exists
      fs.mkdirSync(dir, { recursive: true });

      const outPath = normalizePath(path.join(dir, `${docTitle}.doc`));

      // Generate the Office-compatible HTML document
      const html = markdownToWordHtml(markdown, docTitle);

      // Write with UTF-8 BOM for Word compatibility
      const bom = '\ufeff';
      const content = bom + html;
      fs.writeFileSync(outPath, content, 'utf-8');

      const stats = fs.statSync(outPath);
      const base64 = fs.readFileSync(outPath).toString('base64');

      return {
        content: [
          {
            type: 'text' as const,
            text: [
              `✅ Word document saved successfully.`,
              ``,
              `**File:** ${outPath}`,
              `**Size:** ${(stats.size / 1024).toFixed(1)} KB`,
              ``,
              `Open the .doc file in Microsoft Word, LibreOffice, or Google Docs.`,
              `The base64-encoded document is also attached below for programmatic use.`,
            ].join('\n'),
          },
          {
            type: 'text' as const,
            text: `data:application/msword;base64,${base64}`,
          },
        ],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [
          {
            type: 'text' as const,
            text: `❌ Failed to convert Markdown to Word: ${message}`,
          },
        ],
        isError: true,
      };
    }
  },
);

// ── Transport: stdio ─────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Keep stdio clean for MCP JSON-RPC; emit startup log only when explicitly enabled.
  if (process.env.MCP_DEBUG === '1') {
    console.error('Mark My Words Down MCP server running on stdio');
  }
}

main().catch((err) => {
  console.error('Fatal error starting MCP server:', err);
  process.exit(1);
});
