#!/usr/bin/env node

import { McpServer, StdioServerTransport } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { markdownToWordHtml } from './converter.js';
import { resolveMarkdownSourceLocal } from './markdownSource.js';

function normalizePath(p: string): string {
  return path.resolve(p);
}

const server = new McpServer(
  { name: 'mark-my-words-down', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.registerTool(
  'convert_markdown_to_word',
  {
    title: 'Convert Markdown to Word',
    description:
      'Converts Markdown into a Microsoft Word (.doc) document and saves it to disk. ' +
      'Provide exactly one source: markdown OR markdownPath.',
    inputSchema: z.object({
      markdown: z
        .string()
        .optional()
        .describe('Raw Markdown text. Provide this OR markdownPath.'),
      markdownPath: z
        .string()
        .optional()
        .describe('Absolute or relative path to a Markdown file on this machine.'),
      filename: z.string().optional().describe('Output filename without extension. Defaults to "document".'),
      outputDir: z
        .string()
        .optional()
        .describe('Absolute or relative directory path to save the .doc file. Defaults to current working directory.'),
    }),
    annotations: {
      title: 'Markdown → Word Converter',
      readOnlyHint: false,
      openWorldHint: false,
    },
  },
  async ({ markdown, markdownPath, filename, outputDir }) => {
    try {
      const docTitle = filename ?? 'document';
      const dir = normalizePath(outputDir ?? process.cwd());
      const sourceMarkdown = resolveMarkdownSourceLocal({
        markdown: markdown as string | undefined,
        markdownPath: markdownPath as string | undefined,
      });

      fs.mkdirSync(dir, { recursive: true });
      const outPath = normalizePath(path.join(dir, `${docTitle}.doc`));

      const html = markdownToWordHtml(sourceMarkdown, docTitle);
      const content = `\ufeff${html}`;
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
          { type: 'text' as const, text: `data:application/msword;base64,${base64}` },
        ],
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text' as const, text: `Failed to convert Markdown to Word: ${message}` }],
        isError: true,
      };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  if (process.env.MCP_DEBUG === '1') {
    console.error('Mark My Words Down MCP server running on stdio');
  }
}

main().catch((err) => {
  console.error('Fatal error starting MCP server:', err);
  process.exit(1);
});
