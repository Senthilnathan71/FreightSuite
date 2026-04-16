import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { AppSettingsService } from './app-settings.service';

export interface PrintPermission {
  PrintMasterSid: number;
  Name: string;
  PrintMail: string;
}

export interface ReportPermission {
  ReportMasterSid: number;
  ReportName: string;
  ReportDisplayName: string;
}

export interface PermissionApiResponse {
  data: {
    MenuPermissions: Record<string, string | boolean | undefined>;
    PrintPermissions?: PrintPermission[];
    ReportPermissions?: ReportPermission[];
  };
}

export interface MainPermissions {
  insert: boolean;
  update: boolean;
  delete: boolean;
  view: boolean;
  post: boolean;
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

  // Cache keyed by company_menu_role
  private cache = new Map<string, PermissionSet>();
  private printCache = new Map<string, PrintPermission[]>();
  private reportCache = new Map<string, ReportPermission[]>();

  // track inflight requests (dedupe)
  private inFlight = new Map<string, Observable<PermissionSet>>();

  // public permission stream for the currently active key
  private permissionSubject = new BehaviorSubject<PermissionSet | null>(null);
  permission$ = this.permissionSubject.asObservable();

  // whether the current permissionSubject has loaded data
  private loadedSubject = new BehaviorSubject<boolean>(false);
  loaded$ = this.loadedSubject.asObservable();

  // print permissions stream
  private printSubject = new BehaviorSubject<PrintPermission[]>([]);
  printPermissions$ = this.printSubject.asObservable();

  // report permissions stream
  private reportSubject = new BehaviorSubject<ReportPermission[]>([]);
  reportPermissions$ = this.reportSubject.asObservable();

  // keep current key so getPerms() & can() work w/out passing ids
  private currentKey: string | null = null;

  private readonly MAIN_KEYS = {
    INSERT: 'InsertRole',
    UPDATE: 'UpdateRole',
    DELETE: 'DeleteRole',
    VIEW: 'ViewRole',
    POST: 'PostRole'
  };

  constructor(
    private http: HttpClient,
    private appSettingsService: AppSettingsService
  ) {
    // intentionally do NOT auto init here (avoids blocking work in constructor)
  }

