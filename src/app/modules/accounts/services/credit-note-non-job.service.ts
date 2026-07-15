import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

/**
 * Credit Note Non Job (NCN) API client.
 *
 * Standalone HttpClient service — the entry component (which extends the job
 * CreditNoteEntryComponent) routes its persist/fetch *seams* through here so
 * saves/pulls hit the NCN backend instead of the shared operationService
 * (which would leak into the job credit note). Paths are relative; the HTTP
 * interceptor prepends environment.apiUrl.
 */
@Injectable({
  providedIn: 'root',
})
export class CreditNoteNonJobService {
  constructor(private http: HttpClient) {}

  createCreditNote(payload: any) {
    return this.http
      .post<{ data: any; status: boolean; message: string }>('credit-note-non-job/create', payload)
      .pipe(map((resp) => resp));
  }

  getCreditNoteById(payload: any) {
    return this.http
      .post<{ data: any; status: boolean; message: string }>('credit-note-non-job/fetch', payload)
      .pipe(map((resp) => resp));
  }

  updateCreditNoteById(VoucherHeaderSid: number, payload: any) {
    return this.http
      .patch<{ data: any; status: boolean; message: string }>(
        `credit-note-non-job/update/${VoucherHeaderSid}`,
        payload,
      )
      .pipe(map((resp) => resp));
  }

  searchCreditNotes(payload: any) {
    return this.http
      .post<{ data: any; status: boolean; message: string }>('credit-note-non-job/search-list', payload)
      .pipe(map((resp) => resp));
  }

  /** Pull the source Invoice Non Job (NIN) by number — DrCr-swapped lines + outstanding. */
  fetchSourceInvoice(payload: any) {
    return this.http
      .post<{ data: any; status: boolean; message: string }>('credit-note-non-job/fetch/invoice', payload)
      .pipe(map((resp) => resp));
  }

  deleteVoucher(VoucherHeaderSid: number) {
    return this.http
      .delete<{ data: any; status: boolean; message: string }>(
        `credit-note-non-job/deleteVoucher/${VoucherHeaderSid}`,
      )
      .pipe(map((resp) => resp));
  }

  sendEmail(payload: any) {
    return this.http
      .post<{ status: boolean; message: string; data: any }>('credit-note-non-job/send-email', payload)
      .pipe(map((resp) => resp));
  }
}
