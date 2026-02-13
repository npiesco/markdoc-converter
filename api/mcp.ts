/**
 * Vercel Serverless MCP Endpoint — Streamable HTTP Transport
 *
 * Exposes the `convert_markdown_to_word` tool over the MCP Streamable HTTP
 * transport so that any MCP-compatible client (Cursor, Claude Desktop,
 * VS Code Copilot Chat, etc.) can reach it at:
 *
 *   https://markdoc-converter.vercel.app/api/mcp
 *
 * The tool does NOT write to the server filesystem. It returns the .doc file
 * as an MCP EmbeddedResource (type: "resource") with a base64 blob, mimeType,
 * and a file:// URI. The MCP client handles file delivery natively — no LLM
 * interpretation required.
 */

import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { markdownToWordHtml } from '../mcp-server/src/converter.js';

/* ------------------------------------------------------------------ */
/*  Pure conversion function — no filesystem side-effects              */
/* ------------------------------------------------------------------ */

export interface ConvertInput {
  markdown: string;
  filename?: string;
  outputDir?: string;
}

export type ConvertResult = CallToolResult;

export async function convertMarkdownToWord(
  input: ConvertInput,
): Promise<ConvertResult> {
  try {
    const docTitle = input.filename ?? 'document';
    const targetDir = input.outputDir;

    // Generate the Office-compatible HTML document
    const html = markdownToWordHtml(input.markdown, docTitle);

    // Prepend UTF-8 BOM for Word compatibility
    const bom = '\ufeff';
    const content = bom + html;

    const base64 = Buffer.from(content, 'utf-8').toString('base64');
    const sizeKB = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1);

    // Build file:// URI for the target path on the user's machine
    const targetFile = `${docTitle}.doc`;
    const fileUri = targetDir
      ? `file:///${targetDir.replace(/^\//, '')}/${targetFile}`
      : `file:///./${targetFile}`;

    return {
      content: [
        {
          type: 'text' as const,
          text: `Converted ${targetFile} (${sizeKB} KB).`,
        },
        {
          type: 'resource' as const,
          resource: {
            uri: fileUri,
            mimeType: 'application/msword',
            blob: base64,
          },
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
}

/* ------------------------------------------------------------------ */
/*  MCP handler wiring                                                 */
/* ------------------------------------------------------------------ */

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'convert_markdown_to_word',
      {
        description:
          'Converts Markdown text into a Microsoft Word (.doc) document. ' +
          'Supports GitHub Flavored Markdown: headings, bold/italic, code blocks ' +
          'with language labels, tables, links, images, blockquotes, and lists. ' +
          'Output uses Word 2016+ default formatting (Calibri, proper heading ' +
          'colors, black table borders).\n\n' +
          'Returns an EmbeddedResource with the .doc file as a base64 blob. ' +
          'The MCP client handles file delivery automatically — no manual ' +
          'decoding or saving needed.',
        inputSchema: {
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
              'Directory path on the user\'s machine for the output file ' +
              '(e.g. "C:/Users/me/Documents"). Used in the file:// URI of the ' +
              'returned resource. When omitted, defaults to current directory.',
            ),
        },
      },
      async ({ markdown, filename, outputDir }) => {
        return convertMarkdownToWord({
          markdown: markdown as string,
          filename: filename as string | undefined,
          outputDir: outputDir as string | undefined,
        });
      },
    );
  },
  {},
  {
    basePath: '/api',
  },
);

export { handler as GET, handler as POST, handler as DELETE };
