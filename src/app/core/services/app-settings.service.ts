import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http"; 
import { BehaviorSubject, forkJoin, map, Observable, observable } from "rxjs";
import { StorageMap } from "@ngx-pwa/local-storage";
import { ActiveToast, ToastrService } from "ngx-toastr";

@Injectable({
    providedIn : 'root'
})

export class AppSettingsService {
    tokenName = 'crm-token'
    userSettingSource: BehaviorSubject<any> = new BehaviorSubject(null);
    userSetting$ = this.userSettingSource.asObservable();
    private userSubject = new BehaviorSubject<any>(null);

    constructor(
        private http: HttpClient,
        protected storage : StorageMap,
        private toaster : ToastrService
    ){}

    setUserSettings(data: any){
        this.userSettingSource.next(data)
    }

    setUserToken(token: string){
        return this.storage.set(this.tokenName,token)
    }

    getUserByToken(){
        return this.http.get('user/sign-in-token').pipe(
            map((resp:any)=>{
                let mappedUser = resp.data || {};
                this.userSubject.next(resp.data); // ✅ Set user in BehaviorSubject
                return mappedUser
            }),
            map((user:any)=>{
                this.setUserSettings(user);
                return user;
            })
        )
    }

    public sessionExpire(){
        return new Promise((resolve)=>{
            let observable = [this.storage.delete(this.tokenName)];
            forkJoin(observable).subscribe(
                (response:any)=>{
                    // this.httpCancelService.cancelPendingRequests();
                    return resolve(true)
                },
                (error)=>{
                    return resolve(false)
                }
            );
        });
    }

    showSuccess(
        message = '',
        title = "Success!",
        option = {closeButton:true}
    ): ActiveToast<any>{
        return this.toaster.success(message,title,option)
    }

    showError(
        message = '',
        title = "Oops!",
        option = {closeButton:true}
    ): ActiveToast<any>{
        return this.toaster.error(message,title,option)
    }

    showWarning(
        message = '',
        title = "Alert!",
        option = {closeButton:true}
    ): ActiveToast<any>{
        return this.toaster.warning(message,title,option)
    }

    showInfo(message = ''){
        return this.toaster.info(message)
    }

    // To get the user as an observable
    getUser(): Observable<any> {
        return this.userSubject.asObservable(); // ✅ Other components can subscribe to this
    }

    
}