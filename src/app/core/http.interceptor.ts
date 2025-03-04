import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { StorageMap } from "@ngx-pwa/local-storage";
import { AppSettingsService } from "./services/app-settings.service";
import { catchError, from, map, Observable, switchMap, takeUntil, throwError, timeout } from "rxjs";
import { environment } from '../../environments/environment';

@Injectable()
export class HttpInterceptorService implements HttpInterceptor{
    private baseURL = environment.apiUrl;

    private jwtToken:any;
    private openULRS: Array<string> = ["/auth/login"];
    private defaultTimeout:number = 60*5;

    constructor(
        private localStorage : StorageMap,
        private appSettingService : AppSettingsService
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
                    window.location.href = '/auth/login';
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