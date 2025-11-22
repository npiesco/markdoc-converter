import { marked } from 'marked';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ExternalHyperlink,
  ImageRun,
} from 'docx';

/**
 * Parse markdown and convert to DOCX paragraphs
 */
const markdownToDocx = async (markdown: string): Promise<Paragraph[]> => {
  const paragraphs: Paragraph[] = [];
  
  // Parse markdown tokens
  const tokens = marked.lexer(markdown);
  
  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        const headingLevels: { [key: number]: HeadingLevel } = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5,
          6: HeadingLevel.HEADING_6,
        };
        paragraphs.push(
          new Paragraph({
            text: token.text,
            heading: headingLevels[token.depth] || HeadingLevel.HEADING_1,
          })
        );
        break;

      case 'paragraph':
        const runs = parseInlineTokens(token.tokens || []);
        if (runs.length > 0) {
          paragraphs.push(new Paragraph({ children: runs }));
        }
        break;

      case 'code':
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: token.text,
                font: 'Consolas',
                size: 20,
              }),
            ],
            style: 'Code',
          })
        );
        break;

      case 'blockquote':
        const quoteText = typeof token.text === 'string' ? token.text : '';
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: quoteText,
                italics: true,
              }),
            ],
            style: 'Quote',
          })
        );
        break;

      case 'list':
        if (token.items) {
          for (const item of token.items) {
            const itemRuns = parseInlineTokens(item.tokens || []);
            paragraphs.push(
              new Paragraph({
                children: itemRuns,
                bullet: token.ordered ? undefined : { level: 0 },
              })
            );
          }
        }
        break;

      case 'table':
        // Create table - Tables go directly in paragraphs array, not inside Paragraph
        if (token.header && token.rows) {
          const headerCells = token.header.map(
            (cell: any) =>
              new TableCell({
                children: [new Paragraph({ children: parseInlineTokens(cell.tokens || []) })],
              })
          );

          const headerRow = new TableRow({ children: headerCells });

          const bodyRows = token.rows.map(
            (row: any) =>
              new TableRow({
                children: row.map(
                  (cell: any) =>
                    new TableCell({
                      children: [new Paragraph({ children: parseInlineTokens(cell.tokens || []) })],
                    })
                ),
              })
          );

          // @ts-ignore - Table is a valid section child
          paragraphs.push(
            new Table({
              rows: [headerRow, ...bodyRows],
              width: { size: 100, type: WidthType.PERCENTAGE },
            })
          );
        }
        break;

      case 'space':
        // Add blank line
        paragraphs.push(new Paragraph({ text: '' }));
        break;

      case 'hr':
        paragraphs.push(
          new Paragraph({
            text: '_______________________________________________',
            alignment: AlignmentType.CENTER,
          })
        );
        break;

      default:
        // Handle any unrecognized token types as plain text
        if ('text' in token) {
          paragraphs.push(new Paragraph({ text: String(token.text) }));
        }
        break;
    }
  }

  return paragraphs;
};

/**
 * Parse inline markdown tokens (bold, italic, links, etc.)
 */
const parseInlineTokens = (tokens: any[]): (TextRun | ExternalHyperlink)[] => {
  const runs: (TextRun | ExternalHyperlink)[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
        runs.push(
          new TextRun({
            text: token.text,
          })
        );
        break;

      case 'strong':
        runs.push(
          new TextRun({
            text: token.text,
            bold: true,
          })
        );
        break;

      case 'em':
        runs.push(
          new TextRun({
            text: token.text,
            italics: true,
          })
        );
        break;

      case 'codespan':
        runs.push(
          new TextRun({
            text: token.text,
            font: 'Consolas',
          })
        );
        break;

      case 'link':
        runs.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: token.text,
                style: 'Hyperlink',
                color: '0563C1',
                underline: {},
              }),
            ],
            link: token.href,
          })
        );
        break;

      case 'image':
        // Note: Images from URLs won't work in Word without downloading them
        // For now, we'll just show the alt text
        runs.push(
          new TextRun({
            text: `[Image: ${token.text || token.href}]`,
            italics: true,
            color: '666666',
          })
        );
        break;

      case 'br':
        runs.push(new TextRun({ text: '', break: 1 }));
        break;

      default:
        if ('text' in token) {
          runs.push(new TextRun({ text: String(token.text) }));
        }
        break;
    }
  }

  return runs;
};

/**
 * Export markdown content to a Word document
 */
export const exportToWord = async (markdown: string, fileName: string) => {
  try {
    // Convert markdown to DOCX paragraphs
    const paragraphs = await markdownToDocx(markdown);

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs,
        },
      ],
    });

    // Generate and download
    const blob = await Packer.toBlob(doc);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to Word:', error);
    alert('Failed to export document. Please try again.');
  }
};
