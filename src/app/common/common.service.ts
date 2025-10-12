import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
      constructor(private http: HttpClient) { }

      getEdocById(id: number) {
          return this.http.get<{ data: any }>(`attach-document/fetch/${id}`).pipe(
            map((resp) => {
              let response = resp.data;
              return response;
            })
          );
        }
      
        createEdoc(payload: any) {
          return this.http.post('attach-document/Create', payload).pipe(
            map((res: any) => {
              return res;
            })
          );
        }
      
        updateEdocById(id: number, payload: any) {
          return this.http.patch<{ data: any }>(`attach-document/update/${id}`, payload).pipe(
            map((resp) => {
             let response = resp.data;
              return response;
            })
          );
        }
    }