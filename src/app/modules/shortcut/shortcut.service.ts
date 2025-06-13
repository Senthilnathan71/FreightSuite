import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { map } from "rxjs";

@Injectable({
  providedIn: 'root',
})
export class ShortcutService {
  constructor(private http: HttpClient) { }

  getAllShortcut() {
    return this.http.get('shortcut').pipe(
      map((resp: any) => {
        let response = resp.data;
        return response;
      })
    );
  }


  getShortcutById(id: number) {
    return this.http.get<{ data: any }>(`shortcut/fetch/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  createShortcut(payload: any) {
    return this.http.post('shortcut/create', payload).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  updateShortcutById(id: number, payload: any) {
    return this.http.patch<{ data: any }>(`shortcut/update/${id}`, payload).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }

  deleteShortcutById(id: number) {
    return this.http.delete<{ data: any }>(`shortcut/delete/${id}`).pipe(
      map((resp) => {
        let response = resp.data;
        return response;
      })
    );
  }
}