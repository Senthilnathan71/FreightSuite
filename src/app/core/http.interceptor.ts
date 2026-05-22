import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppSettingsService } from "./services/app-settings.service";
import { catchError, map, Observable, throwError, timeout } from "rxjs";
import { environment } from "../../environments/environment";
import { CompanySettingsManagerService } from "./services/company-settings-manager.service";
import { Router } from "@angular/router";

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {

    private baseURL = environment.apiUrl;

    private defaultTimeout = 60 * 5; // 5 mins

    private isRedirecting = false;

    constructor(
        private appSettingService: AppSettingsService,
        private companySettingsManager: CompanySettingsManagerService,
        private router: Router
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return this.prepareRequest(req, next);
    }

    private prepareRequest(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {

        let baseUrl = this.baseURL;

        // Skip adding base URL only if request is full URL
        if (
            req.url.startsWith("http://") ||
            req.url.startsWith("https://")
        ) {
            baseUrl = "";
        }

        req = req.clone({
            url: baseUrl + req.url,
            withCredentials: true
        });

        // Handle request
        return next.handle(req).pipe(
            timeout(1000 * this.defaultTimeout),

            map((event: HttpEvent<any>) => {
                return event;
            }),

            catchError((error: HttpErrorResponse) => {

                console.log("HTTP Error:", error);

                // Handle Unauthorized → Session Expired
                if (error.status === 401) {
                    const currentUrl = this.router.url;
                    const isOnAuthPage = currentUrl.startsWith('/auth') || currentUrl === '/';
                    const isOnPublicPage = currentUrl.startsWith('/public');

                    if (!this.isRedirecting && !isOnAuthPage && !isOnPublicPage) {
                        this.isRedirecting = true;
                        this.companySettingsManager.clearCompanySettings();

                        // Preserve remembered credentials and year
                        const rememberedEmail = localStorage.getItem("rememberedEmail");
                        const rememberedPassword = localStorage.getItem("rememberedPassword");
                        const lastYearId = localStorage.getItem("current-year-id");
                        localStorage.clear();
                        if (rememberedEmail) localStorage.setItem("rememberedEmail", rememberedEmail);
                        if (rememberedPassword) localStorage.setItem("rememberedPassword", rememberedPassword);
                        if (lastYearId) localStorage.setItem("current-year-id", lastYearId);

                        void this.appSettingService.sessionExpire();

                        this.router.navigate(["auth/login"]).then(() => {
                            this.isRedirecting = false;
                        });
                    }
                }

                if (error.status === 403) {
                    // Permission error
                    // this.appSettingService.showError("You don’t have permission");
                }

                return throwError(() => error);
            })
        );
    }
}
