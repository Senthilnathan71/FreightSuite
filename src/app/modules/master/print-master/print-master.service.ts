import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PrintMasterService {
    constructor(private http: HttpClient) {}

    searchList(params: any) {
        return this.http.post<{ data: any }>('print-master/search-list', params).pipe(
            map((resp: any) => resp)
        );
    }

    create(payload: any) {
        return this.http.post<{ data: any }>('print-master/create', payload).pipe(
            map((resp: any) => resp)
        );
    }

    fetchById(id: number) {
        return this.http.get<{ data: any }>(`print-master/fetch/${id}`).pipe(
            map((resp: any) => resp)
        );
    }

    update(id: number, payload: any) {
        return this.http.patch<{ data: any }>(`print-master/update/${id}`, payload).pipe(
            map((resp: any) => resp)
        );
    }

    getByMenu(menuId: number) {
        return this.http.get<{ data: any[] }>(`print-master/by-menu/${menuId}`).pipe(
            map((resp: any) => resp)
        );
    }
}
