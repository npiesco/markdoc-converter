/**
 * Vercel Serverless MCP Endpoint — Streamable HTTP Transport
 */

import { z } from 'zod';
import { createMcpHandler } from 'mcp-handler';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { markdownToWordHtml } from '../mcp-server/src/converter.js';

export interface ConvertInput {
  markdown?: string;
  markdownPath?: string;
  filename?: string;
  outputDir?: string;
}

export type ConvertResult = CallToolResult;

function hasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateExactlyOneSource(input: ConvertInput): void {
  const hasMarkdown = hasValue(input.markdown);
  const hasMarkdownPath = hasValue(input.markdownPath);

  if (hasMarkdown === hasMarkdownPath) {
    throw new Error('Provide exactly one of "markdown" or "markdownPath".');
  }
}

async function resolveMarkdownSourceRemote(input: ConvertInput): Promise<string> {
  validateExactlyOneSource(input);

  if (hasValue(input.markdown)) {
    return input.markdown as string;
  }

  const source = (input.markdownPath as string).trim();

  if (/^[a-zA-Z]:[\\/]/.test(source) || source.startsWith('/') || source.startsWith('file://')) {
    throw new Error(
      'Remote server cannot access local paths. Provide raw markdown or a public URL in markdownPath.',
    );
  }

  if (source.startsWith('data:text/markdown;base64,')) {
    const b64 = source.slice('data:text/markdown;base64,'.length);
    return Buffer.from(b64, 'base64').toString('utf-8');
  }

  if (source.startsWith('http://') || source.startsWith('https://')) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(`Failed to fetch markdownPath URL: HTTP ${response.status}`);
    }
    return await response.text();
  }

  throw new Error(
    'Invalid markdownPath for remote mode. Use data:text/markdown;base64,... or an http(s) URL.',
  );
}

export async function convertMarkdownToWord(
  input: ConvertInput,
): Promise<ConvertResult> {
  try {
    const docTitle = input.filename ?? 'document';
    const targetDir = input.outputDir;
    const sourceMarkdown = await resolveMarkdownSourceRemote(input);

    const html = markdownToWordHtml(sourceMarkdown, docTitle);
    const content = `\ufeff${html}`;

    const base64 = Buffer.from(content, 'utf-8').toString('base64');
    const sizeKB = (Buffer.byteLength(content, 'utf-8') / 1024).toFixed(1);

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
      content: [{ type: 'text' as const, text: `Failed to convert Markdown to Word: ${message}` }],
      isError: true,
    };
  }
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      'convert_markdown_to_word',
      {
        description:
          'Converts Markdown into a Microsoft Word (.doc) document and returns it as an EmbeddedResource. ' +
          'Provide exactly one source: markdown OR markdownPath. In remote mode, markdownPath supports only ' +
          'data:text/markdown;base64,... or public http(s) URLs (not local file paths).',
        inputSchema: {
          markdown: z
            .string()
            .optional()
            .describe('Raw Markdown text. Provide this OR markdownPath.'),
          markdownPath: z
            .string()
            .optional()
            .describe('Remote source path. Supports data:text/markdown;base64,... or http(s) URL.'),
          filename: z.string().optional().describe('Output filename without extension. Defaults to "document".'),
          outputDir: z
            .string()
            .optional()
            .describe('Directory path on the user machine for resource file:// URI metadata.'),
        },
      },
      async ({ markdown, markdownPath, filename, outputDir }) => {
        return convertMarkdownToWord({
          markdown: markdown as string | undefined,
          markdownPath: markdownPath as string | undefined,
          filename: filename as string | undefined,
          outputDir: outputDir as string | undefined,
        });
      },
    );
  },
  {},
  { basePath: '/api' },
);

export { handler as GET, handler as POST, handler as DELETE };
