import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  ExceptionCheckScript,
  ExceptionCheckScriptRun,
  ExecutionResult,
} from './exception-check-script.model';

@Injectable({ providedIn: 'root' })
export class ExceptionCheckScriptService {
  constructor(private http: HttpClient) {}

  list$(search?: string): Observable<any> {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return this.http.get(`exception-check-script${q}`).pipe(map((r: any) => r));
  }

  getOne$(id: number): Observable<any> {
    return this.http.get(`exception-check-script/${id}`).pipe(map((r: any) => r));
  }

  create$(payload: ExceptionCheckScript, username: string): Observable<any> {
    return this.http
      .post(`exception-check-script?username=${encodeURIComponent(username)}`, payload)
      .pipe(map((r: any) => r));
  }

  update$(id: number, payload: Partial<ExceptionCheckScript>, username: string): Observable<any> {
    return this.http
      .patch(`exception-check-script/${id}?username=${encodeURIComponent(username)}`, payload)
      .pipe(map((r: any) => r));
  }

  remove$(id: number, username: string): Observable<any> {
    return this.http
      .delete(`exception-check-script/${id}?username=${encodeURIComponent(username)}`)
      .pipe(map((r: any) => r));
  }

  toggleActive$(id: number, username: string): Observable<any> {
    return this.http
      .patch(`exception-check-script/${id}/toggle-active?username=${encodeURIComponent(username)}`, {})
      .pipe(map((r: any) => r));
  }

  execute$(id: number, username: string): Observable<{ status: boolean; message: string; data?: ExecutionResult }> {
    return this.http
      .post(`exception-check-script/${id}/execute?username=${encodeURIComponent(username)}`, {})
      .pipe(map((r: any) => r));
  }

  executeExport$(id: number, username: string): Observable<Blob> {
    return this.http.post(
      `exception-check-script/${id}/execute/export?username=${encodeURIComponent(username)}`,
      {},
      { responseType: 'blob' as const },
    );
  }

  validate$(scriptText: string): Observable<any> {
    return this.http
      .post(`exception-check-script/validate`, { ScriptText: scriptText })
      .pipe(map((r: any) => r));
  }

  runs$(id: number, limit = 50): Observable<{ status: boolean; data?: ExceptionCheckScriptRun[] }> {
    return this.http
      .get(`exception-check-script/${id}/runs?limit=${limit}`)
      .pipe(map((r: any) => r));
  }
}
