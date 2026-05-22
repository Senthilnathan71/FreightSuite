import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, map, Observable } from "rxjs";

import { ActiveToast, IndividualConfig, ToastrService } from "ngx-toastr";
import * as CryptoJS from 'crypto-js';

export interface FinancialYear {
    YearMasterSid: number;
    YearName: string;
    CurrentYear: string;
    StartDate: string;
    EndDate: string;
}

@Injectable({
    providedIn: 'root'
})

export class AppSettingsService {

    userSettingSource: BehaviorSubject<any> = new BehaviorSubject(null);
    userSetting$ = this.userSettingSource.asObservable();
    private userSubject = new BehaviorSubject<any>(null);

    constructor(
        private http: HttpClient,
        private toaster: ToastrService
    ) { }

    private secret = 'freight-forwarding-user';


    setUserSettings(data: any) {
        this.userSettingSource.next(data)
    }

    encrypt(data: any): string {
        return CryptoJS.AES.encrypt(JSON.stringify(data), this.secret).toString();
    }


    decrypt(ciphertext: string): any {
  try {
    if (!ciphertext || !this.secret) {
      console.error('Decryption failed: missing ciphertext or secret key');
      return null;
    }

    const bytes = CryptoJS.AES.decrypt(ciphertext, this.secret);

    // Ensure decryption produced a valid result
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      console.error('Decryption failed: invalid ciphertext or secret mismatch');
      return null;
    }

    return JSON.parse(decrypted);
  } catch (err) {
    console.error('Error during decryption:', err);
    return null;
  }
}

    getUserByToken() {
        return this.http.get('user/sign-in-token').pipe(
            map((resp: any) => {
                if (!resp?.status || !resp?.data) {
                    return null;
                }

                let mappedUser = resp.data;
                this.userSubject.next(resp.data);
                this.storeUserProfile(resp.data);
                localStorage.setItem('userData', this.encrypt(resp.data))
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
    getCurrentCompanyInfo() {
        const encryptedCompany = localStorage.getItem('selected-company');
        if (!encryptedCompany) return null;

        const decryptedCompany = this.decrypt(encryptedCompany);
        const CompanyMasterSid = Number(decryptedCompany?.CompanyMasterSid);
        if (!CompanyMasterSid) return null;

        const userProfile = this.getDecryptedUserProfile();
        return userProfile?.userCompanyMaster
            ?.find(c => c.CompanyMasterSid === CompanyMasterSid)
            ?.companyMaster || null;
    }

    getCurrentCompanyCountry() : { CountryMasterSid: number, countryName: string, countryCode: string } {
        const company = this.getCurrentCompanyInfo();
        if(!company) return null;
        return {
            CountryMasterSid : company.CountryMasterSid,
            countryName : company.countryMaster?.countryName,
            countryCode : company.countryMaster?.countryCode
        }
    }

    getCurrentBranchInfo() {
        const encryptedBranch = localStorage.getItem('selected-branch');
        if (!encryptedBranch) return null;

        const decryptedBranch = this.decrypt(encryptedBranch);
        const BranchMasterSid = Number(decryptedBranch?.BranchMasterSid);
        if (!BranchMasterSid) return null;

        const companyInfo = this.getCurrentCompanyInfo();
        if (!companyInfo) return null;

        return companyInfo.userBranchMaster
            ?.find(b => b.BranchMasterSid === BranchMasterSid)
            ?.branchMaster || null;
    }

    getCostRevenueAccess(): string {
        const encryptedBranch = localStorage.getItem('selected-branch');
        if (!encryptedBranch) return 'NONE';
        const decryptedBranch = this.decrypt(encryptedBranch);
        const BranchMasterSid = Number(decryptedBranch?.BranchMasterSid);
        if (!BranchMasterSid) return 'NONE';
        const companyInfo = this.getCurrentCompanyInfo();
        if (!companyInfo) return 'NONE';
        const branchEntry = companyInfo.userBranchMaster?.find((b: any) => b.BranchMasterSid === BranchMasterSid);
        return branchEntry?.CostRevenueAccess || 'NONE';
    }

    getCurrentBranchState(){
        const branch = this.getCurrentBranchInfo();
        if(!branch) return null;

        return {
            StateMasterSid : branch.StateMasterSid,
            stateName : branch.stateMaster?.stateName,
            stateCode : branch.stateMaster?.stateCode
        }
    }

    getCurrentBranchCity(){
        const branch = this.getCurrentBranchInfo();
        if(!branch) return null;

        return {
            CityMasterSid : branch.CityMasterSid,
            cityName : branch.cityMaster?.cityName,
            cityCode : branch.cityMaster?.cityCode
        }
    }

    setCurrentFinancialYear(year: FinancialYear) {
        localStorage.setItem('current-financial-year', this.encrypt(year));
    }

    getCurrentFinancialYear(): FinancialYear | null {
        const encryptedYear = localStorage.getItem('current-financial-year');
        if (!encryptedYear) return null;

        const decryptedYear = this.decrypt(encryptedYear);
        return decryptedYear;
    }

    public sessionExpire(): Promise<boolean> {
        this.showWarning('Your session has expired. Please log in again.', 'Session Expired');
        return Promise.resolve(true);
    }



    showSuccess(
        message = '',
        title = "",
        option = { closeButton: true }
    ): ActiveToast<any> {
        return this.toaster.success(message, title, option)
    }

    showError(
        message = '',
        title = "Oops!",
        option: Partial<IndividualConfig> = { closeButton: true }
    ): ActiveToast<any> {
        return this.toaster.error(message, title, option)
    }

    showWarning(
        message = '',
        title = "Alert!",
        option: Partial<IndividualConfig> = { closeButton: true }
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
