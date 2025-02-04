import PDFDocument from 'pdfkit';
import { Document, Paragraph, TextRun, Packer, HeadingLevel } from 'docx';

export class DocumentService {
  /**
   * Generates a PDF document for the resume
   * @returns A readable stream of the PDF document
   */
  public generatePDF(text: string): PDFKit.PDFDocument {
    const doc = new PDFDocument({ margin: 50 });

    // Header (Name and Contact Info)
    doc.fontSize(18).text('STUDENT NAME', { align: 'center', underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text('134 Street Name, City, State 12345', { align: 'center' });
    doc.text('youremail@gmail.com | 123-456-7890', { align: 'center' });

    doc.moveDown(1);

    // Sections
    this.addPDFSection(doc, 'Education', [
      'High School Name, location of school\nExpected Date of Graduation',
      'GPA:\nClass Rank or ACT/SAT:\nHonors:',
    ]);

    this.addPDFSection(doc, 'Work Experience', [
      'Name of Company/Employer, Your title or job (Date Started - Date Ended)\n• Description of your role and responsibilities',
      'Name of Organization, Your title or position (Date Joined - Date Stopped)\n• Description of your role and what organization is',
    ]);

    this.addPDFSection(doc, 'Leadership Experience', [
      'Name of Organization, Your title or position (Date Joined - Date Stopped)\n• Description of your role and what organization is',
    ]);

    this.addPDFSection(doc, 'Service and Outreach', [
      'Name of Organization, Your title or position (Date Joined - Date Stopped)\n• Description of your role and what organization is',
    ]);

    this.addPDFSection(doc, 'Extracurricular Involvement', [
      'Name of Organization, Your title or position (Date Joined - Date Stopped)\n• Description of your role and what organization is',
    ]);

    this.addPDFSection(doc, 'Interests and Skills', [
      '• Fluent in Microsoft Tools',
      '• Skilled in Canva graphic design',
      '• Bilingual in French and English (native French)',
      '• Interested in chocolate chip cookies, traveling to Europe, reading Harry Potter, and paddleboarding',
    ]);

    doc.end();
    return doc;
  }

  /**
   * Adds a section to the PDF
   * @param doc The PDF document
   * @param title The title of the section
   * @param content Array of strings representing section content
   */
  private addPDFSection(doc: PDFKit.PDFDocument, title: string, content: string[]) {
    doc.fontSize(14).text(title, { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12);
    content.forEach((line) => {
      doc.text(line, { indent: 20, lineGap: 5 });
    });

    doc.moveDown(1);
  }

  /**
   * Generates a DOCX document for the resume
   * @returns A Buffer containing the DOCX document
   */
  public async generateDOCX(text: string): Promise<Buffer> {
    const doc = new Document({
      sections: [
        {
          children: [
            ...this.createDocxHeader('STUDENT NAME', '134 Street Name, City, State 12345\nyouremail@gmail.com | 123-456-7890'),

            ...this.createDocxSection('Education', [
              'High School Name, location of school\nExpected Date of Graduation',
              'GPA:\nClass Rank or ACT/SAT:\nHonors:',
            ]),

            ...this.createDocxSection('Work Experience', [
              'Name of Company/Employer, Your title or job (Date Started - Date Ended)\n• Description of your role and responsibilities',
              'Name of Organization, Your title or position (Date Joined - Date Stopped)\n• Description of your role and what organization is',
            ]),

            ...this.createDocxSection('Leadership Experience', [
              'Name of Organization, Your title or position (Date Joined - Date Stopped)\n• Description of your role and what organization is',
            ]),

            ...this.createDocxSection('Service and Outreach', [
              'Name of Organization, Your title or position (Date Joined - Date Stopped)\n• Description of your role and what organization is',
            ]),

            ...this.createDocxSection('Extracurricular Involvement', [
              'Name of Organization, Your title or position (Date Joined - Date Stopped)\n• Description of your role and what organization is',
            ]),

            ...this.createDocxSection('Interests and Skills', [
              '• Fluent in Microsoft Tools',
              '• Skilled in Canva graphic design',
              '• Bilingual in French and English (native French)',
              '• Interested in chocolate chip cookies, traveling to Europe, reading Harry Potter, and paddleboarding',
            ]),
          ],
        },
      ],
    });

    return await Packer.toBuffer(doc);
  }

  /**
   * Creates a header for the DOCX document
   */
  private createDocxHeader(name: string, contact: string): Paragraph[] {
    return [
      new Paragraph({
        text: name,
        heading: HeadingLevel.TITLE,
        alignment: 'center',
      }),
      new Paragraph({
        text: contact,
        alignment: 'center',
      }),
    ];
  }

  /**
   * Creates a section for the DOCX document
   */
  private createDocxSection(title: string, content: string[]): Paragraph[] {
    const section = [
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_1,
      }),
    ];

    content.forEach((line) => {
      section.push(
        new Paragraph({
          text: line,
          bullet: { level: 0 },
        })
      );
    });

    return section;
  }
}
