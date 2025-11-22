import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable, ViewChild } from "@angular/core";
import { StorageMap } from "@ngx-pwa/local-storage";
import { AppSettingsService } from "./services/app-settings.service";
import { catchError, from, map, Observable, switchMap, takeUntil, throwError, timeout } from "rxjs";
import { environment } from '../../environments/environment';
import { CompanySettingsManagerService } from "./services/company-settings-manager.service";
import { Router } from "@angular/router";

@Injectable()
export class HttpInterceptorService implements HttpInterceptor{
    private baseURL = environment.apiUrl;

    private jwtToken:any;
    private openULRS: Array<string> = ["/auth/login"];
    private defaultTimeout:number = 60*5;

    constructor(
        private localStorage : StorageMap,
        private appSettingService : AppSettingsService,
        private companySettingsManager: CompanySettingsManagerService,
        private router : Router
    ){}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if(this.openULRS.indexOf(req.url)> -1){
            this.jwtToken = undefined
        }

        let showLoader = false;

        if(req.headers.has('showLoader') && req.headers.get('showLoader') == 'true'){
            showLoader = true;
        }

        if(this.jwtToken){
            return this.prepareUrlAndHeaders(req, next, showLoader);
        }else{
            return from(this.localStorage.get(this.appSettingService.tokenName))
            .pipe(
                switchMap((token)=>{
                    this.jwtToken = token;
                    return this.prepareUrlAndHeaders(req, next, showLoader)
                })
            )
        }
    }
    
    private prepareUrlAndHeaders(req: HttpRequest <any>, next: HttpHandler, showloader: boolean = false): Observable<HttpEvent<any>> {

        let baseUrl = this.baseURL;
        
        if (req.url.indexOf('118') !== -1 || (req.url.indexOf('http://') === 0 || req.url.indexOf('https://') === 0)){
            baseUrl = '';
        }

        if (req.url.indexOf("rptalpha") !== -1) {
        } else {
            req = req.clone({
                url: baseUrl + req.url,
                setHeaders:{
                    Authorization: `Bearer ${this.jwtToken}`
                }
            });
        }
        
        //Make request
        
        return next
        .handle(req)
        .pipe(
            // takeUntil(this.httpCancelService.onCancelPendingRequests()),
            timeout(1000 * this.defaultTimeout),
            map((event) => {
                if (event instanceof HttpResponse) {
                    if (showloader) {
                        setTimeout(()=>{
                        
                        // spinner ends after 0.2 seconds "/
                        
                        // this.spinner.hide();
                        
                        },1000 * 0.2);
                    }
                if(event.body && (event.body.sessionExpired || event.body.returnCode == 'WRONG_PASSWORD')){

                }
            }
        return event;
    }),
    catchError((error: HttpErrorResponse) => {
        console.log("HttpError", error);
        if(error.status == 401){
            this.appSettingService.sessionExpire().then((flag)=>{
                console.log(flag);
                if(flag){
                    // Clear company settings to prevent API loops during logout
                    this.companySettingsManager.clearCompanySettings();
                    // Preserve remembered credentials
                    const rememberedEmail = localStorage.getItem('rememberedEmail');
                    const rememberedPassword = localStorage.getItem('rememberedPassword');

                    // Clear all localStorage data
                    localStorage.clear();

                    // Restore remembered credentials
                    if (rememberedEmail) {
                    localStorage.setItem('rememberedEmail', rememberedEmail);
                    }
                    if (rememberedPassword) {
                    localStorage.setItem('rememberedPassword', rememberedPassword);
                    }
                    this.router.navigate(['auth/login']);
                }
            })
        }
        if(error.status == 403){
            // this.appSettingService.showError(`You dont have permission`)
        }

        if(showloader){
            // this.spinner.hide();
        }
        return throwError(error)
    })
    )
  }
}