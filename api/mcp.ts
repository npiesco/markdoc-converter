/**
 * Vercel Serverless MCP Endpoint — Streamable HTTP Transport
 *
 * Exposes the `convert_markdown_to_word` tool over the MCP Streamable HTTP
 * transport so that any MCP-compatible client (Cursor, Claude Desktop,
 * VS Code Copilot Chat, etc.) can reach it at:
 *
 *   https://<your-vercel-app>.vercel.app/api/mcp
 *
 * The tool always persists the .doc file to disk (defaults to /tmp in
 * serverless) and returns the file path + base64-encoded content.
 */

import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import { markdownToWordHtml } from '../mcp-server/src/converter.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'convert_markdown_to_word',
      'Converts Markdown text into a Microsoft Word (.doc) document and ' +
        'saves it to disk. Supports GitHub Flavored Markdown: headings, ' +
        'bold/italic, code blocks with language labels, tables, links, images, ' +
        'blockquotes, and lists. Output uses Word 2016+ default formatting ' +
        '(Calibri, proper heading colors, black table borders). ' +
        'The file is ALWAYS written to disk at the path specified by outputDir ' +
        '(defaults to /tmp in serverless environments). Use forward slashes for ' +
        'cross-platform paths (e.g. "C:/Users/me/Documents" or ' +
        '"/home/me/Documents"). Returns the saved file path and the document ' +
        'encoded as base64.',
      {
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
            'Absolute or relative directory path to save the .doc file. ' +
            'Works on Windows, macOS, and Linux — use forward slashes for ' +
            'cross-platform compatibility. Defaults to /tmp in serverless ' +
            'or the current working directory in local environments.',
          ),
      },
      async ({ markdown, filename, outputDir }) => {
        try {
          const docTitle = (filename as string | undefined) ?? 'document';
          const dir = path.resolve((outputDir as string | undefined) ?? '/tmp');

          // Ensure output directory exists
          fs.mkdirSync(dir, { recursive: true });

          const outPath = path.resolve(path.join(dir, `${docTitle}.doc`));

          // Generate the Office-compatible HTML document
          const html = markdownToWordHtml(markdown, docTitle);

          // Prepend UTF-8 BOM for Word compatibility
          const bom = '\ufeff';
          const content = bom + html;

          // Always persist to disk
          fs.writeFileSync(outPath, content, 'utf-8');

          const stats = fs.statSync(outPath);
          const base64 = fs.readFileSync(outPath).toString('base64');

          return {
            content: [
              {
                type: 'text' as const,
                text: [
                  'Word document saved successfully.',
                  '',
                  `**File:** ${outPath}`,
                  `**Size:** ${(stats.size / 1024).toFixed(1)} KB`,
                  '',
                  'Open the .doc file in Microsoft Word, LibreOffice, or Google Docs.',
                  'The base64-encoded document is also attached below for programmatic use.',
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
                text: `Failed to convert Markdown to Word: ${message}`,
              },
            ],
            isError: true,
          };
        }
      },
    );
  },
  {},
  {
    basePath: '/api',
  },
);

export { handler as GET, handler as POST, handler as DELETE };
