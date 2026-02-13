import { marked } from 'marked';

/**
 * Generates the HTML content for a Word-compatible .doc file from Markdown.
 *
 * This is a Node.js-portable version of the browser-side exportUtils.ts logic.
 * It produces an HTML document with Microsoft Office XML namespaces, conditional
 * comments, and inline styles that Word 2016+ renders faithfully.
 *
 * No DOM APIs are used — pure string generation.
 */
export function markdownToWordHtml(markdown: string, title: string = 'Document'): string {
  const renderer = new marked.Renderer();

  // ── Links ──────────────────────────────────────────────────────────────────
  // @ts-ignore – handle both Marked v12+ object signature and older positional args
  renderer.link = (entry: any, titleIfOld?: string | null, textIfOld?: string) => {
    let href = '';
    let linkTitle = '';
    let text = '';

    if (typeof entry === 'object' && entry !== null && 'href' in entry) {
      href = entry.href || '';
      linkTitle = entry.title || '';
      text = entry.text || '';
    } else {
      href = String(entry);
      linkTitle = titleIfOld || '';
      text = textIfOld || '';
    }

    const titleAttr = linkTitle ? ` title="${linkTitle}"` : '';
    return `<a href="${href}"${titleAttr} style="color: #0563C1; text-decoration: underline;">${text}</a>`;
  };

  // ── Images ─────────────────────────────────────────────────────────────────
  // @ts-ignore
  renderer.image = (entry: any, titleIfOld?: string | null, textIfOld?: string) => {
    let href = '';
    let imgTitle = '';
    let text = '';

    if (typeof entry === 'object' && entry !== null && 'href' in entry) {
      href = entry.href || '';
      imgTitle = entry.title || '';
      text = entry.text || '';
    } else {
      href = String(entry);
      imgTitle = titleIfOld || '';
      text = textIfOld || '';
    }

    const titleAttr = imgTitle ? ` title="${imgTitle}"` : '';
    const altAttr = text ? ` alt="${text}"` : '';
    return `<img src="${href}"${altAttr}${titleAttr} style="max-width: 100%; height: auto; vertical-align: middle; margin: 4pt 4pt;" />`;
  };

  // ── Bold ───────────────────────────────────────────────────────────────────
  // @ts-ignore
  renderer.strong = (entry: any) => {
    const text =
      typeof entry === 'object' && entry !== null && 'text' in entry
        ? entry.text
        : String(entry);
    return `<strong style="font-weight: bold;">${text}</strong>`;
  };

  // ── Italic ─────────────────────────────────────────────────────────────────
  // @ts-ignore
  renderer.em = (entry: any) => {
    const text =
      typeof entry === 'object' && entry !== null && 'text' in entry
        ? entry.text
        : String(entry);
    return `<em style="font-style: italic;">${text}</em>`;
  };

  // ── Code blocks with language labels ───────────────────────────────────────
  // @ts-ignore
  renderer.code = (entry: any, langIfOld?: string) => {
    let code = '';
    let language = '';

    if (typeof entry === 'object' && entry !== null && 'text' in entry) {
      code = entry.text || '';
      language = entry.lang || '';
    } else {
      code = String(entry);
      language = langIfOld || '';
    }

    const langLabel = language ? language.toUpperCase() : '';
    const labelHtml = langLabel
      ? `<div style="font-family: 'Calibri', sans-serif; font-size: 8pt; color: #555; font-weight: bold; text-transform: uppercase; background: #e0e0e0; padding: 2pt 6pt; border: 1px solid #a6a6a6; border-bottom: none; display: inline-block; border-radius: 4px 4px 0 0;">${langLabel}</div>`
      : '';

    const marginTop = langLabel ? '0' : '10pt';
    const borderRadius = langLabel ? '0 4px 4px 4px' : '4px';

    return `
      <div style="margin-bottom: 12pt; margin-top: 10pt; page-break-inside: avoid;">
        ${labelHtml}
        <pre style="background-color: #f8f8f8; border: 1px solid #a6a6a6; padding: 8pt; margin-top: ${marginTop}; border-radius: ${borderRadius}; font-family: 'Consolas', 'Courier New', monospace; font-size: 10pt; color: #000000; white-space: pre-wrap; word-wrap: break-word;"><code>${escapeHtml(code)}</code></pre>
      </div>
    `;
  };

  // ── Marked options ─────────────────────────────────────────────────────────
  marked.setOptions({ gfm: true, breaks: false });
  marked.use({ renderer });

  // Parse (marked.parse can be sync or async depending on version)
  const parseResult = marked.parse(markdown);
  const htmlContent: string =
    typeof parseResult === 'string' ? parseResult : '';

  // ── Full Office-compatible HTML document ───────────────────────────────────
  return `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    /* Default Word 2016+ Normal Style */
    body {
      font-family: 'Calibri', sans-serif;
      font-size: 11pt;
      line-height: 1.15;
      color: #000000;
      mso-line-height-rule: exactly;
    }

    /* Headings */
    h1 {
      font-family: 'Calibri Light', sans-serif;
      font-size: 16pt;
      color: #2F5496;
      margin-top: 24pt;
      margin-bottom: 6pt;
      font-weight: normal;
    }
    h2 {
      font-family: 'Calibri Light', sans-serif;
      font-size: 13pt;
      color: #2F5496;
      margin-top: 18pt;
      margin-bottom: 4pt;
      font-weight: normal;
    }
    h3 {
      font-family: 'Calibri Light', sans-serif;
      font-size: 12pt;
      color: #1F3763;
      margin-top: 14pt;
      margin-bottom: 4pt;
      font-weight: bold;
    }

    /* Paragraphs */
    p {
      margin-top: 0;
      margin-bottom: 10pt;
      color: #000000;
    }

    /* Lists */
    ul {
      margin-top: 0;
      margin-bottom: 10pt;
      padding-left: 24pt;
      list-style-type: disc;
    }
    ol {
      margin-top: 0;
      margin-bottom: 10pt;
      padding-left: 24pt;
      list-style-type: decimal;
    }
    li {
      margin-bottom: 3pt;
      color: #000000;
    }

    /* Links */
    a {
      color: #0563C1;
      text-decoration: underline;
    }

    /* Blockquotes */
    blockquote {
      margin-left: 0;
      padding-left: 10pt;
      border-left: 4px solid #5b9bd5;
      color: #404040;
      font-style: italic;
    }

    /* Tables */
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 15pt;
      border: 1px solid #000000;
    }
    th {
      border: 1px solid #000000;
      background-color: #e7e6e6;
      padding: 6pt;
      text-align: left;
      font-weight: bold;
      color: #000000 !important;
    }
    td {
      border: 1px solid #000000;
      padding: 6pt;
      vertical-align: top;
      color: #000000 !important;
    }
  </style>
</head>
<body>
  ${htmlContent}
</body>
</html>`;
}

/**
 * Minimal HTML entity escaping for untrusted content injected into HTML attributes / text.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
