import { marked } from 'marked';

export const exportToWord = (markdown: string, fileName: string) => {
  // Create a custom renderer to handle Code Blocks with Language Labels and Links
  const renderer = new marked.Renderer();
  
  // Handle links to ensure they work properly in Word
  // @ts-ignore
  renderer.link = (entry: any, titleIfOld?: string | null, textIfOld?: string) => {
    let href = '';
    let title = '';
    let text = '';

    if (typeof entry === 'object' && entry !== null && 'href' in entry) {
      // Marked v12+ signature: { href, title, text, ... }
      href = entry.href || '';
      title = entry.title || '';
      text = entry.text || '';
    } else {
      // Older Marked signature: (href, title, text)
      href = String(entry);
      title = titleIfOld || '';
      text = textIfOld || '';
    }

    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}"${titleAttr} style="color: #0563C1; text-decoration: underline;">${text}</a>`;
  };

  // Handle images (like badges)
  // @ts-ignore
  renderer.image = (entry: any, titleIfOld?: string | null, textIfOld?: string) => {
    let href = '';
    let title = '';
    let text = '';

    if (typeof entry === 'object' && entry !== null && 'href' in entry) {
      href = entry.href || '';
      title = entry.title || '';
      text = entry.text || '';
    } else {
      href = String(entry);
      title = titleIfOld || '';
      text = textIfOld || '';
    }

    const titleAttr = title ? ` title="${title}"` : '';
    const altAttr = text ? ` alt="${text}"` : '';
    return `<img src="${href}"${altAttr}${titleAttr} style="max-width: 100%; height: auto; vertical-align: middle; margin: 4pt 4pt;" />`;
  };
  
  // Handle both old (string args) and new (object arg) Marked signatures
  // @ts-ignore
  renderer.code = (entry: any, langIfOld?: string) => {
    let code = '';
    let language = '';

    if (typeof entry === 'object' && entry !== null && 'text' in entry) {
      // Marked v12+ signature: { text, lang, ... }
      code = entry.text || '';
      language = entry.lang || '';
    } else {
      // Older Marked signature: (code, lang)
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
        <pre style="background-color: #f8f8f8; border: 1px solid #a6a6a6; padding: 8pt; margin-top: ${marginTop}; border-radius: ${borderRadius}; font-family: 'Consolas', 'Courier New', monospace; font-size: 10pt; color: #000000; white-space: pre-wrap; word-wrap: break-word;"><code>${code}</code></pre>
      </div>
    `;
  };

  // Configure marked
  marked.setOptions({
    gfm: true,
    breaks: true
  });
  
  // Apply custom renderer temporarily
  marked.use({ renderer });

  // Convert Markdown to HTML
  const htmlContent = marked.parse(markdown);

  // Create a complete HTML document with Office namespace
  const docContent = `
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

        /* Lists - Explicitly define margins for Word */
        ul {
          margin-top: 0;
          margin-bottom: 10pt;
          padding-left: 24pt; /* Indent for bullets */
          list-style-type: disc;
        }

        ol {
          margin-top: 0;
          margin-bottom: 10pt;
          padding-left: 24pt; /* Indent for numbers */
          list-style-type: decimal;
        }

        li {
          margin-bottom: 3pt;
          color: #000000; /* Ensure text is black */
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
          color: #000000 !important; /* Force Black */
        }

        td {
          border: 1px solid #000000;
          padding: 6pt;
          vertical-align: top;
          color: #000000 !important; /* Force Black */
        }
      </style>
    </head>
    <body>
      ${htmlContent}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docContent], {
    type: 'application/msword'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.doc`;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
