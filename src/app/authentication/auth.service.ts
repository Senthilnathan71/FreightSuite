import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AppSettingsService } from "../core/services/app-settings.service";
import { map, mergeMap } from "rxjs";

@Injectable({
    providedIn:'root'
})

export class authService {
    public loginEmail : string = ""
    constructor(
        private http:HttpClient,
        private appSettingsService : AppSettingsService
    ){}

    public login(params : any){
        let httpHeaders = { showLoader : "true"};

        return this.http.post("auth/login",params,{headers: httpHeaders}).pipe(
            mergeMap((res:any)=>{
                if(res){
                    this.appSettingsService.setUserSettings(res.data.user);
                }
                this.loginEmail = res.data.user.UserEmail || '';

                return this.appSettingsService.setUserToken(res.data.token).pipe(
                    map(()=>{
                        return res
                    })
                )
            })
        )
    }
}