import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {

    constructor(private http: HttpClient) {}

    createInvoice(payload: any) {
        return this.http.post<{ data: any }>('invoice/create', payload).pipe(
            map((resp) => {
                return resp;
            })
        );
    }


    getInvoiceById(payload: any) {
        return this.http.post<{ data: any }>(`invoice/fetch`,payload).pipe(
            map((resp) => {
                return resp;
            })
        );
    }

    
    updateInvoiceById(VoucherHeaderSid: number, payload: any) {
        return this.http.patch<{ data: any }>(`invoice/update/${VoucherHeaderSid}`, payload).pipe(
            map((resp) => {
                return resp;
            })
        );
    }

    searchInvoices(payload: any) {
        return this.http.post<{ data: any }>('invoice/search-list', payload).pipe(
            map((resp) => {
                let response = resp;
                return response;
            })
        );
    }

    sendInvoiceEmail(payload: any) {
        return this.http.post<{ status: boolean; message: string; data: any }>('invoice/send-email', payload).pipe(
            map((resp) => {
                return resp;
            })
        );
    }

    getUninvoicedRevenueCharges(payload: any) {
        return this.http.post<{ status: boolean; data: any[] }>('invoice/uninvoiced-charges', payload).pipe(
            map((resp) => {
                return resp;
            })
        );
    }

    deleteInvoiceDetail(voucherDetailSid: number, payload: any) {
        return this.http.patch<{ status: boolean; message: string; data: any }>(`invoice/detail/delete/${voucherDetailSid}`, payload).pipe(
            map((resp) => {
                return resp;
            })
        );
    }

}