import * as fs from 'node:fs';
import * as path from 'node:path';

export interface MarkdownSourceInput {
  markdown?: string;
  markdownPath?: string;
}

function hasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateExactlyOneSource(input: MarkdownSourceInput): void {
  const hasMarkdown = hasValue(input.markdown);
  const hasMarkdownPath = hasValue(input.markdownPath);

  if (hasMarkdown === hasMarkdownPath) {
    throw new Error(
      'Provide exactly one of "markdown" or "markdownPath".',
    );
  }
}

export function resolveMarkdownSourceLocal(input: MarkdownSourceInput): string {
  validateExactlyOneSource(input);

  if (hasValue(input.markdown)) {
    return input.markdown as string;
  }

  const resolvedPath = path.resolve(input.markdownPath as string);
  return fs.readFileSync(resolvedPath, 'utf-8');
}
