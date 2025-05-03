import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { State } from '../Interfaces/state.interface';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  constructor(private http: HttpClient) { }

  getAllState() {
    return this.http.get('state').pipe(
      map((resp: any) => {
        let response = resp;
        return response;
      })
    )
  }

  


}
