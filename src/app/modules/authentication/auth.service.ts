import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { catchError,map, mergeMap } from "rxjs";
import { AppSettingsService } from "src/app/core/services/app-settings.service";

@Injectable({
    providedIn: 'root'
})

export class authService {
    public loginEmail: string = ""
    constructor(
        private http: HttpClient,
        private appSettingsService: AppSettingsService
    ) { }

    public login(params: any) {
        let httpHeaders = { showLoader: "true" };

        return this.http.post("auth/login", params, { headers: httpHeaders }).pipe(
            mergeMap((res: any) => {
                if (res) {
                    this.appSettingsService.setUserSettings(res.data.user);
                }
                this.loginEmail = res.data.user.UserEmail || '';

                return this.appSettingsService.setUserToken(res.data.token).pipe(
                    map(() => {
                        return res
                    })
                )
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