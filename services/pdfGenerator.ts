import jsPDF from 'jspdf';
import type { ResumeData } from '../types';
import { Template } from '../types';

class PdfBuilder {
    doc: jsPDF;
    y: number;
    pageHeight: number;
    pageWidth: number;
    margin: number;
    contentWidth: number;
    baseFontSize: number;
    lineHeight: number;

    constructor(doc: jsPDF) {
        this.doc = doc;
        this.margin = 40;
        this.pageHeight = doc.internal.pageSize.getHeight();
        this.pageWidth = doc.internal.pageSize.getWidth();
        this.contentWidth = this.pageWidth - this.margin * 2;
        this.baseFontSize = 10;
        this.lineHeight = 1.4;
        this.y = this.margin;
    }

    checkPageBreak(heightNeeded: number) {
        if (this.y + heightNeeded > this.pageHeight - this.margin) {
            this.doc.addPage();
            this.y = this.margin;
        }
    }
}

// --- TEMPLATE: PROFESSIONAL (Shrishti Rawat style) ---
const generateProfessionalPdf = (builder: PdfBuilder, data: ResumeData) => {
    const { doc, pageWidth, margin, baseFontSize, lineHeight, contentWidth } = builder;
    let { y } = builder;

    // Header
    doc.setFont('helvetica', 'bold').setFontSize(26).setTextColor('#000000');
    doc.text(data.personalInfo.name.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 28;

    doc.setFont('helvetica', 'normal').setFontSize(baseFontSize);
    const contactInfo = [data.personalInfo.location, data.personalInfo.phone, data.personalInfo.email].filter(Boolean).join(' | ');
    const linksInfo = [data.personalInfo.linkedin, data.personalInfo.github].filter(Boolean).map(link => link.replace(/https?:\/\//, '').replace(/\/$/, ''));
    doc.text(contactInfo, pageWidth / 2, y, { align: 'center' });
    y += baseFontSize * lineHeight;
    if (linksInfo.length > 0) {
        const fullLinksString = linksInfo.join(' | ');
        let currentX = (pageWidth - doc.getTextWidth(fullLinksString)) / 2;
        linksInfo.forEach((link, index) => {
            const url = link.startsWith('http') ? link : `https://${link}`;
            doc.setTextColor(0, 0, 238).textWithLink(link, currentX, y, { url });
            currentX += doc.getTextWidth(link);
            if (index < linksInfo.length - 1) {
                doc.setTextColor('#000000').text(' | ', currentX, y);
                currentX += doc.getTextWidth(' | ');
            }
        });
        y += baseFontSize * lineHeight;
    }
    doc.setTextColor('#000000');

    const renderSection = (title: string, contentFn: () => void, isHidden?: boolean) => {
        if (isHidden) return;
        builder.y = y;
        builder.checkPageBreak(40);
        y = builder.y;
        y += 15;
        doc.setFont('helvetica', 'bold').setFontSize(12);
        doc.text(title.toUpperCase(), margin, y);
        y += 5;
        doc.setLineWidth(1).line(margin, y, pageWidth - margin, y);
        y += 15;
        doc.setFont('helvetica', 'normal').setFontSize(baseFontSize);
        contentFn();
    };

    // Sections
    renderSection('Summary', () => {
        const summaryLines = doc.splitTextToSize(data.summary, contentWidth);
        const height = summaryLines.length * (baseFontSize * lineHeight);
        builder.y = y; builder.checkPageBreak(height); y = builder.y;
        doc.text(summaryLines, margin, y, { lineHeightFactor: lineHeight });
        y += height;
    }, data.hiddenSections?.includes('summary'));

    renderSection('Education', () => {
        data.education?.forEach(edu => {
            builder.y = y; builder.checkPageBreak(40); y = builder.y;
            doc.setFont('helvetica', 'bold').text(edu.institution, margin, y);
            doc.setFont('helvetica', 'normal').text(edu.graduationDate, pageWidth - margin, y, { align: 'right' });
            y += baseFontSize * lineHeight;
            let degreeText = edu.degree;
            if(edu.cgpa) degreeText += ` | (CGPA: ${edu.cgpa})`;
            doc.text(degreeText, margin, y);
            doc.text(edu.location, pageWidth - margin, y, { align: 'right' });
            y += baseFontSize * lineHeight * 1.5;
        });
    }, !data.education?.length || data.hiddenSections?.includes('education'));

    renderSection('Skills', () => {
        const skillsText = data.skills?.join(' | ');
        const lines = doc.splitTextToSize(skillsText || '', contentWidth);
        const height = lines.length * (baseFontSize * lineHeight);
        builder.y = y; builder.checkPageBreak(height); y = builder.y;
        doc.text(lines, margin, y, { lineHeightFactor: lineHeight });
        y += height;
    }, !data.skills?.length || data.hiddenSections?.includes('skills'));
    
    const renderProjectOrExperience = (item: any, isProject: boolean) => {
        const estHeight = (item.description.length * baseFontSize * lineHeight) + 40;
        builder.y = y; builder.checkPageBreak(estHeight); y = builder.y;

        doc.setFont('helvetica', 'bold').text(isProject ? item.name : item.company, margin, y);
        doc.setFont('helvetica', 'normal');
        const rightText = isProject ? item.date : `${item.startDate} – ${item.endDate}`;
        if(rightText) doc.text(rightText, pageWidth - margin, y, { align: 'right' });
        y += baseFontSize * lineHeight;

        const roleText = isProject ? item.role : item.role;
        doc.setFont('helvetica', 'italic').text(roleText, margin, y);
        if(!isProject) {
            doc.setFont('helvetica', 'normal').text(item.location, pageWidth - margin, y, { align: 'right' });
        }
        y += baseFontSize * lineHeight;

        item.description.forEach((desc: string) => {
            const descLines = doc.splitTextToSize(desc, contentWidth - 15);
            builder.y = y; builder.checkPageBreak(descLines.length * baseFontSize * lineHeight); y = builder.y;
            doc.text('•', margin + 5, y + 2, { baseline: 'top' });
            doc.text(descLines, margin + 15, y, { lineHeightFactor: lineHeight });
            y += descLines.length * (baseFontSize * lineHeight);
        });
        y += baseFontSize;
    };

    renderSection('Experience', () => data.experience?.forEach(exp => renderProjectOrExperience(exp, false)), !data.experience?.length || data.hiddenSections?.includes('experience'));
    renderSection('Projects', () => data.projects?.forEach(proj => renderProjectOrExperience(proj, true)), !data.projects?.length || data.hiddenSections?.includes('projects'));
};

// --- TEMPLATE: MODERN ---
const generateModernPdf = (builder: PdfBuilder, data: ResumeData) => {
    const { doc, pageWidth, margin, baseFontSize, lineHeight, contentWidth } = builder;
    let { y } = builder;
    const indigoColor = '#4f46e5';

    // Header
    doc.setFont('helvetica', 'bold').setFontSize(28).setTextColor('#111827');
    doc.text(data.personalInfo.name, pageWidth / 2, y, { align: 'center' });
    y += 30;

    doc.setFont('helvetica', 'normal').setFontSize(9);
    const contactInfo = [data.personalInfo.location, data.personalInfo.phone, data.personalInfo.email, data.personalInfo.linkedin, data.personalInfo.github].filter(Boolean);
    const fullLinksString = contactInfo.join('  •  ');
    let currentX = (pageWidth - doc.getTextWidth(fullLinksString)) / 2;
    contactInfo.forEach((info, index) => {
        const isLink = info.includes('@') || info.includes('.');
        if(isLink) doc.setTextColor(indigoColor);
        else doc.setTextColor('#4b5563');

        doc.text(info, currentX, y);
        currentX += doc.getTextWidth(info);
        if (index < contactInfo.length - 1) {
            doc.setTextColor('#d1d5db').text('  •  ', currentX, y);
            currentX += doc.getTextWidth('  •  ');
        }
    });
    y += baseFontSize * lineHeight * 2;
    doc.setTextColor('#000000');

    const renderSection = (title: string, contentFn: () => void, isHidden?: boolean) => {
        if (isHidden) return;
        builder.y = y; builder.checkPageBreak(40); y = builder.y;
        doc.setFont('helvetica', 'bold').setFontSize(10).setTextColor(indigoColor);
        doc.text(title.toUpperCase(), margin, y, { charSpace: 1 });
        y += 10;
        doc.setDrawColor('#c7d2fe').setLineWidth(1.5).line(margin, y, pageWidth - margin, y);
        y += 15;
        doc.setFont('helvetica', 'normal').setFontSize(baseFontSize).setTextColor('#374151');
        contentFn();
        y += 15;
    };

    renderSection('Summary', () => {
        const lines = doc.splitTextToSize(data.summary, contentWidth);
        const height = lines.length * (baseFontSize * lineHeight);
        builder.y = y; builder.checkPageBreak(height); y = builder.y;
        doc.text(lines, margin, y, { lineHeightFactor: lineHeight });
        y += height;
    }, data.hiddenSections?.includes('summary'));

    renderSection('Skills', () => {
        const skillsText = data.skills?.join('  •  ');
        const lines = doc.splitTextToSize(skillsText || '', contentWidth);
        const height = lines.length * (baseFontSize * lineHeight);
        builder.y = y; builder.checkPageBreak(height); y = builder.y;
        doc.text(lines, margin, y, { lineHeightFactor: lineHeight });
        y += height;
    }, !data.skills?.length || data.hiddenSections?.includes('skills'));

    const renderProjectOrExperience = (item: any, isProject: boolean) => {
        const estHeight = (item.description.length * baseFontSize * lineHeight) + 40;
        builder.y = y; builder.checkPageBreak(estHeight); y = builder.y;

        doc.setFont('helvetica', 'bold').setFontSize(baseFontSize).setTextColor('#111827').text(item.role || item.name, margin, y);
        const rightText = isProject ? item.date : `${item.startDate} - ${item.endDate}`;
        if(rightText) doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor('#6b7280').text(rightText, pageWidth - margin, y, { align: 'right' });
        y += baseFontSize * lineHeight;
        
        const companyText = isProject ? item.technologies.join(', ') : item.company;
        doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor('#4b5563').text(companyText, margin, y);
        if(!isProject && item.location) doc.text(item.location, pageWidth - margin, y, { align: 'right' });
        y += baseFontSize * lineHeight * 1.2;

        item.description.forEach((desc: string) => {
            const descLines = doc.splitTextToSize(desc, contentWidth - 15);
            builder.y = y; builder.checkPageBreak(descLines.length * baseFontSize * lineHeight); y = builder.y;
            doc.setTextColor(indigoColor).text('•', margin + 5, y + 2);
            doc.setTextColor('#374151').text(descLines, margin + 15, y, { lineHeightFactor: lineHeight });
            y += descLines.length * (baseFontSize * lineHeight);
        });
        y += baseFontSize;
    };

    renderSection('Experience', () => data.experience?.forEach(exp => renderProjectOrExperience(exp, false)), !data.experience?.length || data.hiddenSections?.includes('experience'));
    renderSection('Projects', () => data.projects?.forEach(proj => renderProjectOrExperience(proj, true)), !data.projects?.length || data.hiddenSections?.includes('projects'));

    renderSection('Education', () => {
        data.education?.forEach(edu => {
            builder.y = y; builder.checkPageBreak(30); y = builder.y;
            doc.setFont('helvetica', 'bold').setTextColor('#111827').text(edu.institution, margin, y);
            doc.setFont('helvetica', 'normal').setTextColor('#6b7280').setFontSize(9).text(edu.graduationDate, pageWidth - margin, y, { align: 'right' });
            y += baseFontSize * lineHeight;
            doc.setTextColor('#4b5563').text(edu.degree, margin, y);
            y += baseFontSize * lineHeight;
        });
    }, !data.education?.length || data.hiddenSections?.includes('education'));
};

// --- TEMPLATE: SERIF ---
const generateSerifPdf = (builder: PdfBuilder, data: ResumeData) => {
    const { doc, pageWidth, margin, baseFontSize, lineHeight, contentWidth } = builder;
    let { y } = builder;

    doc.setFont('times', 'bold').setFontSize(24).setTextColor('#000000');
    doc.text(data.personalInfo.name, pageWidth / 2, y, { align: 'center' });
    y += 26;

    doc.setFont('times', 'normal').setFontSize(9);
    const contactInfo = [data.personalInfo.location, data.personalInfo.phone, data.personalInfo.email, data.personalInfo.linkedin].filter(Boolean);
    doc.text(contactInfo.join(' | '), pageWidth / 2, y, { align: 'center' });
    y += baseFontSize * lineHeight * 2;

    const renderSection = (title: string, contentFn: () => void, isHidden?: boolean) => {
        if (isHidden) return;
        builder.y = y; builder.checkPageBreak(40); y = builder.y;
        doc.setFont('times', 'bold').setFontSize(12);
        doc.text(title.toUpperCase(), margin, y, { charSpace: 1 });
        y += 10;
        doc.setDrawColor('#888888').setLineWidth(0.5).line(margin, y, pageWidth - margin, y);
        y += 15;
        doc.setFont('times', 'normal').setFontSize(baseFontSize).setTextColor('#333333');
        contentFn();
        y += 15;
    };

    renderSection('Summary', () => {
        const lines = doc.splitTextToSize(data.summary, contentWidth);
        const height = lines.length * (baseFontSize * lineHeight);
        builder.y = y; builder.checkPageBreak(height); y = builder.y;
        doc.text(lines, margin, y, { lineHeightFactor: lineHeight });
        y += height;
    }, data.hiddenSections?.includes('summary'));

    const renderProjectOrExperience = (item: any, isProject: boolean) => {
        const estHeight = (item.description.length * baseFontSize * lineHeight) + 40;
        builder.y = y; builder.checkPageBreak(estHeight); y = builder.y;

        doc.setFont('times', 'bold').text(isProject ? item.name : item.role, margin, y);
        const rightText = isProject ? item.date : `${item.startDate} - ${item.endDate}`;
        if (rightText) doc.setFont('times', 'normal').text(rightText, pageWidth - margin, y, { align: 'right' });
        y += baseFontSize * lineHeight;
        
        doc.setFont('times', 'italic').text(isProject ? item.technologies.join(', ') : `${item.company}, ${item.location}`, margin, y);
        y += baseFontSize * lineHeight * 1.2;

        item.description.forEach((desc: string) => {
            const descLines = doc.splitTextToSize(desc, contentWidth - 15);
            builder.y = y; builder.checkPageBreak(descLines.length * baseFontSize * lineHeight); y = builder.y;
            doc.text('•', margin + 5, y + 2);
            doc.text(descLines, margin + 15, y, { lineHeightFactor: lineHeight });
            y += descLines.length * (baseFontSize * lineHeight);
        });
        y += baseFontSize;
    };

    renderSection('Experience', () => data.experience?.forEach(exp => renderProjectOrExperience(exp, false)), !data.experience?.length || data.hiddenSections?.includes('experience'));
    renderSection('Projects', () => data.projects?.forEach(proj => renderProjectOrExperience(proj, true)), !data.projects?.length || data.hiddenSections?.includes('projects'));
    
    renderSection('Education', () => {
        data.education?.forEach(edu => {
            builder.y = y; builder.checkPageBreak(30); y = builder.y;
            doc.setFont('times', 'bold').text(edu.institution, margin, y);
            doc.setFont('times', 'normal').text(edu.graduationDate, pageWidth - margin, y, { align: 'right' });
            y += baseFontSize * lineHeight;
            doc.setFont('times', 'italic').text(edu.degree, margin, y);
            y += baseFontSize * lineHeight;
        });
    }, !data.education?.length || data.hiddenSections?.includes('education'));

    renderSection('Skills', () => {
        const skillsText = data.skills?.join(', ');
        const lines = doc.splitTextToSize(skillsText || '', contentWidth);
        const height = lines.length * (baseFontSize * lineHeight);
        builder.y = y; builder.checkPageBreak(height); y = builder.y;
        doc.text(lines, margin, y, { lineHeightFactor: lineHeight });
        y += height;
    }, !data.skills?.length || data.hiddenSections?.includes('skills'));
};

// --- TEMPLATE: CLASSIC ---
const generateClassicPdf = (builder: PdfBuilder, data: ResumeData) => {
    const { doc, pageWidth, margin, baseFontSize, lineHeight, contentWidth } = builder;
    let { y } = builder;

    doc.setFont('helvetica', 'bold').setFontSize(22).setTextColor('#000000');
    doc.text(data.personalInfo.name.toUpperCase(), pageWidth / 2, y, { align: 'center' });
    y += 24;

    doc.setFont('helvetica', 'normal').setFontSize(9);
    const contactInfo = [data.personalInfo.location, data.personalInfo.phone, data.personalInfo.email, data.personalInfo.linkedin].filter(Boolean);
    doc.text(contactInfo.join(' | '), pageWidth / 2, y, { align: 'center' });
    y += baseFontSize * lineHeight * 2;

    const renderSection = (title: string, contentFn: () => void, isHidden?: boolean) => {
        if (isHidden) return;
        builder.y = y; builder.checkPageBreak(30); y = builder.y;
        doc.setFont('helvetica', 'bold').setFontSize(11);
        doc.text(title.toUpperCase(), margin, y);
        y += 8;
        doc.setDrawColor(0,0,0).setLineWidth(1).line(margin, y, pageWidth - margin, y);
        y += 12;
        doc.setFont('helvetica', 'normal').setFontSize(baseFontSize).setTextColor('#333333');
        contentFn();
        y += 12;
    };

    renderSection('Summary', () => {
        const lines = doc.splitTextToSize(data.summary, contentWidth);
        const height = lines.length * (baseFontSize * lineHeight);
        builder.y = y; builder.checkPageBreak(height); y = builder.y;
        doc.text(lines, margin, y, { lineHeightFactor: 1.5 });
        y += height;
    }, data.hiddenSections?.includes('summary'));

    const renderProjectOrExperience = (item: any, isProject: boolean) => {
        const estHeight = (item.description.length * baseFontSize * lineHeight) + 35;
        builder.y = y; builder.checkPageBreak(estHeight); y = builder.y;

        doc.setFont('helvetica', 'bold').text(isProject ? item.name : item.company, margin, y);
        if(!isProject) doc.setFont('helvetica', 'normal').text(item.location, pageWidth - margin, y, { align: 'right' });
        y += baseFontSize * lineHeight;
        
        doc.setFont('helvetica', 'italic').text(isProject ? item.technologies.join(', ') : item.role, margin, y);
        const rightText = isProject ? item.date : `${item.startDate} - ${item.endDate}`;
        if (rightText) doc.text(rightText, pageWidth - margin, y, { align: 'right' });
        y += baseFontSize * lineHeight * 1.2;

        item.description.forEach((desc: string) => {
            const descLines = doc.splitTextToSize(desc, contentWidth - 15);
            builder.y = y; builder.checkPageBreak(descLines.length * baseFontSize * lineHeight); y = builder.y;
            doc.text('•', margin + 5, y + 2);
            doc.text(descLines, margin + 15, y, { lineHeightFactor: lineHeight });
            y += descLines.length * (baseFontSize * lineHeight);
        });
        y += baseFontSize;
    };
    
    renderSection('Experience', () => data.experience?.forEach(exp => renderProjectOrExperience(exp, false)), !data.experience?.length || data.hiddenSections?.includes('experience'));
    renderSection('Projects', () => data.projects?.forEach(proj => renderProjectOrExperience(proj, true)), !data.projects?.length || data.hiddenSections?.includes('projects'));

    renderSection('Education', () => {
        data.education?.forEach(edu => {
            builder.y = y; builder.checkPageBreak(30); y = builder.y;
            doc.setFont('helvetica', 'bold').text(edu.institution, margin, y);
            doc.setFont('helvetica', 'normal').text(edu.graduationDate, pageWidth - margin, y, { align: 'right' });
            y += baseFontSize * lineHeight;
            doc.text(edu.degree, margin, y);
            y += baseFontSize * lineHeight;
        });
    }, !data.education?.length || data.hiddenSections?.includes('education'));

     renderSection('Skills', () => {
        const skillsText = data.skills?.join('  •  ');
        const lines = doc.splitTextToSize(skillsText || '', contentWidth);
        const height = lines.length * (baseFontSize * lineHeight);
        builder.y = y; builder.checkPageBreak(height); y = builder.y;
        doc.text(lines, margin, y, { lineHeightFactor: lineHeight });
        y += height;
    }, !data.skills?.length || data.hiddenSections?.includes('skills'));
};


// --- MAIN EXPORT ---
export const generatePdf = async (resumeData: ResumeData, template: Template): Promise<jsPDF> => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
    });
    const builder = new PdfBuilder(doc);

    switch (template) {
        case Template.MODERN:
            generateModernPdf(builder, resumeData);
            break;
        case Template.CLASSIC:
            generateClassicPdf(builder, resumeData);
            break;
        case Template.SERIF:
            generateSerifPdf(builder, resumeData);
            break;
        case Template.PROFESSIONAL:
        default:
            generateProfessionalPdf(builder, resumeData);
            break;
    }

    return doc;
};