import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MasterService {

  constructor(private http: HttpClient) { }

  getAllDepartments() {
    return this.http.get('enquiry/department').pipe(map((resp: any) => {
      let response = resp.data
      return response
    })
    )
  }
}
