import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { resolveMarkdownSourceLocal } from './markdownSource.js';

describe('local markdown source resolver', () => {
  it('accepts raw markdown input', () => {
    const markdown = resolveMarkdownSourceLocal({ markdown: '# Raw input' });
    expect(markdown).toContain('# Raw input');
  });

  it('reads markdown from markdownPath', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-md-'));
    const mdPath = path.join(tempDir, 'sample.md');
    fs.writeFileSync(mdPath, '# From file\n\nlocal mode path support', 'utf-8');

    const markdown = resolveMarkdownSourceLocal({ markdownPath: mdPath });
    expect(markdown).toContain('# From file');
  });

  it('fails when both markdown and markdownPath are provided', () => {
    expect(() =>
      resolveMarkdownSourceLocal({
        markdown: '# one',
        markdownPath: 'C:/fake/path.md',
      }),
    ).toThrow(/exactly one/i);
  });

  it('fails when neither markdown nor markdownPath is provided', () => {
    expect(() => resolveMarkdownSourceLocal({})).toThrow(/exactly one/i);
  });
});
