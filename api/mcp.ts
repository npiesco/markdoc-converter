/**
 * Vercel Serverless MCP Endpoint — Streamable HTTP Transport
 *
 * Exposes the `convert_markdown_to_word` tool over the MCP Streamable HTTP
 * transport so that any MCP-compatible client (Cursor, Claude Desktop,
 * VS Code Copilot Chat, etc.) can reach it at:
 *
 *   https://markdoc-converter.vercel.app/api/mcp
 *
 * The tool does NOT write to the server filesystem (it's ephemeral and
 * useless to the user). Instead it returns base64-encoded .doc content and
 * instructs the LLM to save the file on the user's local machine at the
 * path described by outputDir + filename.
 */

import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import { markdownToWordHtml } from '../mcp-server/src/converter.js';

/* ------------------------------------------------------------------ */
/*  Pure conversion function — no filesystem side-effects              */
/* ------------------------------------------------------------------ */

export interface ConvertInput {
  markdown: string;
  filename?: string;
  outputDir?: string;
}

export interface ContentBlock {
  type: 'text';
  text: string;
}

export interface ConvertResult {
  content: ContentBlock[];
  isError?: boolean;
}

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

    // Build the target path hint for the LLM
    const targetFile = `${docTitle}.doc`;
    const savePath = targetDir ? `${targetDir}/${targetFile}` : targetFile;
    const dirHint = targetDir
      ? `\`${targetDir}\``
      : 'the current working directory';

    return {
      content: [
        {
          type: 'text' as const,
          text: [
            `Word document generated successfully (${sizeKB} KB).`,
            '',
            `**Please save this file to the user's machine.**`,
            `**Target path:** \`${savePath}\``,
            `**Directory:** ${dirHint}`,
            '',
            `Write the base64-decoded content below to \`${savePath}\` on ` +
              `the user's local filesystem. If the directory does not exist, ` +
              `create it first.`,
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
}

/* ------------------------------------------------------------------ */
/*  MCP handler wiring                                                 */
/* ------------------------------------------------------------------ */

const handler = createMcpHandler(
  (server) => {
    server.tool(
      'convert_markdown_to_word',
      'Converts Markdown text into a Microsoft Word (.doc) document. ' +
        'Supports GitHub Flavored Markdown: headings, bold/italic, code blocks ' +
        'with language labels, tables, links, images, blockquotes, and lists. ' +
        'Output uses Word 2016+ default formatting (Calibri, proper heading ' +
        'colors, black table borders). Returns base64-encoded .doc content — ' +
        'you MUST save the decoded bytes to the user\'s local filesystem at ' +
        'the path indicated in the response. Use forward slashes for ' +
        'cross-platform paths (e.g. "C:/Users/me/Documents").',
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
            'Directory path on the USER\'S machine where the .doc file ' +
            'should be saved. This is a hint for the LLM — the server does ' +
            'NOT write to disk. Works on Windows, macOS, and Linux — use ' +
            'forward slashes for cross-platform compatibility. When omitted, ' +
            'the LLM should save to the user\'s current working directory.',
          ),
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
