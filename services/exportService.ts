import { BookData } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import ReactMarkdown from 'react-markdown';
import React from 'react';
import ReactDOM from 'react-dom/client';

const createFileName = (title: string, extension: string): string => {
  const sanitizedTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const date = new Date().toISOString().split('T')[0];
  return `${sanitizedTitle || 'book'}_${date}.${extension}`;
};

const createPdf = async (content: string, bookData: BookData, coverImage: string | null): Promise<Blob> => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4',
    });

    // A4 dimensions in pixels at 72 DPI are approx 595x842. We'll use this as our base.
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // 1. Add Cover Page
    doc.setFillColor('#FDF6E3');
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    if (coverImage) {
        try {
            const img = new Image();
            img.src = coverImage;
            await new Promise(resolve => { img.onload = resolve; });
            const imgWidth = contentWidth * 0.7;
            const imgHeight = (img.height * imgWidth) / img.width;
            const x = (pageWidth - imgWidth) / 2;
            const y = pageHeight * 0.2;
            doc.addImage(img, 'PNG', x, y, imgWidth, imgHeight);
        } catch(e) { console.error("Could not add cover image to PDF", e); }
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor('#073B4C');
    doc.text(bookData.title, pageWidth / 2, pageHeight * 0.6, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('Helvetica', 'normal');
    if (bookData.finalDetails.author) {
        doc.text(bookData.finalDetails.author, pageWidth / 2, pageHeight * 0.65, { align: 'center' });
    }
    doc.addPage();


    // 2. Render Markdown to HTML for content pages
    const container = document.createElement('div');
    container.style.width = `${contentWidth}px`;
    container.style.fontFamily = 'Inter, sans-serif';
    container.style.color = '#073B4C';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.6';
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(ReactMarkdown, { children: content }));

    // Allow images to load
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const canvas = await html2canvas(container, { scale: 2 });
    document.body.removeChild(container);
    root.unmount();


    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    const pdfImgWidth = contentWidth;
    const pdfImgHeight = (imgHeight * pdfImgWidth) / imgWidth;

    let heightLeft = pdfImgHeight;
    let position = 0;

    // 3. Add content pages from canvas
    while (heightLeft > 0) {
        doc.addImage(imgData, 'PNG', margin, position === 0 ? margin : -pageHeight * (position / pdfImgHeight) + margin, pdfImgWidth, pdfImgHeight);
        heightLeft -= (pageHeight - margin * 2);
        if (heightLeft > 0) {
            doc.addPage();
            position += (pageHeight - margin * 2);
        }
    }

    return doc.output('blob');
};

export const exportAsZip = async (content: string, bookData: BookData, coverImage: string | null): Promise<void> => {
    const zip = new JSZip();

    // 1. Add TXT file
    zip.file(createFileName(bookData.title, 'txt'), content);

    // 2. Add metadata
    const metadata = {
        title: bookData.title,
        author: bookData.finalDetails.author,
        language: bookData.language,
        plan: bookData.plan,
        chapters: bookData.structure.split('\n').filter(Boolean).length,
        date: new Date().toISOString(),
        type: bookData.type
    };
    zip.file('metadata.json', JSON.stringify(metadata, null, 2));
    
    // 3. Add PDF
    try {
        const pdfBlob = await createPdf(content, bookData, coverImage);
        zip.file(createFileName(bookData.title, 'pdf'), pdfBlob);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        // Add a simple error file to the zip if PDF generation fails
        zip.file('PDF_GENERATION_ERROR.txt', `Could not generate PDF. Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 4. Generate and download zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = createFileName(bookData.title, 'zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// Old export functions remain for potential direct use, but are now secondary
export const exportAsTxt = (title: string, content: string): void => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = createFileName(title, 'txt');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
