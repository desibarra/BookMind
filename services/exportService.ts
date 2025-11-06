// Note: All library imports have been removed.
// The app will now rely on the global scripts loaded in index.html (pdf-lib, jszip, file-saver).

declare global {
    interface Window {
        // Using 'any' for simplicity as we are not in a full TypeScript module environment for these libraries.
        pdfLib: any;
        JSZip: any;
        saveAs: (blob: Blob, filename: string) => void;
    }
}

const createPdf = async (title: string, content: string): Promise<Uint8Array> => {
    const { PDFDocument, rgb, StandardFonts } = window.pdfLib;
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage();

    const { width, height } = page.getSize();
    const fontSize = 12;
    const margin = 50;

    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    let y = height - margin;

    const drawText = (text: string, font: any, size: number) => {
        const textHeight = font.heightAtSize(size);

        // FIX: Ensure new pages are correctly handled and used for subsequent drawing.
        if (y < margin + textHeight) {
            page = pdfDoc.addPage();
            y = height - margin;
        }
        
        page.drawText(text, {
            x: margin,
            y,
            font,
            size,
            color: rgb(0.18, 0.23, 0.35),
        });
        y -= textHeight + 5;
    };
    
    drawText(title, timesRomanBoldFont, 24);
    y -= 20;

    content.split('\n').forEach(line => {
        if (line.startsWith('#')) {
            // FIX: Correctly determine header level and text.
            const level = line.match(/#/g)?.length || 1;
            const headerText = line.substring(level).trim();
            // Use a better font size calculation for headers.
            drawText(headerText, timesRomanBoldFont, 26 - level * 4);
        } else if(line.trim() !== '') {
            // Basic word wrap
            let currentLine = '';
            const words = line.split(' ');
            for (const word of words) {
                const testLine = currentLine.length > 0 ? `${currentLine} ${word}` : word;
                if (timesRomanFont.widthOfTextAtSize(testLine, fontSize) < width - margin * 2) {
                    currentLine = testLine;
                } else {
                    drawText(currentLine, timesRomanFont, fontSize);
                    currentLine = word;
                }
            }
            if (currentLine) {
                 drawText(currentLine, timesRomanFont, fontSize);
            }
        } else {
             y -= fontSize; // Add space for empty lines
        }
    });

    return pdfDoc.save();
};


export const exportAsPdf = async (title: string, content: string) => {
    const pdfBytes = await createPdf(title, content);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    window.saveAs(blob, `${title.replace(/ /g, '_')}.pdf`);
};

export const exportAsTxt = (title: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    window.saveAs(blob, `${title.replace(/ /g, '_')}.txt`);
};

export const exportAsZip = async (title: string, content: string) => {
    const { JSZip } = window;
    const zip = new JSZip();
    
    zip.file(`${title}.txt`, content);
    
    const pdfBytes = await createPdf(title, content);
    zip.file(`${title}.pdf`, pdfBytes);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    window.saveAs(zipBlob, `BookMind.ai_${title.replace(/ /g, '_')}.zip`);
};