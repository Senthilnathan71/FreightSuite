import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, shareReplay, tap } from 'rxjs';
import { AppSettingsService } from './app-settings.service';

export interface PermissionApiResponse {
  data: {
    MenuPermissions: Record<string, boolean>;
  };
}

export interface MainPermissions {
  insert: boolean;
  update: boolean;
  delete: boolean;
  view: boolean;
}

export type OtherPermissions = Record<string, boolean>;

export interface PermissionSet {
  mainPermissions: MainPermissions;
  otherPermissions: OtherPermissions;
}

@Injectable({
  providedIn: 'root'
})
export class MenuPermissionService {
private readonly API_URL = 'role-menu/menu-permissions';
  private cache = new Map<string, PermissionSet>();
  private loading$ = new BehaviorSubject<boolean>(false);
  private initialized = false;

  private readonly MAIN_KEYS = {
    INSERT: 'InsertRole',
    UPDATE: 'UpdateRole',
    DELETE: 'DeleteRole',
    VIEW: 'ViewRole'
  };

  constructor(
    private http: HttpClient,
    private appSettingsService : AppSettingsService
  ) {
    this.autoInit();
  }

  // Auto-initialize on service creation
  private autoInit(): void {
    const menuId = this.getMenuId();
    const roleId = this.getRoleId();
    const companyId = this.getCompanyId();
    console.log("init permission",{
      CompanyMasterSid : companyId,
      RoleMasterSid : roleId,
      MenuMasterSid : menuId
    });
    
    if (menuId && roleId && companyId && !this.initialized) {
      const payload = {
        CompanyMasterSid: companyId,
        RoleMasterSid : roleId,
        MenuMasterSid : menuId
      }
      console.log("init permission", payload);
      this.fetch(payload).subscribe({
        next: () =>{
           this.initialized = true;
           console.log("Permissions Fetched",this.getPerms());
        },
        error: (err) => console.error('Permission init failed:', err)
      });
    }
  }

  // Main permission check
  can(permission: keyof MainPermissions): boolean {
    return this.getPerms()?.mainPermissions[permission] ?? false;
  }

  // Other permission check
  has(key: string): boolean {
    const perms = this.getPerms()?.otherPermissions;
    if (!perms) return false;
    
    const normalized = key.toLowerCase();
    return Object.entries(perms).some(
      ([k, v]) => k.toLowerCase() === normalized && v
    );
  }

  hasAtLeastOne(): boolean {
    const perms = this.getPerms()?.otherPermissions;
    if (!perms) return false;
    
    return Object.keys(perms).some(key => perms[key]);
  }

  // Get all permissions
  get permissions(): PermissionSet | null {
    return this.getPerms();
  }

  // Loading state
  get isLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  // Refresh permissions
  refresh(): Observable<PermissionSet> {
    const companyId = this.getCompanyId();
    const menuId = this.getMenuId();
    const roleId = this.getRoleId();
    
    if (!menuId || !roleId) {
      return of({
        mainPermissions: { insert: false, update: false, delete: false, view: false },
        otherPermissions: {}
      });
    }

    const key = this.key(companyId,menuId, roleId);
    this.cache.delete(key);
    return this.fetch({
      CompanyMasterSid: companyId,
      MenuMasterSid: menuId,
      RoleMasterSid: roleId
    });
  }

  // Clear cache
  clear(): void {
    this.cache.clear();
    this.initialized = false;
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private fetch(payload:any): Observable<PermissionSet> {
    const cacheKey = this.key(
      payload.CompanyMasterSid,
      payload.MenuMasterSid, 
      payload.RoleMasterSid
    );
    
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey)!);
    }

    this.loading$.next(true);


    return this.http.post<PermissionApiResponse>(this.API_URL, payload).pipe(
      map(res => this.transform(res)),
      tap(perms => {
        this.cache.set(cacheKey, perms);
        this.loading$.next(false);
      }),
      catchError(err => {
        this.loading$.next(false);
        console.error('Permission fetch error:', err);
        return of({
          mainPermissions: { insert: false, update: false, delete: false, view: false },
          otherPermissions: {}
        });
      }),
      shareReplay(1)
    );
  }

  private transform(res: PermissionApiResponse): PermissionSet {
    const raw = res.data.MenuPermissions;

    const mainPermissions: MainPermissions = {
      insert: this.toBool(raw[this.MAIN_KEYS.INSERT]),
      update: this.toBool(raw[this.MAIN_KEYS.UPDATE]),
      delete: this.toBool(raw[this.MAIN_KEYS.DELETE]),
      view: this.toBool(raw[this.MAIN_KEYS.VIEW])
    };

    const otherPermissions: OtherPermissions = {};
    const mainVals = Object.values(this.MAIN_KEYS);

    Object.entries(raw).forEach(([k, v]) => {
      if (!mainVals.includes(k)) {
        otherPermissions[k] = this.toBool(v);
      }
    });

    return { mainPermissions, otherPermissions };
  }

  private toBool(val?: string | boolean): boolean {
    if (!val) return false;
    if(typeof val === 'boolean'){ 
      return val
    } else {
      const v = val.toLowerCase().trim();
      return v === 'istrue' || v === 'true' || v === 'y' || v === '1';
    }
  }

  private getPerms(): PermissionSet | null {
    const companyId = this.getCompanyId();
    const menuId = this.getMenuId();
    const roleId = this.getRoleId();
    
    if (!menuId || !roleId) return null;
    
    return this.cache.get(this.key(companyId,menuId, roleId)) ?? null;
  }

  private key(companyId:number,menuId: number, roleId: number): string {
    return `${companyId}_${menuId}_${roleId}`;
  }

  private getCompanyId(): number | null {
    const currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    return currentCompany ? currentCompany?.CompanyMasterSid : null;
  }

  private getMenuId(): number | null {
    const id = localStorage.getItem('currentMenuId');
    return id ? Number(id) : null;
  }

  private getRoleId(): number | null {
    try {
      const data = this.appSettingsService.getDecryptedUserProfile();
      if (!data) return null;
      return data?.userRoleMaster?.[0]?.RoleMasterSid ?? null;
    } catch {
      return null;
    }
  }

}
