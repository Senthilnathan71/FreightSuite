import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError, map, mergeMap, of } from "rxjs";
import { AppSettingsService } from "src/app/core/services/app-settings.service";
import { SessionService } from "src/app/core/services/session.service";

@Injectable({
    providedIn: 'root'
})

export class authService {
    public loginEmail: string = ""
    constructor(
        private http: HttpClient,
        private appSettingsService: AppSettingsService,
        private sessionService: SessionService
    ) { }

    public login(params: any) {
        let httpHeaders = { showLoader: "true" };

        return this.http.post("auth/login", params, { headers: httpHeaders }).pipe(
            mergeMap((res: any) => {
                // Handle session-active-elsewhere response (pass through to login component)
                if (!res.status && res.message === 'SESSION_ACTIVE_ELSEWHERE') {
                    return of(res);
                }

                if (res && res.status) {
                    this.appSettingsService.setUserSettings(res.data.user);
                    this.loginEmail = res.data.user?.UserEmail || '';

                    return this.appSettingsService.setUserToken(res.data.token).pipe(
                        map(() => {
                            // Start session heartbeat after successful login
                            this.sessionService.startHeartbeat();
                            return res;
                        })
                    );
                }

                return of(res);
            }),
            catchError((err) => {
                console.error("Login failed:", err);
                let message = 'Login failed. Please check your credentials and try again.';
                if (err?.error?.message) {
                    message = err.error.message;
                } else if (err?.message) {
                    message = err.message;
                }
                return of({ status: false, message });
            })
        )
    }

    public forgotPassword(email: string) {
        const body = { email }
        return this.http.post('auth/forgot-password', body).pipe(map((resp: any) => {
            return resp
        }))
    }

    public resetPassword(payload: any, token: string) {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`).set('Content-Type', 'application/json')
        return this.http.patch('auth/reset-password', payload, { headers }).pipe
            (map((resp: any) => {
                return resp;
            }), catchError((err) => {
                throw err
            })
            )
    }
}