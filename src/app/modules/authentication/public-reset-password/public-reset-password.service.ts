import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface ValidateTokenResponse {
  status: boolean;
  message: string;
  data?: { email: string; expiresAt: string };
}

export interface ResetPasswordResponse {
  status: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PublicResetPasswordService {
  constructor(private http: HttpClient) {}

  validateToken(token: string): Observable<ValidateTokenResponse> {
    return this.http.get<ValidateTokenResponse>(
      `auth/validate-reset-token/${encodeURIComponent(token)}`,
    );
  }

  resetPassword(
    token: string,
    body: { password: string; confirmPassword: string },
  ): Observable<ResetPasswordResponse> {
    return this.http.patch<ResetPasswordResponse>(
      `auth/reset-password/${encodeURIComponent(token)}`,
      body,
    );
  }
}
