import { useState, useCallback } from 'react';
import { createWorker, Worker } from 'tesseract.js';

export interface OCRResult {
    text: string;
    confidence: number;
}

export interface ParsedReceiptData {
    title?: string;
    amount?: number;
    date?: string;
    notes?: string;
}

export interface UseOCRResult {
    isProcessing: boolean;
    progress: number;
    error: string | null;
    processImage: (file: File) => Promise<OCRResult>;
    parseReceiptText: (text: string) => ParsedReceiptData;
}

/**
 * Convert PDF to images for OCR processing
 * Uses dynamic import to ensure PDF.js only loads on client-side
 */
async function convertPdfToImages(file: File): Promise<Blob[]> {
    // Only run on client-side
    if (typeof window === 'undefined') {
        throw new Error('PDF processing is only available in the browser');
    }

    // Dynamically import pdfjs-dist to avoid SSR issues
    const pdfjsLib = await import('pdfjs-dist');

    // Configure PDF.js worker using the local file we copied to public directory
    // This avoids CORS and CDN issues
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const images: Blob[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport,
            canvas: canvas,
        }).promise;

        // Convert canvas to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) resolve(blob);
                else reject(new Error('Failed to convert canvas to blob'));
            }, 'image/png');
        });

        images.push(blob);
    }

    return images;
}

/**
 * Custom hook for OCR processing with Hebrew support
 * Uses Tesseract.js to extract text from receipt images and PDFs
 */
export function useOCR(): UseOCRResult {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    /**
     * Process an image or PDF file and extract text using OCR
     * Supports Hebrew language and PDF files
     */
    const processImage = useCallback(async (file: File): Promise<OCRResult> => {
        setIsProcessing(true);
        setProgress(0);
        setError(null);

        let worker: Worker | null = null;

        try {
            // Create Tesseract worker with Hebrew and English language support
            worker = await createWorker(['heb', 'eng'], 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                },
            });

            let allText = '';
            let totalConfidence = 0;
            let pageCount = 0;

            // Check if file is a PDF
            if (file.type === 'application/pdf') {
                // Convert PDF pages to images
                const images = await convertPdfToImages(file);

                // Process each page
                for (const imageBlob of images) {
                    const { data } = await worker.recognize(imageBlob);
                    allText += data.text + '\n\n';
                    totalConfidence += data.confidence;
                    pageCount++;
                }
            } else {
                // Process as regular image
                const { data } = await worker.recognize(file);
                allText = data.text;
                totalConfidence = data.confidence;
                pageCount = 1;
            }

            return {
                text: allText,
                confidence: totalConfidence / pageCount,
            };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to process file';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsProcessing(false);
            setProgress(0);

            // Clean up the worker
            if (worker) {
                await worker.terminate();
            }
        }
    }, []);

    /**
     * Parse OCR text to extract receipt information
     * Supports Hebrew and English text
     */
    const parseReceiptText = useCallback((text: string): ParsedReceiptData => {
        const result: ParsedReceiptData = {};

        // Extract amount (looking for patterns like: 123.45, ₪123, $123, 123₪)
        // Hebrew shekel symbol: ₪
        const amountPatterns = [
            /(?:₪|ILS|NIS)\s*(\d{1,6}(?:[.,]\d{1,2})?)/i,  // ₪123.45 or ILS123.45
            /(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:₪|ILS|NIS)/i,  // 123.45₪ or 123.45 ILS
            /(?:total|sum|סה"כ|סך הכל|סכום)[\s:]*(\d{1,6}(?:[.,]\d{1,2})?)/i,  // Total: 123.45
            /\b(\d{1,6}[.,]\d{2})\b/,  // Just a number with 2 decimal places
        ];

        for (const pattern of amountPatterns) {
            const match = text.match(pattern);
            if (match) {
                const amountStr = match[1].replace(',', '.');
                const amount = parseFloat(amountStr);
                if (!isNaN(amount) && amount > 0 && amount < 1000000) {
                    result.amount = amount;
                    break;
                }
            }
        }

        // Extract date (various formats)
        const datePatterns = [
            // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
            /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/,
            // YYYY-MM-DD
            /(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/,
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                let year: number, month: number, day: number;

                if (match[1].length === 4) {
                    // YYYY-MM-DD format
                    year = parseInt(match[1]);
                    month = parseInt(match[2]);
                    day = parseInt(match[3]);
                } else {
                    // DD/MM/YYYY format
                    day = parseInt(match[1]);
                    month = parseInt(match[2]);
                    year = parseInt(match[3]);

                    // Handle 2-digit years
                    if (year < 100) {
                        year += year < 50 ? 2000 : 1900;
                    }
                }

                // Validate date
                if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000 && year <= 2100) {
                    const dateObj = new Date(year, month - 1, day);
                    if (!isNaN(dateObj.getTime())) {
                        result.date = dateObj.toISOString().split('T')[0];
                        break;
                    }
                }
            }
        }

        // Extract merchant/store name (first line or lines before amount)
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length > 0) {
            // Try to find a meaningful title
            // Look for lines with more than 3 characters and less than 50
            const potentialTitles = lines.filter(line =>
                line.length > 3 &&
                line.length < 50 &&
                !/^\d+$/.test(line) && // Not just numbers
                !/^[\d\s\-\/\.:]+$/.test(line) // Not just date/time
            );

            if (potentialTitles.length > 0) {
                result.title = potentialTitles[0];
            }
        }

        // Store full text as notes
        result.notes = text.trim();

        return result;
    }, []);

    return {
        isProcessing,
        progress,
        error,
        processImage,
        parseReceiptText,
    };
}
