import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { StorageMap } from "@ngx-pwa/local-storage";
import { AppSettingsService } from "./services/app-settings.service";
import { catchError, from, map, Observable, switchMap, throwError, timeout } from "rxjs";
import { environment } from "../../environments/environment";
import { CompanySettingsManagerService } from "./services/company-settings-manager.service";
import { Router } from "@angular/router";

@Injectable()
export class HttpInterceptorService implements HttpInterceptor {

    private baseURL = environment.apiUrl;
    private jwtToken: any = null;

    // APIs that should NOT have Authorization header
    private openURLs: string[] = ["/auth/login"];

    private defaultTimeout = 60 * 5; // 5 mins

    constructor(
        private localStorage: StorageMap,
        private appSettingService: AppSettingsService,
        private companySettingsManager: CompanySettingsManagerService,
        private router: Router
    ) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        const skipAuth = this.openURLs.includes(req.url);
        const showLoader = req.headers.get('showLoader') === 'true';

        // Skip auth for open URLs (like login)
        if (skipAuth) {
            return this.prepareRequest(req, next, showLoader, skipAuth);
        }

        // Always read token from storage for protected routes
        // This ensures we get the latest token after login (fixes race condition)
        return from(this.localStorage.get(this.appSettingService.tokenName)).pipe(
            switchMap(token => {
                this.jwtToken = token;
                return this.prepareRequest(req, next, showLoader, skipAuth);
            })
        );
    }

    private prepareRequest(
        req: HttpRequest<any>,
        next: HttpHandler,
        showLoader: boolean,
        skipAuth: boolean
    ): Observable<HttpEvent<any>> {

        let baseUrl = this.baseURL;

        // Skip adding base URL only if request is full URL
        if (
            req.url.startsWith("http://") ||
            req.url.startsWith("https://")
        ) {
            baseUrl = "";
        }

        // Attach token only if NOT login URL
        if (!skipAuth) {
            req = req.clone({
                url: baseUrl + req.url,
                setHeaders: {
                    Authorization: `Bearer ${this.jwtToken}`
                }
            });
        } else {
            req = req.clone({
                url: baseUrl + req.url
            });
        }

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

                    this.appSettingService.sessionExpire().then(flag => {

                        if (flag) {
                            // Clear cached data
                            this.companySettingsManager.clearCompanySettings();

                            // Save remembered credentials
                            const rememberedEmail = localStorage.getItem("rememberedEmail");
                            const rememberedPassword = localStorage.getItem("rememberedPassword");

                            // Clear all data
                            localStorage.clear();

                            // Restore remembered creds
                            if (rememberedEmail) localStorage.setItem("rememberedEmail", rememberedEmail);
                            if (rememberedPassword) localStorage.setItem("rememberedPassword", rememberedPassword);

                            this.router.navigate(["auth/login"]);
                        }
                    });
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
