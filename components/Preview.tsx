import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';

interface PreviewProps {
  content: string;
}

export const Preview: React.FC<PreviewProps> = ({ content }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      // Create a custom renderer to MATCH the Export logic
      const renderer = new marked.Renderer();
      
      // Handle links to ensure they work properly in preview
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
        return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer" style="color: #0563C1; text-decoration: underline;">${text}</a>`;
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
        return `<img src="${href}"${altAttr}${titleAttr} style="max-width: 100%; height: auto; vertical-align: middle; margin: 4px;" />`;
      };

      // Handle paragraphs to preserve spacing
      // @ts-ignore
      renderer.paragraph = (entry: any) => {
        const text = typeof entry === 'object' && entry !== null && 'text' in entry ? entry.text : String(entry);
        return `<p style="margin-top: 0; margin-bottom: 10pt; color: #000000;">${text}</p>`;
      };
      
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
          ? `<div class="code-label">${langLabel}</div>` 
          : '';
        
        const hasLabelClass = langLabel ? 'has-label' : '';

        return `
          <div class="code-wrapper">
            ${labelHtml}
            <pre class="${hasLabelClass}"><code>${code}</code></pre>
          </div>
        `;
      };

      marked.setOptions({
        gfm: true,
        breaks: true
      });
      
      marked.use({ renderer });
      
      // Handle async parse
      const parseContent = async () => {
        const html = await marked.parse(content);
        if (contentRef.current) {
          contentRef.current.innerHTML = html;
        }
      };
      
      parseContent();
    }
  }, [content]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider flex justify-between items-center">
        <span>Word Preview</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">Print Layout</span>
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 md:p-8">
        {/* Paper simulation */}
        <div className="min-h-full mx-auto bg-white text-slate-900 shadow-lg p-8 md:p-12 max-w-3xl outline outline-1 outline-slate-200">
          <style>{`
            .word-preview {
              font-family: 'Calibri', sans-serif;
              font-size: 11pt;
              line-height: 1.15;
              color: #000000;
            }
            /* Paragraphs */
            .word-preview p { margin-top: 0; margin-bottom: 10pt; color: #000000; }
            
            /* Headings */
            .word-preview h1 { font-family: 'Calibri Light', sans-serif; font-size: 16pt; color: #2F5496; font-weight: normal; margin-top: 24pt; margin-bottom: 6pt; }
            .word-preview h2 { font-family: 'Calibri Light', sans-serif; font-size: 13pt; color: #2F5496; font-weight: normal; margin-top: 18pt; margin-bottom: 4pt; }
            .word-preview h3 { font-family: 'Calibri Light', sans-serif; font-size: 12pt; color: #1F3763; font-weight: bold; margin-top: 14pt; margin-bottom: 4pt; }
            
            /* Lists */
            .word-preview ul { padding-left: 24pt; list-style-type: disc; margin-bottom: 10pt; }
            .word-preview ol { padding-left: 24pt; list-style-type: decimal; margin-bottom: 10pt; }
            .word-preview li { margin-bottom: 3pt; }

            /* Tables */
            .word-preview table {
              border-collapse: collapse;
              width: 100%;
              border: 1px solid #000 !important;
              margin-bottom: 15pt;
            }
            .word-preview th {
              background-color: #e7e6e6;
              border: 1px solid #000 !important;
              padding: 6pt;
              font-weight: bold;
              color: #000000;
            }
            .word-preview td {
              border: 1px solid #000 !important;
              padding: 6pt;
              color: #000000;
            }

            /* Custom Code Blocks */
            .word-preview .code-wrapper {
              margin-bottom: 12pt;
              margin-top: 10pt;
            }
            .word-preview .code-label {
              font-family: 'Calibri', sans-serif; 
              font-size: 8pt; 
              color: #555; 
              font-weight: bold; 
              text-transform: uppercase; 
              background: #e0e0e0; 
              padding: 2pt 6pt; 
              border: 1px solid #a6a6a6; 
              border-bottom: none; 
              display: inline-block; 
              border-radius: 4px 4px 0 0;
            }
            .word-preview pre {
              background-color: #f8f8f8 !important;
              color: #000000 !important;
              border: 1px solid #a6a6a6;
              padding: 8pt;
              font-family: 'Consolas', monospace;
              font-size: 10pt;
              white-space: pre-wrap;
              border-radius: 4px;
              margin-top: 10pt;
            }
            .word-preview pre.has-label {
              margin-top: 0;
              border-top-left-radius: 0;
            }
            .word-preview code {
              color: #000000 !important;
              font-family: 'Consolas', monospace;
              background: transparent;
            }
            .word-preview blockquote {
              border-left: 4px solid #5b9bd5;
              padding-left: 10pt;
              color: #404040;
              font-style: italic;
              margin-left: 0;
            }
          `}</style>
          <div 
            ref={contentRef}
            className="word-preview"
          />
        </div>
      </div>
    </div>
  );
};
