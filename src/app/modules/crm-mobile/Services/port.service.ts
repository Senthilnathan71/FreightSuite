import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Port } from '../Interfaces/port.interface';
import { Country } from '../Interfaces/country.interface';
import { State } from '../Interfaces/state.interface';
import { Sector } from '../Interfaces/sector.interface';

@Injectable({
  providedIn: 'root'
})
export class PortService {

  constructor(private http: HttpClient) { }

  getAllPorts() {
    return this.http.get('port').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getPortById(id: number) {
    return this.http.get<{ data: Port }>(`port/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }


  createPort(payload: any) {
    return this.http.post("port", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  updatePortById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`port/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  deletePortById(id: number) {  
    return this.http.delete<{ data: any }>(`port/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  getAllCountry() {
    return this.http.get<Country>('country').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllState(CountryMasterSid: any) {
    return this.http.get<State>(`state/${CountryMasterSid}`).pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getAllSector() {
    return this.http.get<Sector>('sector').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

}
