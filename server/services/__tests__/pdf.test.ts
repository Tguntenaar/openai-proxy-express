import { describe, it, expect } from 'vitest';
import { DocumentService } from '../pdf';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

describe('DocumentService', () => {
  const service = new DocumentService();

  it('should create a PDF document from markdown text', () => {
    const markdown = '# Test Document\n\nThis is a test paragraph.\n\n## Section 1\n\n* List item 1\n* List item 2\n\n```\ncode block\n```';
    const result = service.generatePDF(markdown);

    expect(result).toBeInstanceOf(PDFDocument);
    expect(result.pipe).toBeInstanceOf(Function);
  });

  it('should handle all markdown elements correctly', () => {
    const markdown = `
# Heading 1
## Heading 2
### Heading 3

Normal paragraph text.

* List item 1
* List item 2
  * Nested item

\`\`\`
const code = 'test';
\`\`\`

---

**Bold text** and *italic text*
    `;

    const result = service.generatePDF(markdown);
    expect(result).toBeInstanceOf(PDFDocument);
  });

  it('should handle empty markdown input', () => {
    const markdown = '';
    const result = service.generatePDF(markdown);
    expect(result).toBeInstanceOf(PDFDocument);
  });

  it('should create a readable stream', () => {
    const markdown = '# Test';
    const result = service.generatePDF(markdown);
    
    expect(result instanceof PDFDocument).toBe(true);
    expect(result.pipe).toBeInstanceOf(Function);
    
    // Test if it's a readable stream
    const stream = result as unknown as Readable;
    expect(stream.readable).toBe(true);
  });

  it('should handle large markdown documents', () => {
    // Create a large markdown document
    const sections = Array(50).fill(0).map((_, i) => 
      `# Section ${i + 1}\n\nThis is paragraph ${i + 1}\n\n* Item ${i + 1}.1\n* Item ${i + 1}.2\n`
    );
    
    const markdown = sections.join('\n');
    const result = service.generatePDF(markdown);
    
    expect(result).toBeInstanceOf(PDFDocument);
  });

  it('should handle special characters', () => {
    const markdown = `
# Special Characters Test
    
Text with special characters: áéíóú ñ & < > " '
    
* List with symbols: © ® ™ € £ ¥
* Unicode: 你好 안녕하세요
    `;
    
    const result = service.generatePDF(markdown);
    expect(result).toBeInstanceOf(PDFDocument);
  });
}); 