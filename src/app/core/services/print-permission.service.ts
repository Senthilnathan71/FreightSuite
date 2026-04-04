import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { AppSettingsService } from './app-settings.service';

export interface PrintPermission {
    PrintMasterSid: number;
    Name: string;
    PrintMail: string;
}

@Injectable({ providedIn: 'root' })
export class PrintPermissionService {
    private readonly API_URL = 'role-menu/menu-permissions';

    private cache = new Map<string, PrintPermission[]>();
    private inFlight = new Map<string, Observable<PrintPermission[]>>();
    private subject = new BehaviorSubject<PrintPermission[]>([]);
    permissions$ = this.subject.asObservable();
    private currentKey: string | null = null;

    constructor(
        private http: HttpClient,
        private appSettingsService: AppSettingsService
    ) {}

    init(forceReload = false): Observable<PrintPermission[]> {
        const companyId = this.getCompanyId();
        const menuId = this.getMenuId();
        const roleIds = this.getRoleIds();

        if (!companyId || !menuId || !roleIds?.length) {
            this.subject.next([]);
            return of([]);
        }

        const key = this.buildKey(companyId, menuId, roleIds);
        this.currentKey = key;

        if (!forceReload && this.cache.has(key)) {
            const cached = this.cache.get(key)!;
            this.subject.next(cached);
            return of(cached);
        }

        if (this.inFlight.has(key)) {
            return this.inFlight.get(key)!;
        }

        const request$ = this.http.post<any>(this.API_URL, {
            CompanyMasterSid: companyId,
            MenuMasterSid: menuId,
            Roles: roleIds
        }).pipe(
            map(res => (res?.data?.PrintPermissions || []) as PrintPermission[]),
            tap(perms => {
                this.cache.set(key, perms);
                if (this.currentKey === key) {
                    this.subject.next(perms);
                }
            }),
            catchError(() => {
                this.cache.set(key, []);
                if (this.currentKey === key) this.subject.next([]);
                return of([]);
            }),
            finalize(() => this.inFlight.delete(key)),
            shareReplay(1)
        );

        this.inFlight.set(key, request$);
        return request$;
    }

    /**
     * Returns true if the user has access to the given print name + action combination.
     */
    canPrint(name: string, action: string): boolean {
        const perms = this.subject.getValue();
        return perms.some(
            p => p.Name.toLowerCase() === name.toLowerCase() &&
                 p.PrintMail.toLowerCase() === action.toLowerCase()
        );
    }

    clear(): void {
        this.cache.clear();
        this.inFlight.clear();
        this.currentKey = null;
        this.subject.next([]);
    }

    private buildKey(companyId: number, menuId: number, roleIds: number[]): string {
        return `print_${companyId}_${menuId}_${[...roleIds].sort((a, b) => a - b).join(',')}`;
    }

    private getCompanyId(): number | null {
        const company = this.appSettingsService.getCurrentCompanyInfo();
        return company ? Number(company.CompanyMasterSid) : null;
    }

    private getMenuId(): number | null {
        const id = sessionStorage.getItem('currentMenuId');
        return id ? Number(id) : null;
    }

    private getRoleIds(): number[] | null {
        try {
            const userData = this.appSettingsService.getDecryptedUserProfile();
            const currentCompany = this.appSettingsService.getCurrentCompanyInfo();
            if (!currentCompany?.CompanyMasterSid) return null;

            const entry = (userData?.userCompanyMaster || []).find(
                (c: any) => c.CompanyMasterSid === currentCompany.CompanyMasterSid
            );
            if (!entry) return null;

            const roles = (entry.userRoleMaster || [])
                .map((r: any) => r.RoleMasterSid)
                .filter(Boolean);

            return roles.length ? roles : null;
        } catch {
            return null;
        }
    }
}
