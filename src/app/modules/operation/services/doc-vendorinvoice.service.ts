// doc-vendorinvoice.service.ts (Angular)
import { Injectable } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface VendorInvoiceData {
  voucherNumber?: string;
  voucherDate?: string;
  documentNumber?: string;
  documentDate?: string;
  partyName?: string;
  partyAddress?: string;
  gstNo?: string;
  gstType?: string;
  placeOfSupply?: string;
  currencyCode?: string;
  exchangeRate?: number;
  amount?: number;
  localAmount?: number;
  netAmount?: number;
  masterNumber?: string;
  houseNumber?: string;
  masterJobSid?: number;
  houseJobSid?: number;
  departmentMasterSid?: number;
  voucherDetails: ChargeDetail[];
  confidence: number;
  extractedText?: string;
  fieldMappings?: FieldMapping[];
}

export interface ChargeDetail {
  chargeDescription?: string;
  narration?: string;
  sacCode?: string;
  hsnCode?: string;
  unit?: string;
  numberOfUnit?: number;
  drCr?: string;
  currencyCode?: string;
  rate?: number;
  exchangeRate?: number;
  amount?: number;
  taxableAmount?: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  localAmount?: number;
  partyAmount?: number;
  masterJobSid?: number;
  houseJobSid?: number;
  departmentMasterSid?: number;
}

export interface FieldMapping {
  pdfLabel: string;
  canonicalField: string;
  extractedValue: any;
  confidence: number;
  userCorrected?: boolean;
}

export interface ExtractionReview {
  extractionId: string;
  originalData: VendorInvoiceData;
  userCorrections: VendorInvoiceData;
  fieldMappings: FieldMapping[];
  validated: boolean;
}

export interface UploadProgress {
  percentage: number;
  stage: 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
}

export interface VendorInvoiceExtractionResult {
  success: boolean;
  data?: VendorInvoiceData;
  error?: string;
  message?: string;
  processingTime?: number;
  extractionSummary?: {
    totalFields: number;
    extractedFields: number;
    missingFields: string[];
    confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  rawExtraction?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DocVendorInvoiceService {
  private baseUrl = 'api/documents/vendor-invoice'; // Adjust based on your backend URL

  private vendorInvoiceProgressSubject = new BehaviorSubject<UploadProgress>({
    percentage: 0,
    stage: 'uploading',
    message: 'Ready to upload'
  });

  constructor(private http: HttpClient) {}

  // Vendor Invoice Methods
  uploadVendorInvoice(file: File): Observable<VendorInvoiceExtractionResult> {
    const formData = new FormData();
    formData.append('file', file);

    this.vendorInvoiceProgressSubject.next({
      percentage: 0,
      stage: 'uploading',
      message: 'Uploading vendor invoice...'
    });

    return this.http.post(`${this.baseUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round(100 * event.loaded / (event.total || 1));
          this.vendorInvoiceProgressSubject.next({
            percentage: progress,
            stage: 'uploading',
            message: `Uploading... ${progress}%`
          });
        } else if (event.type === HttpEventType.Response) {
          this.vendorInvoiceProgressSubject.next({
            percentage: 100,
            stage: 'complete',
            message: 'Vendor invoice processed successfully'
          });
          return event.body as VendorInvoiceExtractionResult;
        }
        return { success: false, error: 'Upload in progress' } as VendorInvoiceExtractionResult;
      }),
      catchError(error => {
        this.vendorInvoiceProgressSubject.next({
          percentage: 0,
          stage: 'error',
          message: error.message || 'Upload failed'
        });
        throw error;
      })
    );
  }

  getVendorInvoiceUploadProgress(): Observable<UploadProgress> {
    return this.vendorInvoiceProgressSubject.asObservable();
  }

  validateVendorInvoiceData(data: VendorInvoiceData): Observable<{
    isValid: boolean;
    validationResults: Array<{
      field: string;
      isValid: boolean;
      value: any;
      issues?: string[];
    }>;
    totalMismatches?: {
      lineTotal: number;
      headerTotal: number;
      difference: number;
    };
  }> {
    return this.http.post<{
      isValid: boolean;
      validationResults: any[];
      totalMismatches?: any;
    }>(`${this.baseUrl}/validate`, data);
  }

  saveExtractionReview(reviewData: ExtractionReview): Observable<{ success: boolean; reviewId: string }> {
    return this.http.post<{ success: boolean; reviewId: string }>(
      `${this.baseUrl}/review`,
      reviewData
    );
  }

  saveVendorInvoiceToDatabase(saveData: {
    reviewId: string;
    companyMasterSid: number;
    branchMasterSid: number;
    voucherTypeMasterSid: number;
    validatedData: VendorInvoiceData;
    userId: string;
  }): Observable<{ success: boolean; voucherHeaderId: number }> {
    return this.http.post<{ success: boolean; voucherHeaderId: number }>(
      `${this.baseUrl}/save-to-db`,
      saveData
    );
  }

  getVendorInvoiceLabelMappings(): Observable<{ success: boolean; mappings: any[] }> {
    return this.http.get<{ success: boolean; mappings: any[] }>(
      `${this.baseUrl}/label-mappings`
    );
  }

  updateVendorInvoiceLabelMappings(mappings: any[]): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ success: boolean; message: string }>(
      `${this.baseUrl}/label-mappings`,
      { mappings }
    );
  }

  getVendorInvoiceExtractionLogs(reviewId: string): Observable<{ success: boolean; logs: any[] }> {
    return this.http.get<{ success: boolean; logs: any[] }>(
      `${this.baseUrl}/extraction-logs/${reviewId}`
    );
  }

  testVendorInvoiceConnection(): Observable<{ 
    message: string; 
    timestamp: string; 
    version: string;
    supportedFields: string[];
  }> {
    return this.http.get<{ 
      message: string; 
      timestamp: string; 
      version: string;
      supportedFields: string[];
    }>(`${this.baseUrl}/test`);
  }
}