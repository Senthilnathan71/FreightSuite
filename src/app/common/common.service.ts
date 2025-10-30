import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  documentData = signal<any[]>([]);

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

  getExistingFile(payload: any) {
    return this.http.post('attach-document/fetch-by-folder', payload).pipe(
      map((res: any) => {
        return res.data;
      })
    );
  }


  downloadFile(payload: { menuMasterSid: number; documentSid: number; fileName: string }): Observable<Blob> {
  const url = 'attach-document/download';
  return this.http.post(url, payload, {
    responseType: 'blob'
  });
}


// For preview via POST request
// Returns Blob for all file types (client-side rendering for Office files)
previewFile(payload: { menuMasterSid: number; documentSid: number; fileName: string }): Observable<Blob> {
  const url = 'attach-document/preview';
  return this.http.post(url, payload, { responseType: 'blob' });
}

deleteEdocFile(attachDocumentSid: number): Observable<any> {
    return this.http.delete(`attach-document/delete/${attachDocumentSid}`);
}

clearDocumentData(){
    this.documentData.set([])
  }
}