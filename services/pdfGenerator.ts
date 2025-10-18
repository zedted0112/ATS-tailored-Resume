import type { ResumeData } from '../types';
import { Template } from '../types';

// This file creates a true, text-based PDF from scratch, ensuring it is 
// lightweight, searchable, selectable, and re-parsable by our app.

const FONT_SIZES = {
  h1: 24,
  h2: 12,
  h3: 11,
  body: 10,
  small: 9,
  xsmall: 8,
};

const MARGIN = 40;
let PAGE_WIDTH = 0;
let PAGE_HEIGHT = 0;
let CONTENT_WIDTH = 0;

class PdfBuilder {
  doc: any;
  cursor: number;

  constructor(doc: any) {
    this.doc = doc;
    this.cursor = MARGIN;

    // A4 size in points
    PAGE_WIDTH = this.doc.internal.pageSize.getWidth();
    PAGE_HEIGHT = this.doc.internal.pageSize.getHeight();
    CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
  }

  checkPageBreak(heightNeeded: number) {
    if (this.cursor + heightNeeded > PAGE_HEIGHT - MARGIN) {
      this.doc.addPage();
      this.cursor = MARGIN;
    }
  }

  addSpace(space: number) {
    this.cursor += space;
  }
}

const renderProfessionalTemplate = (builder: PdfBuilder, data: ResumeData) => {
    const { doc } = builder;
    const { personalInfo, summary, experience, education, skills, projects } = data;

    // --- Header ---
    doc.setFont('Helvetica', 'bold').setFontSize(FONT_SIZES.h1);
    doc.text(personalInfo.name, MARGIN, builder.cursor);
    builder.cursor += 20;

    doc.setFont('Helvetica', 'normal').setFontSize(FONT_SIZES.xsmall);
    const contactInfo = [
        personalInfo.location,
        personalInfo.email,
        personalInfo.phone,
        personalInfo.linkedin,
        personalInfo.github
    ].filter(Boolean).join(' | ');
    doc.text(contactInfo, MARGIN, builder.cursor);
    builder.cursor += 25;

    // --- Summary ---
    doc.setFont('Helvetica', 'bold').setFontSize(FONT_SIZES.h2).text('Summary', MARGIN, builder.cursor);
    doc.setDrawColor(200).setLineWidth(0.5).line(MARGIN, builder.cursor + 2, PAGE_WIDTH - MARGIN, builder.cursor + 2);
    builder.cursor += 15;
    doc.setFont('Helvetica', 'normal').setFontSize(FONT_SIZES.body);
    const summaryLines = doc.splitTextToSize(summary, CONTENT_WIDTH);
    doc.text(summaryLines, MARGIN, builder.cursor);
    builder.cursor += summaryLines.length * 12 + 10;

    // --- Skills ---
    builder.checkPageBreak(40);
    doc.setFont('Helvetica', 'bold').setFontSize(FONT_SIZES.h2).text('Skills', MARGIN, builder.cursor);
    doc.setDrawColor(200).setLineWidth(0.5).line(MARGIN, builder.cursor + 2, PAGE_WIDTH - MARGIN, builder.cursor + 2);
    builder.cursor += 15;
    doc.setFont('Helvetica', 'normal').setFontSize(FONT_SIZES.body);
    const skillsText = doc.splitTextToSize((skills || []).join(' | '), CONTENT_WIDTH);
    doc.text(skillsText, MARGIN, builder.cursor);
    builder.cursor += skillsText.length * 12 + 10;
    
    // --- Experience ---
    builder.checkPageBreak(50);
    doc.setFont('Helvetica', 'bold').setFontSize(FONT_SIZES.h2).text('Experience', MARGIN, builder.cursor);
    doc.setDrawColor(200).setLineWidth(0.5).line(MARGIN, builder.cursor + 2, PAGE_WIDTH - MARGIN, builder.cursor + 2);
    builder.cursor += 15;
    
    (experience || []).forEach(exp => {
        const roleText = `${exp.role} at ${exp.company}`;
        const dateText = `${exp.startDate} – ${exp.endDate}`;
        const dateWidth = doc.getTextWidth(dateText);

        builder.checkPageBreak(30 + (exp.description || []).length * 12);
        doc.setFont('Helvetica', 'bold').setFontSize(FONT_SIZES.h3).text(roleText, MARGIN, builder.cursor);
        doc.setFont('Helvetica', 'normal').setFontSize(FONT_SIZES.small).text(dateText, PAGE_WIDTH - MARGIN - dateWidth, builder.cursor);
        builder.cursor += 15;
        
        doc.setFont('Helvetica', 'normal').setFontSize(FONT_SIZES.body);
        (exp.description || []).forEach(desc => {
            const descLines = doc.splitTextToSize(`• ${desc}`, CONTENT_WIDTH - 10);
            doc.text(descLines, MARGIN + 10, builder.cursor);
            builder.cursor += descLines.length * 12;
        });
        builder.cursor += 10;
    });

    // --- Projects ---
    if (projects && projects.length > 0) {
        // Check if there's enough space for the header and at least one line of the first project
        builder.checkPageBreak(50);

        doc.setFont('Helvetica', 'bold').setFontSize(FONT_SIZES.h2).text('Projects', MARGIN, builder.cursor);
        doc.setDrawColor(200).setLineWidth(0.5).line(MARGIN, builder.cursor + 2, PAGE_WIDTH - MARGIN, builder.cursor + 2);
        builder.cursor += 15;
    
        projects.forEach(proj => {
            // Estimate height for the current project block to prevent it from splitting
            let projectHeight = 15; // title
            (proj.description || []).forEach(desc => {
                projectHeight += doc.splitTextToSize(desc, CONTENT_WIDTH - 10).length * 12;
            });
            if (proj.technologies && proj.technologies.length > 0) {
                projectHeight += doc.splitTextToSize(proj.technologies.join(', '), CONTENT_WIDTH - 10).length * 10 + 5;
            }
            projectHeight += 10; // padding

            builder.checkPageBreak(projectHeight);

            // Render Title and Link
            doc.setFont('Helvetica', 'bold').setFontSize(FONT_SIZES.h3).text(proj.name, MARGIN, builder.cursor, { maxWidth: CONTENT_WIDTH * 0.75 });
            if (proj.link) {
                const fullLink = proj.link.startsWith('http') ? proj.link : `https://${proj.link}`;
                const linkWidth = doc.getTextWidth(proj.link);
                doc.setFont('Helvetica', 'normal').setFontSize(FONT_SIZES.small).setTextColor(0, 0, 255);
                doc.textWithLink(proj.link, PAGE_WIDTH - MARGIN - linkWidth, builder.cursor, { url: fullLink });
                doc.setTextColor(0, 0, 0);
            }
            builder.cursor += 15;
            
            // Render Description
            doc.setFont('Helvetica', 'normal').setFontSize(FONT_SIZES.body);
            (proj.description || []).forEach(desc => {
                const descLines = doc.splitTextToSize(`• ${desc}`, CONTENT_WIDTH - 10);
                doc.text(descLines, MARGIN + 10, builder.cursor);
                builder.cursor += descLines.length * 12;
            });
            
            // Render Technologies
            if (proj.technologies && proj.technologies.length > 0) {
                 builder.addSpace(5);
                 const techText = `Technologies: ${proj.technologies.join(', ')}`;
                 const techLines = doc.splitTextToSize(techText, CONTENT_WIDTH - 10);
                 doc.setFont('Helvetica', 'italic').setFontSize(FONT_SIZES.xsmall);
                 doc.text(techLines, MARGIN + 10, builder.cursor);
                 builder.cursor += techLines.length * 10;
            }

            builder.addSpace(10);
        });
    }

    // --- Education ---
    builder.checkPageBreak(50);
    doc.setFont('Helvetica', 'bold').setFontSize(FONT_SIZES.h2).text('Education', MARGIN, builder.cursor);
    doc.setDrawColor(200).setLineWidth(0.5).line(MARGIN, builder.cursor + 2, PAGE_WIDTH - MARGIN, builder.cursor + 2);
    builder.cursor += 15;
    (education || []).forEach(edu => {
        const dateWidth = doc.getTextWidth(edu.graduationDate);
        builder.checkPageBreak(30);
        doc.setFont('Helvetica', 'bold').setFontSize(FONT_SIZES.h3).text(edu.institution, MARGIN, builder.cursor);
        doc.setFont('Helvetica', 'normal').setFontSize(FONT_SIZES.small).text(edu.graduationDate, PAGE_WIDTH - MARGIN - dateWidth, builder.cursor);
        doc.setFont('Helvetica', 'normal').setFontSize(FONT_SIZES.body).text(edu.degree, MARGIN, builder.cursor + 12);
        builder.cursor += 30;
    });
};

export const generatePdf = async (data: ResumeData, template: Template) => {
    const jspdf = (window as any).jspdf;
    if (!jspdf) {
        throw new Error("jsPDF library not loaded.");
    }
    const { jsPDF } = jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const builder = new PdfBuilder(doc);

    // For now, we only implement the professional one as it's the most robust.
    // In a real scenario, we'd have a switch statement and different render functions.
    switch (template) {
        case Template.PROFESSIONAL:
        case Template.CLASSIC: // Fallback to professional
        case Template.MODERN: // Fallback to professional
        case Template.SERIF: // Fallback to professional
        default:
            renderProfessionalTemplate(builder, data);
            break;
    }

    return doc;
};