  /**
   * Initialize permissions for the current company/menu/role.
   * If already cached, emits from cache and returns it.
   * If not cached, triggers an HTTP fetch, caches and emits the result.
   *
   * Call this from the component that needs permissions (e.g., header/layout).
   */
  init(forceReload = false): Observable<PermissionSet | null> {
    console.log('%c[MenuPermissionService] init() called', 'color: #4CAF50');

    const companyId = this.getCompanyId();
    const menuId = this.getMenuId();
    const roleIds = this.getRoleIds();

    console.log('[MPS] IDs:', { companyId, menuId, roleIds });

    if (!companyId || !menuId || !roleIds || roleIds.length === 0) {
      console.warn('[MPS] Missing IDs → clearing permissions');
      this.currentKey = null;
      this.permissionSubject.next(null);
      this.loadedSubject.next(true);
      return of(null);
    }

    const key = this.buildKey(companyId, menuId, roleIds);

    // Reset loaded/report/print state when switching to a different menu context
    // so combineLatest subscribers don't fire prematurely with stale data
    if (this.currentKey !== key) {
      this.loadedSubject.next(false);
      this.reportSubject.next([]);
      this.printSubject.next([]);
    }

    this.currentKey = key;

    console.log('%c[MPS] Built key: ' + key, 'color: #03A9F4');

    if (!forceReload && this.cache.has(key)) {
      console.log('%c[MPS] ✔ Using cached permissions for key: ' + key, 'color: #8BC34A');
      const cached = this.cache.get(key)!;
      this.permissionSubject.next(cached);
      this.loadedSubject.next(true);
      this.printSubject.next(this.printCache.get(key) ?? []);
      this.reportSubject.next(this.reportCache.get(key) ?? []);
      return of(cached);
    }

    if (this.inFlight.has(key)) {
      console.log('%c[MPS] ⏳ Returning in-flight request for key: ' + key, 'color: #FF9800');
      return this.inFlight.get(key)!;
    }

    const payload = {
      CompanyMasterSid: companyId,
      MenuMasterSid: menuId,
      Roles: roleIds
    };
    console.log('%c[MPS] 🔥 API request triggered', 'color: #E91E63', payload);

    const request$ = this.http.post<PermissionApiResponse>(this.API_URL, payload).pipe(
      // ⭐ Transform ONLY on success
      map(res => {
        console.log('%c[MPS] 🌐 API responded', 'color: cyan');
        console.log('%c[MPS] Raw API Response:', 'color: #9C27B0', res);

        // Extract and cache print permissions from the same response
        const printPerms: PrintPermission[] = res?.data?.PrintPermissions ?? [];
        this.printCache.set(key, printPerms);
        if (this.currentKey === key) {
          this.printSubject.next(printPerms);
        }

        // Extract and cache report permissions from the same response
        const reportPerms: ReportPermission[] = res?.data?.ReportPermissions ?? [];
        this.reportCache.set(key, reportPerms);
        if (this.currentKey === key) {
          this.reportSubject.next(reportPerms);
        }

        return this.transform(res);
      }),

      tap(perms => {
        console.log('%c[MPS] Transformed permissions:', 'color: #4CAF50', perms);
        this.cache.set(key, perms);
        console.log('%c[MPS] ✔ Cached permissions for key: ' + key, 'color: #8BC34A');

        if (this.currentKey === key) {
          console.log('%c[MPS] 📢 Emitting permissions to subscribers', 'color: #673AB7');
          this.permissionSubject.next(perms);
          this.loadedSubject.next(true);
        }
      }),

      // ⭐ Catch AFTER transform (guaranteed PermissionSet)
      catchError(err => {
        console.error('%c[MPS] ❌ API ERROR:', 'color: red', err);
        console.error('Status:', err.status, 'Response:', err.error);

        const fallback: PermissionSet = {
          mainPermissions: { insert: false, update: false, delete: false, view: false, post: false },
          otherPermissions: {}
        };

        this.printCache.set(key, []);
        this.reportCache.set(key, []);
        this.cache.set(key, fallback);
        if (this.currentKey === key) {
          this.printSubject.next([]);
          this.reportSubject.next([]);
          this.permissionSubject.next(fallback);
          this.loadedSubject.next(true);
        }

        return of(fallback);
      }),

      finalize(() => {
        console.log('%c[MPS] ✔ Request finalized (in-flight cleared) for key: ' + key, 'color: #795548');
        this.inFlight.delete(key);
      }),

      shareReplay(1)
    );

    this.inFlight.set(key, request$);
    return request$;
  }



  /**
   * Force refresh of current permission key by clearing cache and re-initializing.
   */
  refresh(): Observable<PermissionSet | null> {
    if (!this.currentKey) {
      // nothing to refresh, try init which will compute a key from app settings
      return this.init(true);
    }
    this.cache.delete(this.currentKey);
    return this.init(true);
  }

  /**
   * Clear all cached permission data. Useful on logout or switching user.
   */
  clear(): void {
    this.cache.clear();
    this.printCache.clear();
    this.reportCache.clear();
    this.inFlight.clear();
    this.currentKey = null;
    this.permissionSubject.next(null);
    this.printSubject.next([]);
    this.reportSubject.next([]);
    this.loadedSubject.next(false);
  }

  /** Synchronous check for print permissions. */
  canPrint(name: string, action: string): boolean {
    const perms = this.printSubject.getValue();
    return perms.some(
      p => p.Name.toLowerCase() === name.toLowerCase() &&
           p.PrintMail.toLowerCase() === action.toLowerCase()
    );
  }

  /** Synchronous getter for current print permissions array. */
  getPrintPermissions(): PrintPermission[] {
    return this.printSubject.getValue();
  }

  /** Synchronous check: returns true if report with given ReportMasterSid is allowed. */
  canReport(reportMasterSid: number): boolean {
    return this.reportSubject.getValue().some(r => r.ReportMasterSid === reportMasterSid);
  }

  /** Synchronous getter for current report permissions array. */
  getReportPermissions(): ReportPermission[] {
    return this.reportSubject.getValue();
  }

  /**
   * Synchronous check for main permissions (insert/update/delete/view).
   * Returns false if permissions are not available yet.
   */
  can(permission: keyof MainPermissions): boolean {
    const perms = this.permissionSubject.getValue();
    if (!perms) return false;
    return perms.mainPermissions[permission] ?? false;
  }

