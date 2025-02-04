import PDFDocument from 'pdfkit';
import { marked } from 'marked';
import type { Token, Tokens } from 'marked';
import { PassThrough } from 'stream';

export class DocumentService {
  /**
   * Generates a PDF document from markdown text
   * @param markdownText The markdown text to convert to PDF
   * @returns A readable stream of the PDF document
   */
  public generatePDF(markdownText: string): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      autoFirstPage: true,
      bufferPages: true
    });

    // Create a write stream to capture any errors
    const stream = new PassThrough();
    doc.pipe(stream);

    // Parse markdown to HTML tokens
    const tokens = marked.lexer(markdownText);
    
    let currentY = doc.y;
    const pageHeight = doc.page.height - doc.page.margins.bottom;

    // Process each token and render to PDF
    tokens.forEach((token: Token) => {
      // Check if we need a new page
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }

      switch (token.type) {
        case 'heading': {
          const headingToken = token as Tokens.Heading;
          const fontSize = this.getFontSizeForHeading(headingToken.depth);
          doc.fontSize(fontSize);
          doc.font('Helvetica-Bold')
             .text(headingToken.text)
             .moveDown(0.5);
          doc.font('Helvetica'); // Reset font
          break;
        }

        case 'paragraph': {
          const paragraphToken = token as Tokens.Paragraph;
          doc.fontSize(12)
             .text(paragraphToken.text, {
               width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
               align: 'left'
             })
             .moveDown(0.5);
          break;
        }

        case 'list': {
          const listToken = token as Tokens.List;
          listToken.items.forEach((item: Tokens.ListItem) => {
            doc.fontSize(12)
               .text('• ' + item.text, {
                 indent: 20,
                 width: doc.page.width - doc.page.margins.left - doc.page.margins.right - 20
               })
               .moveDown(0.2);
          });
          doc.moveDown(0.5);
          break;
        }

        case 'code': {
          const codeToken = token as Tokens.Code;
          doc.fontSize(11)
             .font('Courier')
             .text(codeToken.text, {
               width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
               align: 'left'
             })
             .moveDown(0.5);
          doc.font('Helvetica'); // Reset font
          break;
        }

        case 'hr':
          doc.moveTo(doc.page.margins.left, currentY)
             .lineTo(doc.page.width - doc.page.margins.right, currentY)
             .stroke()
             .moveDown(1);
          break;
      }

      currentY = doc.y;
    });

    // Finalize the PDF
    doc.flushPages();
    doc.end();

    return doc;
  }

  private getFontSizeForHeading(depth: number): number {
    switch (depth) {
      case 1: return 24;
      case 2: return 20;
      case 3: return 16;
      case 4: return 14;
      case 5: return 12;
      case 6: return 11;
      default: return 12;
    }
  }
}
