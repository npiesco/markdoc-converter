/**
 * Web Worker that converts Markdown → Word-compatible HTML entirely off the
 * main thread.  Keeps the UI responsive during large document conversions and
 * guarantees zero network calls — everything runs in-browser.
 *
 * Communication protocol (postMessage):
 *   → { markdown: string, fileName: string }
 *   ← { html: string }          on success
 *   ← { error: string }         on failure
 */

import { marked } from 'marked';

/* ---------- custom renderer (mirrors exportUtils.ts logic) ---------- */

function buildRenderer() {
  const renderer = new marked.Renderer();

  // @ts-ignore – Marked v12+ overloaded signatures
  renderer.link = (entry: any, titleIfOld?: string | null, textIfOld?: string) => {
    let href = '', title = '', text = '';
    if (typeof entry === 'object' && entry !== null && 'href' in entry) {
      href = entry.href || ''; title = entry.title || ''; text = entry.text || '';
    } else {
      href = String(entry); title = titleIfOld || ''; text = textIfOld || '';
    }
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}"${titleAttr} style="color: #0563C1; text-decoration: underline;">${text}</a>`;
  };

  // @ts-ignore
  renderer.image = (entry: any, titleIfOld?: string | null, textIfOld?: string) => {
    let href = '', title = '', text = '';
    if (typeof entry === 'object' && entry !== null && 'href' in entry) {
      href = entry.href || ''; title = entry.title || ''; text = entry.text || '';
    } else {
      href = String(entry); title = titleIfOld || ''; text = textIfOld || '';
    }
    const titleAttr = title ? ` title="${title}"` : '';
    const altAttr = text ? ` alt="${text}"` : '';
    return `<img src="${href}"${altAttr}${titleAttr} style="max-width: 100%; height: auto; vertical-align: middle; margin: 4pt 4pt;" />`;
  };

  // @ts-ignore
  renderer.strong = (entry: any) => {
    const text = typeof entry === 'object' && entry !== null && 'text' in entry ? entry.text : String(entry);
    return `<strong style="font-weight: bold;">${text}</strong>`;
  };

  // @ts-ignore
  renderer.em = (entry: any) => {
    const text = typeof entry === 'object' && entry !== null && 'text' in entry ? entry.text : String(entry);
    return `<em style="font-style: italic;">${text}</em>`;
  };

  // @ts-ignore
  renderer.code = (entry: any, langIfOld?: string) => {
    let code = '', language = '';
    if (typeof entry === 'object' && entry !== null && 'text' in entry) {
      code = entry.text || ''; language = entry.lang || '';
    } else {
      code = String(entry); language = langIfOld || '';
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
        <pre style="background-color: #f8f8f8; border: 1px solid #a6a6a6; padding: 8pt; margin-top: ${marginTop}; border-radius: ${borderRadius}; font-family: 'Consolas', 'Courier New', monospace; font-size: 10pt; color: #000000; white-space: pre-wrap; word-wrap: break-word;"><code>${code}</code></pre>
      </div>`;
  };

  return renderer;
}

/* ---------- Word document wrapper ---------- */

function wrapHtml(htmlContent: string, fileName: string): string {
  return `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${fileName}</title>
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
        body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.15; color: #000000; mso-line-height-rule: exactly; }
        h1 { font-family: 'Calibri Light', sans-serif; font-size: 16pt; color: #2F5496; margin-top: 24pt; margin-bottom: 6pt; font-weight: normal; }
        h2 { font-family: 'Calibri Light', sans-serif; font-size: 13pt; color: #2F5496; margin-top: 18pt; margin-bottom: 4pt; font-weight: normal; }
        h3 { font-family: 'Calibri Light', sans-serif; font-size: 12pt; color: #1F3763; margin-top: 14pt; margin-bottom: 4pt; font-weight: bold; }
        p { margin-top: 0; margin-bottom: 10pt; color: #000000; }
        ul { margin-top: 0; margin-bottom: 10pt; padding-left: 24pt; list-style-type: disc; }
        ol { margin-top: 0; margin-bottom: 10pt; padding-left: 24pt; list-style-type: decimal; }
        li { margin-bottom: 3pt; color: #000000; }
        a { color: #0563C1; text-decoration: underline; }
        blockquote { margin-left: 0; padding-left: 10pt; border-left: 4px solid #5b9bd5; color: #404040; font-style: italic; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 15pt; border: 1px solid #000000; }
        th { border: 1px solid #000000; background-color: #e7e6e6; padding: 6pt; text-align: left; font-weight: bold; color: #000000 !important; }
        td { border: 1px solid #000000; padding: 6pt; vertical-align: top; color: #000000 !important; }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>`;
}

/* ---------- worker message handler ---------- */

self.addEventListener('message', async (e: MessageEvent) => {
  try {
    const { markdown, fileName } = e.data as { markdown: string; fileName: string };

    marked.setOptions({ gfm: true, breaks: false });
    marked.use({ renderer: buildRenderer() });

    const parseResult = marked.parse(markdown);
    const htmlContent = parseResult instanceof Promise ? await parseResult : parseResult;
    const html = wrapHtml(htmlContent, fileName);

    self.postMessage({ html });
  } catch (err: any) {
    self.postMessage({ error: err?.message ?? String(err) });
  }
});
