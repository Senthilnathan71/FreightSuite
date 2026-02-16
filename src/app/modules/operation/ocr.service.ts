import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Matches the NestJS OcrExtractResponse from the backend
 */
export interface OcrExtractResponse {
  success: boolean;
  documentType: string;
  rawText: string;
  extractedData: ExtractedInvoice | null;
  ocrUsed: boolean;
  model: string;
  processingTime: {
    ocrMs: number;
    llmMs: number;
    totalMs: number;
  };
  error?: string;
}

export interface ExtractedInvoice {
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  place_of_supply: string | null;
  currency: string | null;
  seller: {
    name: string | null;
    address: string | null;
  };
  buyer: {
    name: string | null;
    address: string | null;
    vat_no: string | null;
  };
  shipping: {
    shipper: string | null;
    consignee: string | null;
    hbl: string | null;
    mbl: string | null;
    vessel: string | null;
    voyage: string | null;
    loading_port: string | null;
    destination: string | null;
    job_number: string | null;
  };
  line_items: Array<{
    sno: number;
    description: string | null;
    hsn_sac: string | null;
    currency: string | null;
    qty: number | null;
    rate: number | null;
    taxable_value: number | null;
    vat_percent: number | null;
    vat_amount: number | null;
    total: number | null;
  }>;
  subtotal: number | null;
  total_vat: number | null;
  grand_total: number | null;
  amount_in_words: string | null;
}

export interface OcrHealthResponse {
  ocr: boolean;
  llm: boolean;
  models: string[];
}

@Injectable({
  providedIn: 'root',
})
export class OcrService {
  private baseUrl = 'api/ocr';

  constructor(private http: HttpClient) {}

  /**
   * Upload a PDF and extract structured invoice data via OCR + LLM
   */
  extractFromPdf(file: File, documentType: string = 'invoice'): Observable<OcrExtractResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    return this.http.post<OcrExtractResponse>(`${this.baseUrl}/extract`, formData);
  }

  /**
   * Check if OCR and LLM services are running
   */
  healthCheck(): Observable<OcrHealthResponse> {
    return this.http.get<OcrHealthResponse>(`${this.baseUrl}/health`);
  }
}
