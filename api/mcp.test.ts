/**
 * Tests for the Vercel MCP convert_markdown_to_word tool.
 *
 * Product requirement: send markdown → get a .doc file on your machine.
 * No instructions. No manual decoding. The MCP client handles file delivery
 * natively via an EmbeddedResource content block.
 *
 * The tool must:
 *  1. NOT write to the server filesystem.
 *  2. Return an EmbeddedResource (type: "resource") with the .doc as a blob.
 *  3. Set the correct mimeType (application/msword) and a file:// URI.
 *  4. Include a short text summary (size, filename) for LLM context — nothing more.
 *  5. The blob must decode to valid Word-compatible HTML with UTF-8 BOM.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';

import { convertMarkdownToWord } from './mcp.js';

describe('Vercel MCP tool: convert_markdown_to_word', () => {
  it('does NOT write to the server filesystem', async () => {
    const tmpBefore = fs.readdirSync('/tmp').sort();

    await convertMarkdownToWord({
      markdown: '# Test\n\nHello world.',
      filename: 'fs-check-test',
      outputDir: 'C:/Users/someone/Documents',
    });

    const tmpAfter = fs.readdirSync('/tmp').sort();
    expect(tmpAfter).toEqual(tmpBefore);
    expect(fs.existsSync('C:/Users/someone/Documents/fs-check-test.doc')).toBe(false);
  });

  it('returns an EmbeddedResource content block (type: "resource")', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# Hello\n\nWorld.',
      filename: 'my-doc',
      outputDir: 'C:/Users/someone/Desktop',
    });

    const resourceBlock = result.content.find((c: any) => c.type === 'resource');
    expect(resourceBlock).toBeDefined();
    expect(resourceBlock!.type).toBe('resource');
  });

  it('sets mimeType to application/msword on the resource', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# Test',
      filename: 'mime-test',
      outputDir: '/home/user/docs',
    });

    const resourceBlock = result.content.find((c: any) => c.type === 'resource') as any;
    expect(resourceBlock.resource.mimeType).toBe('application/msword');
  });

  it('sets a file:// URI with outputDir and filename', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# URI test',
      filename: 'my-notes',
      outputDir: 'C:/Users/someone/Desktop',
    });

    const resourceBlock = result.content.find((c: any) => c.type === 'resource') as any;
    expect(resourceBlock.resource.uri).toBe('file:///C:/Users/someone/Desktop/my-notes.doc');
  });

  it('defaults filename to "document" and uses cwd hint in URI when outputDir omitted', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# Defaults',
    });

    const resourceBlock = result.content.find((c: any) => c.type === 'resource') as any;
    expect(resourceBlock.resource.uri).toContain('document.doc');
  });

  it('blob decodes to valid Word HTML with UTF-8 BOM', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# BOM Test\n\nContent here.',
      filename: 'bom-test',
    });

    const resourceBlock = result.content.find((c: any) => c.type === 'resource') as any;
    const decoded = Buffer.from(resourceBlock.resource.blob, 'base64').toString('utf-8');

    expect(decoded).toContain('\ufeff');
    expect(decoded).toContain('<html');
    expect(decoded).toContain('BOM Test');
  });

  it('includes a short text summary (not save instructions)', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# Summary test',
      filename: 'summary',
      outputDir: 'C:/Users/someone/Desktop',
    });

    const textBlock = result.content.find((c: any) => c.type === 'text') as any;
    expect(textBlock).toBeDefined();
    // Should mention the filename and size
    expect(textBlock.text).toContain('summary.doc');
    expect(textBlock.text).toMatch(/KB/i);
    // Should NOT contain save/write instructions — the client handles that
    expect(textBlock.text).not.toMatch(/save|write|decode|base64/i);
  });
});
