/**
 * Vercel Serverless MCP Endpoint — Streamable HTTP Transport
 *
 * Exposes the `convert_markdown_to_word` tool over the MCP Streamable HTTP
 * transport so that any MCP-compatible client (Cursor, Claude Desktop,
 * VS Code Copilot Chat, etc.) can reach it at:
 *
 *   https://<your-vercel-app>.vercel.app/api/mcp
 *
 * Unlike the stdio server in mcp-server/, this handler is stateless and
 * does not write to the filesystem — it returns the Word document as
 * base64 directly in the tool response.
 */

import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import { markdownToWordHtml } from '../mcp-server/src/converter.js';

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'convert_markdown_to_word',
      'Converts Markdown text into a Microsoft Word (.doc) document. ' +
        'Supports GitHub Flavored Markdown: headings, bold/italic, code blocks ' +
        'with language labels, tables, links, images, blockquotes, and lists. ' +
        'Output uses Word 2016+ default formatting (Calibri, proper heading ' +
        'colors, black table borders). Returns the document encoded as base64.',
      {
        markdown: z
          .string()
          .describe('The Markdown content to convert to a Word document'),
        filename: z
          .string()
          .optional()
          .describe(
            'Output filename / document title without extension. Defaults to "document".',
          ),
      },
      async ({ markdown, filename }) => {
        try {
          const docTitle = (filename as string | undefined) ?? 'document';

          // Generate the Office-compatible HTML document
          const html = markdownToWordHtml(markdown, docTitle);

          // Prepend UTF-8 BOM for Word compatibility (same as the stdio server)
          const bom = '\ufeff';
          const content = bom + html;

          // Encode to base64 for transport (no filesystem in serverless)
          const base64 = Buffer.from(content, 'utf-8').toString('base64');
          const sizeKB = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(
            1,
          );

          return {
            content: [
              {
                type: 'text' as const,
                text: [
                  'Word document generated successfully.',
                  '',
                  `**Title:** ${docTitle}.doc`,
                  `**Size:** ${sizeKB} KB`,
                  '',
                  'The base64-encoded document is attached below. ' +
                    'Save it as a `.doc` file and open in Microsoft Word, LibreOffice, or Google Docs.',
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
