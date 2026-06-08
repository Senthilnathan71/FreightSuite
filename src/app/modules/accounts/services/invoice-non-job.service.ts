import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, of } from 'rxjs';
import { InvoiceService } from '../../operation/services/invoice.service';

@Injectable({
  providedIn: 'root',
})
export class InvoiceNonJobService extends InvoiceService {
  constructor(private nonJobHttp: HttpClient) {
    super(nonJobHttp);
  }

  override createInvoice(payload: any) {
    return this.nonJobHttp.post<{ data: any }>('invoice-non-job/create', payload).pipe(map((resp) => resp));
  }

  override getInvoiceById(payload: any) {
    return this.nonJobHttp.post<{ data: any }>(`invoice-non-job/fetch`,payload).pipe(map((resp) => resp));
  }

  override updateInvoiceById(VoucherHeaderSid: number, payload: any) {
    return this.nonJobHttp.patch<{ data: any }>(`invoice-non-job/update/${VoucherHeaderSid}`, payload).pipe(map((resp) => resp));
  }

  override searchInvoices(payload: any) {
    return this.nonJobHttp.post<{ data: any }>('invoice-non-job/search-list', payload).pipe(map((resp) => resp));
  }

  override sendInvoiceEmail(payload: any) {
    return this.nonJobHttp.post<{ status: boolean; message: string; data: any }>('invoice-non-job/send-email', payload).pipe(map((resp) => resp));
  }

  override getUninvoicedRevenueCharges(_payload: any) {
    return of({ status: true, data: [] });
  }
}
