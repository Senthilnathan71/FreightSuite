import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Country } from '../Interfaces/country.interface';

@Injectable({
  providedIn: 'root'
})
export class CountryService {

  constructor(private http: HttpClient) { }

  getAllCountry() {
    return this.http.get('country').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getCountryById(id: number) {
      return this.http.get<{ data: Country }>(`country/${id}`).pipe(
        map((resp) => {
          let response = resp.data;
          return response;
        })
      )
    }
  
  
    createCountry(payload: any) {
      return this.http.post("country", payload).pipe(
        map((res: any) => {
          return res;
        })
      )
    }
  
    updateCountryById(id: number, payload: any) {
      return this.http.patch<{ data: any }>(`country/${id}`, payload).pipe(
        map((resp) => {
          let response = resp.data;
          return response;
        })
      )
    }
  
    deleteCountryById(id: number) {  
      return this.http.delete<{ data: any }>(`country/${id}`).pipe(
        map((resp) => {
          let response = resp.data;
          return response;
        })
      )
    }
  


}
