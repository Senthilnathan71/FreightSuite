import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { Sector } from '../crm-mobile/Interfaces/sector.interface';
import { State } from '../crm-mobile/Interfaces/state.interface';
import { Country } from '../crm-mobile/Interfaces/country.interface';
import { Port } from '../crm-mobile/Interfaces/port.interface';
import { Unit } from '../crm-mobile/Interfaces/unit.interface';
import { Uom } from '../crm-mobile/Interfaces/uom.interface';
import { City } from '../crm-mobile/Interfaces/city.interface';

@Injectable({
  providedIn: 'root'
})
export class MasterService {

  constructor(private http: HttpClient) { }

  //department-master
  getAllDepartments() {
    return this.http.get('enquiry/department').pipe(map((resp: any) => {
      let response = resp.data
      return response
    })
    )
  }

  searchDepartmentList(payload) {
    return this.http.post("department/search-list", payload).pipe(
      map((res: any) => {
        return res.data;
      })
    )
  }



  //uom-master
  getAllUom() {
    return this.http.get('uom').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getUomById(id: number) {
    return this.http.get<{ data: Uom }>(`uom/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }


  createUom(payload: any) {
    return this.http.post("uom", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  updateUomById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`uom/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  deleteUomById(id: number) {
    return this.http.delete<{ data: any }>(`uom/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  //unit-master
  getAllUnits() {
    return this.http.get('unit').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  getUnitById(id: number) {
    return this.http.get<{ data: Unit }>(`unit/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }


  createUnit(payload: any) {
    return this.http.post("unit", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  updateUnitById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`unit/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  deleteUnitById(id: number) {
    return this.http.delete<{ data: any }>(`unit/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  //state-master
  getAllState() {
    return this.http.get('state').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  //port-master
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
        let response = resp;
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



  getAllStateByCountry(CountryMasterSid: any) {
    return this.http.get<State>(`state/statesbyCountry/${CountryMasterSid}`).pipe(
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

  //country-master

  getAllCountry() {
    return this.http.get('country').pipe(
      map((resp: any) => {
        let response = resp;
        console.log(response)
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

  //city-master

  getAllCity() {
    return this.http.get<City>('city').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    )
  }


  getCityById(id: number) {
    return this.http.get<{ data: City }>(`city/cityId/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }


  createCity(payload: any) {
    return this.http.post("city/add", payload).pipe(
      map((res: any) => {
        return res;
      })
    )
  }

  updateCityById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`city/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }

  deleteCityById(id: number) {
    return this.http.delete<{ data: any }>(`city/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    )
  }
}
