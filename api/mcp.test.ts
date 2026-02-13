/**
 * Tests for the Vercel MCP convert_markdown_to_word tool.
 *
 * The remote (Vercel) tool must:
 *  1. NOT write to the server filesystem — it's ephemeral and useless to the user.
 *  2. Return base64-encoded .doc content so the LLM client can save it locally.
 *  3. Include outputDir + filename in the response so the LLM knows WHERE to save.
 *  4. Explicitly instruct the LLM to save the file on the user's local machine.
 *  5. Accept outputDir as an OS-agnostic path hint for the LLM (not used server-side).
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Import the extracted pure tool function
import { convertMarkdownToWord } from './mcp.js';

describe('Vercel MCP tool: convert_markdown_to_word', () => {
  it('RED: does NOT write to the server filesystem', async () => {
    // Snapshot /tmp before
    const tmpBefore = fs.readdirSync('/tmp').sort();

    await convertMarkdownToWord({
      markdown: '# Test\n\nHello world.',
      filename: 'fs-check-test',
      outputDir: 'C:/Users/someone/Documents',
    });

    // Snapshot /tmp after — no new files
    const tmpAfter = fs.readdirSync('/tmp').sort();
    expect(tmpAfter).toEqual(tmpBefore);

    // The outputDir path must NOT exist on the server either
    expect(fs.existsSync('C:/Users/someone/Documents/fs-check-test.doc')).toBe(
      false,
    );
  });

  it('RED: returns base64-encoded document content', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# Test\n\nHello world.',
    });

    // Must have at least 2 content blocks
    expect(result.content.length).toBeGreaterThanOrEqual(2);

    // Second content block must be the base64 data URI
    const base64Block = result.content.find((c: any) =>
      c.text?.startsWith('data:application/msword;base64,'),
    );
    expect(base64Block).toBeDefined();

    // Decode and verify it starts with UTF-8 BOM + HTML
    const raw = Buffer.from(
      base64Block!.text.replace('data:application/msword;base64,', ''),
      'base64',
    ).toString('utf-8');
    expect(raw).toContain('\ufeff');
    expect(raw).toContain('<html');
  });

  it('RED: includes outputDir and filename in response for LLM to save locally', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# Save me',
      filename: 'my-notes',
      outputDir: 'C:/Users/someone/Desktop',
    });

    const textBlock = result.content[0].text;

    // Must tell the LLM the target path on the USER's machine
    expect(textBlock).toContain('C:/Users/someone/Desktop');
    expect(textBlock).toContain('my-notes.doc');
    // Must instruct the LLM to save locally
    expect(textBlock).toMatch(/save|write/i);
  });

  it('RED: defaults filename to "document" when omitted', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# Default name test',
    });

    const textBlock = result.content[0].text;
    expect(textBlock).toContain('document.doc');
  });

  it('RED: defaults outputDir to current working directory when omitted', async () => {
    const result = await convertMarkdownToWord({
      markdown: '# Default dir test',
    });

    const textBlock = result.content[0].text;
    // Should mention saving to the current/working directory
    expect(textBlock).toMatch(/current.*director|working.*director/i);
  });
});
