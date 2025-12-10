import { Injectable } from '@angular/core';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PdfOptions {
  elementId: string;
  filename: string;
  scale?: number;
  imageQuality?: number;
  imageFormat?: 'PNG' | 'JPEG';
  compress?: boolean;
  orientation?: 'portrait' | 'landscape';
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class PdfDownloadService {

  constructor() {}

  /**
   * Downloads optimized PDF from an HTML element
   * @param options Configuration options for PDF generation
   * @returns Promise that resolves when PDF is generated
   */
  async downloadPDF(options: PdfOptions): Promise<void> {
    const {
      elementId,
      filename,
      scale = 2,
      imageQuality = 0.75,
      imageFormat = 'JPEG',
      compress = true,
      onSuccess,
      onError,
      orientation = 'portrait'
    } = options;

    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        const printContent = document.getElementById(elementId);
        
        if (!printContent) {
          const error = new Error('Print content not found.');
          onError?.(error);
          reject(error);
          return;
        }

        try {
          // Generate canvas from HTML content
          const canvas = await html2canvas(printContent, {
            scale,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#ffffff',
            removeContainer: true,
            imageTimeout: 0
          });

          // A4 dimensions in mm
          let pageWidth = 210;
          let pageHeight = 297;

          // Swap for landscape orientation
          if (orientation === 'landscape') {
            [pageWidth, pageHeight] = [pageHeight, pageWidth];
          }

          // Image dimensions inside PDF
          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          let heightLeft = imgHeight;
          let position = 0;

          // Initialize jsPDF with compression
          const pdf = new jsPDF({
            orientation: orientation,
            unit: 'mm',
            format: 'a4',
            compress: compress,
            hotfixes: ['px_scaling']
          });

          // Convert canvas to image data with compression
          const mimeType = imageFormat === 'JPEG' ? 'image/jpeg' : 'image/png';
          const imgData = canvas.toDataURL(mimeType, imageQuality);

          // Add first page
          pdf.addImage(imgData, imageFormat, 0, position, imgWidth, imgHeight, undefined, imageFormat === 'JPEG' ? 'FAST' : 'NONE');
          heightLeft -= pageHeight;

          // Add additional pages if content exceeds one page
          while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, imageFormat, 0, position, imgWidth, imgHeight, undefined, imageFormat === 'JPEG' ? 'FAST' : 'NONE');
            heightLeft -= pageHeight;
          }

          // Save the PDF
          const pdfFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
          pdf.save(pdfFilename);

          onSuccess?.();
          resolve();
        } catch (error) {
          console.error('Error generating PDF:', error);
          onError?.(error);
          reject(error);
        }
      }, 100);
    });
  }

  /**
   * Balanced quality PDF (Recommended for most cases)
   * File size: ~200-500KB, Quality: Good
   */
  async downloadBalancedPDF(
    elementId: string, 
    filename: string, 
    onSuccess?: () => void, 
    onError?: (error: any) => void,
    orientation : 'portrait' | 'landscape' = 'portrait'
  ): Promise<void> {
    return this.downloadPDF({
      elementId,
      filename,
      scale: 2,
      imageQuality: 0.75,
      imageFormat: 'JPEG',
      compress: true,
      orientation,
      onSuccess,
      onError
    });
  }

  /**
   * Maximum compression PDF (Smallest file size)
   * File size: ~100-200KB, Quality: Acceptable
   */
  async downloadCompressedPDF(
    elementId: string, 
    filename: string, 
    onSuccess?: () => void, 
    onError?: (error: any) => void
  ): Promise<void> {
    return this.downloadPDF({
      elementId,
      filename,
      scale: 1.5,
      imageQuality: 0.6,
      imageFormat: 'JPEG',
      compress: true,
      onSuccess,
      onError
    });
  }

  /**
   * High-quality PDF (Larger file size but better quality)
   * File size: ~500KB-1MB, Quality: Excellent
   */
  async downloadHighQualityPDF(
    elementId: string, 
    filename: string, 
    onSuccess?: () => void, 
    onError?: (error: any) => void
  ): Promise<void> {
    return this.downloadPDF({
      elementId,
      filename,
      scale: 2,
      imageQuality: 0.85,
      imageFormat: 'JPEG',
      compress: true,
      onSuccess,
      onError
    });
  }

  /**
   * Ultra-compressed PDF (Minimum file size)
   * File size: ~50-100KB, Quality: Lower but readable
   */
  async downloadUltraCompressedPDF(
    elementId: string, 
    filename: string, 
    onSuccess?: () => void, 
    onError?: (error: any) => void
  ): Promise<void> {
    return this.downloadPDF({
      elementId,
      filename,
      scale: 1.2,
      imageQuality: 0.5,
      imageFormat: 'JPEG',
      compress: true,
      onSuccess,
      onError
    });
  }
}