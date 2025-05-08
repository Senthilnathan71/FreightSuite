import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, throwError } from 'rxjs';
import { Sector } from '../crm-mobile/Interfaces/sector.interface';
import { State } from '../crm-mobile/Interfaces/state.interface';
import { Country } from '../crm-mobile/Interfaces/country.interface';
import { Port } from '../crm-mobile/Interfaces/port.interface';
import { Unit } from '../crm-mobile/Interfaces/unit.interface';
import { Uom } from '../crm-mobile/Interfaces/uom.interface';

@Injectable({
  providedIn: 'root'
})
export class MasterService {
  apiUrl: any;

  constructor(private http: HttpClient) { }

  //department-master
  getAllDepartments() {
    return this.http.get('enquiry/department').pipe(map((resp: any) => {
      let response = resp.data
      return response
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
  
// getAllState() {
//   return this.http.get('state').pipe(
//     map((resp: any) => resp.data || resp)
//   );
// }

// getStateById(id: number): Observable<any> {
//   return this.http.get<any>(`state/fetch/${id}`);
// }


// createState(payload: any) {
//   return this.http.post("state", payload).pipe(
//     map((res: any) => res)
//   );
// }

// updateStateById(id: number, payload: any) {
//   return this.http.patch(`state/${id}`, payload).pipe(
//     map((resp: any) => resp.data)
//   );
// }

// deleteStateById(id: number) {
//   return this.http.delete(`state/${id}`).pipe(
//     map((resp: any) => resp.data)
//   );
// }
// state-master
getAllState(): Observable<State[]> {
  return this.http.get('state').pipe(
    map((resp: any) => resp.data || resp),
    catchError(error => {
      console.error('Error fetching states:', error);
      let errorMsg = 'Failed to load states';
      if (error.error?.message) {
        errorMsg += `: ${error.error.message}`;
      }
      return throwError(() => new Error(errorMsg));
    })
  );
}

getStateById(id: number): Observable<State> {
  return this.http.get<State>(`state/fetch/${id}`).pipe(
    map((resp: any) => resp.data || resp)
  );
}

createState(payload: any): Observable<State> {
  return this.http.post<State>("state/create", payload).pipe(
    map((res: any) => res.data || res)
  );
}

updateStateById(id: number, payload: any): Observable<State> {
  return this.http.patch<State>(`state/update/${id}`, payload).pipe(
    map((resp: any) => resp.data || resp)
  );
}

deleteStateById(id: number): Observable<any> {
  return this.http.delete(`state/delete/${id}`).pipe(
    map((resp: any) => resp.data || resp)
  );
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
