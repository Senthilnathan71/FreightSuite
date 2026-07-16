import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';

import { AppSettingsService } from './app-settings.service';

/**
 * Session-cached reader for CompanyConfiguration values.
 *
 * One JSON in sessionStorage (`company-config-cache`), nested per company:
 *   { "55": { "MilestoneAutoInsertionRequire": "Y" }, "7": { "...": null } }
 *
 * Each config key is fetched from the backend ONCE per session (first miss) via
 * `GET company-config/value/:companyId/:configName`, then merged into the JSON
 * without disturbing the keys already stored. `null` (company has no active row)
 * is cached too, so unconfigured companies never re-fetch. A failed HTTP call
 * resolves null but is NOT cached, so the next action retries.
 */
@Injectable({
  providedIn: 'root'
})
export class CompanyConfigCacheService {
  private static readonly STORAGE_KEY = 'company-config-cache';

  /** Dedups concurrent requests for the same company+config (e.g. download then email). */
  private inFlight = new Map<string, Observable<string | null>>();

  constructor(
    private http: HttpClient,
    private appSettings: AppSettingsService
  ) { }

  /** Drop the whole cache (called after Company Config screen saves so changes apply without re-login). */
  static clearCache(): void {
    sessionStorage.removeItem(CompanyConfigCacheService.STORAGE_KEY);
  }

  /** Value of one company config — sessionStorage first, backend only on the first miss. */
  getConfigValue(configName: string, companyMasterSid?: number): Observable<string | null> {
    const companyId = companyMasterSid ?? this.currentCompanyId();
    if (!companyId || !configName) {
      return of(null);
    }

    const companyCache = this.readCache()[companyId];
    if (companyCache && configName in companyCache) {
      return of(companyCache[configName]); // cached, even when the cached value is null
    }

    const flightKey = `${companyId}|${configName}`;
    const pending = this.inFlight.get(flightKey);
    if (pending) {
      return pending;
    }

    const request = this.http
      .get<{ data: any }>(`company-config/value/${companyId}/${configName}`)
      .pipe(
        map((resp) => (resp?.data ?? null) as string | null),
        tap((value) => this.writeCache(companyId, configName, value)), // only successful fetches are cached
        catchError(() => of(null)),
        finalize(() => this.inFlight.delete(flightKey)),
        shareReplay(1)
      );
    this.inFlight.set(flightKey, request);
    return request;
  }

  /** Y/N-style check: missing / blank / 'N' => false; anything else ('Y') => true. */
  isConfigEnabled(configName: string, companyMasterSid?: number): Observable<boolean> {
    return this.getConfigValue(configName, companyMasterSid).pipe(
      map((value) => {
        const normalized = String(value ?? '').trim().toUpperCase();
        return normalized !== '' && normalized !== 'N';
      })
    );
  }

  /** Merge one value in WITHOUT disturbing the other stored keys/companies. */
  private writeCache(companyId: number, configName: string, value: string | null): void {
    const cache = this.readCache();
    cache[companyId] = { ...(cache[companyId] || {}), [configName]: value };
    sessionStorage.setItem(CompanyConfigCacheService.STORAGE_KEY, JSON.stringify(cache));
  }

  private readCache(): Record<string, Record<string, string | null>> {
    try {
      return JSON.parse(sessionStorage.getItem(CompanyConfigCacheService.STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  }

  private currentCompanyId(): number | null {
    const company = this.appSettings.decrypt(localStorage.getItem('selected-company'));
    const sid = Number(company?.CompanyMasterSid);
    return sid > 0 ? sid : null;
  }
}
