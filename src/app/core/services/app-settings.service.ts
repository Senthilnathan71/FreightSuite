import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, forkJoin, map, Observable, observable } from "rxjs";
import { StorageMap } from "@ngx-pwa/local-storage";
import { ActiveToast, ToastrService } from "ngx-toastr";
import * as CryptoJS from 'crypto-js';

@Injectable({
    providedIn: 'root'
})

export class AppSettingsService {
    tokenName = 'crm-token'
    userSettingSource: BehaviorSubject<any> = new BehaviorSubject(null);
    userSetting$ = this.userSettingSource.asObservable();
    private userSubject = new BehaviorSubject<any>(null);

    constructor(
        private http: HttpClient,
        protected storage: StorageMap,
        private toaster: ToastrService
    ) { }

    private secret = 'freight-forwarding-user';


    setUserSettings(data: any) {
        this.userSettingSource.next(data)
    }

    setUserToken(token: string) {
        return this.storage.set(this.tokenName, token)
    }


    encrypt(data: any): string {
        return CryptoJS.AES.encrypt(JSON.stringify(data), this.secret).toString();
    }


    decrypt(ciphertext: string): any {
        const bytes = CryptoJS.AES.decrypt(ciphertext, this.secret);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decrypted);
    }
    getUserByToken() {
        return this.http.get('user/sign-in-token').pipe(
            map((resp: any) => {
                let mappedUser = resp.data || {};
                this.userSubject.next(resp.data);
                const encryptedData: any = this.storeUserProfile(resp.data)
                localStorage.setItem('userData', encryptedData)
                return mappedUser
            }),
            map((user: any) => {
                this.setUserSettings(user);
                return user;
            })
        )
    }


    storeUserProfile(user: any): void {
        const encrypted: any = this.encrypt(user);
        localStorage.setItem('userProfile', encrypted);
    }

    getDecryptedUserProfile(): any {
        const encrypted = localStorage.getItem('userProfile');
        if (encrypted) {
            return this.decrypt(encrypted);
        }
        return null;
    }

    public sessionExpire() {
        return new Promise((resolve) => {
            let observable = [this.storage.delete(this.tokenName)];
            forkJoin(observable).subscribe(
                (response: any) => {
                    // this.httpCancelService.cancelPendingRequests();
                    return resolve(true)
                },
                (error) => {
                    return resolve(false)
                }
            );
        });
    }

    showSuccess(
        message = '',
        title = "Success!",
        option = { closeButton: true }
    ): ActiveToast<any> {
        return this.toaster.success(message, title, option)
    }

    showError(
        message = '',
        title = "Oops!",
        option = { closeButton: true }
    ): ActiveToast<any> {
        return this.toaster.error(message, title, option)
    }

    showWarning(
        message = '',
        title = "Alert!",
        option = { closeButton: true }
    ): ActiveToast<any> {
        return this.toaster.warning(message, title, option)
    }

    showInfo(message = '') {
        return this.toaster.info(message)
    }

    // To get the user as an observable
    getUser(): Observable<any> {
        return this.userSubject.asObservable(); // ✅ Other components can subscribe to this
    }


}