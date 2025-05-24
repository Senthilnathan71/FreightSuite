import { Injectable } from '@angular/core';
import { CurrencyExchange } from '../crm-mobile/Interfaces/currency-exchange.interface';
import { map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  [x: string]: any;

  constructor(private http: HttpClient) { }

  //currency-exchange//
  getAllCurrencyExchange() {
    return this.http.get<CurrencyExchange[]>('currency-exchange').pipe(
      map((resp: any) => {
         let response = resp;
        return response;
      })
    );
  }

  searchCurrencyExchangeList(payload: any) {
    return this.http.post("currency-exchange/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    );
  }

  getCurrencyExchangeById(id: number) {
    return this.http.get<{ data: CurrencyExchange }>(`currency-exchange/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createCurrencyExchange(payload: any) {
    return this.http.post('currency-exchange/Create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateCurrencyExchangeById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`currency-exchange/update/${id}`, payload).pipe(
      map((resp) => {
       let response = resp.data;
        return response;
      })
    );
  }

  deleteCurrencyExchangeById(id: number) {
    return this.http.delete<{ data: any }>(`currency-exchange/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }
  
}