  /**
   * Check for arbitrary other permission keys (case-insensitive).
   */
  has(key: string): boolean {
    const perms = this.permissionSubject.getValue();
    if (!perms) return false;
    const normalized = key.toLowerCase();
    return Object.entries(perms.otherPermissions).some(([k, v]) => k.toLowerCase() === normalized && v);
  }

  /**
   * Returns true if any 'other' permission is enabled.
   */
  hasAtLeastOne(): boolean {
    const perms = this.permissionSubject.getValue();
    if (!perms) return false;
    return Object.values(perms.otherPermissions).some(Boolean);
  }

  // ---------------------------
  // PRIVATE HELPERS
  // ---------------------------

  private transform(res: PermissionApiResponse): PermissionSet {
    const raw = res.data?.MenuPermissions;

    const mainPermissions: MainPermissions = {
      insert: this.toBool(raw[this.MAIN_KEYS.INSERT]),
      update: this.toBool(raw[this.MAIN_KEYS.UPDATE]),
      delete: this.toBool(raw[this.MAIN_KEYS.DELETE]),
      view: this.toBool(raw[this.MAIN_KEYS.VIEW]),
      post: this.toBool(raw[this.MAIN_KEYS.POST])
    };

    const otherPermissions: OtherPermissions = {};
    const mainVals = Object.values(this.MAIN_KEYS);

    Object.entries(raw).forEach(([k, v]) => {
      if (!mainVals.includes(k)) {
        otherPermissions[k] = this.toBool(v);
      }
    });

    // ⭐ Console Logging (clean + grouped + no performance issue)
    console.group('🔐 Menu Permissions Fetched');
    console.table([mainPermissions]);
    console.table([otherPermissions]);
    console.groupEnd();

    return { mainPermissions, otherPermissions };
  }


  private toBool(val?: string | boolean | null | undefined): boolean {
    if (val === undefined || val === null) return false;
    if (typeof val === 'boolean') return val;
    const v = String(val).toLowerCase().trim();
    return v === 'istrue' || v === 'true' || v === 'y' || v === '1';
  }

  private buildKey(companyId: number, menuId: number, roleIds: number[]): string {
    return `${companyId}_${menuId}_${roleIds.sort((a, b) => a - b).join(',')}`;
  }

  private getCompanyId(): number | null {
    const currentCompany = this.appSettingsService.getCurrentCompanyInfo();
    return currentCompany ? Number(currentCompany?.CompanyMasterSid) : null;
  }

  getMenuId(): number | null {
    const id = sessionStorage.getItem('currentMenuId');
    return id ? Number(id) : null;
  }

  getRoleIds(): number[] | null {
    try {
      console.log('🔍 getRoleId(): Starting role resolution process');

      const userData = this.appSettingsService.getDecryptedUserProfile();
      console.log('📋 userData:', userData);

      const currentCompany = this.appSettingsService.getCurrentCompanyInfo();
      console.log('🏢 currentCompany:', currentCompany);

      const currentCompanyId = currentCompany?.CompanyMasterSid;
      console.log('🆔 currentCompanyId:', currentCompanyId);

      if (!currentCompanyId) {
        console.warn('⚠️  No currentCompanyId found - cannot resolve role');
        return null;
      }

      console.log('🔎 Searching userCompanyMaster for CompanyMasterSid:', currentCompanyId);
      const userCompanyEntries = userData?.userCompanyMaster || [];
      console.log('📂 Available userCompanyMaster entries:', userCompanyEntries.length);

      const userCompanyEntry = userCompanyEntries.find(c => c.CompanyMasterSid === currentCompanyId);
      console.log('✅ Found matching userCompanyEntry:', userCompanyEntry);

      if (!userCompanyEntry) {
        console.warn('❌ No userCompanyEntry found for current company');
        return null;
      }

      const userRoles = (userCompanyEntry.userRoleMaster || []).map(r => {
        const roleId = r.RoleMasterSid;
        console.log('🎭 Processing role:', r, '-> RoleMasterSid:', roleId);
        return roleId;
      }).filter(Boolean);

      console.log('🔢 Extracted userRoles:', userRoles);

      if (!userRoles || userRoles.length === 0) {
        console.warn('⚠️  No valid roles found for current company');
        return null;
      }

      console.log('🎯 Resolved roleIds:', userRoles);
      return userRoles || [];

    } catch (error) {
      console.error('💥 getRoleId() failed with error:', error);
      return null;
    }
  }

}
