import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import {
  REPORT_COLUMN_CONFIG_NAME,
  REPORT_VIEW_MODE_STORAGE_KEY,
  ReportViewMode,
} from '../components/reports/generic-table-report/report-column-config';

/**
 * Resolves the effective report view mode (New vs Classic).
 *
 * Precedence: per-user localStorage override -> company configuration default -> CLASSIC.
 * The company default reuses the existing `company-config/value/...` endpoint
 * (same one MasterService.getConfigurationValue uses) so no backend change is needed.
 */
@Injectable({ providedIn: 'root' })
export class ReportViewModeService {
  private companyDefault$ = new Map<number, Observable<ReportViewMode>>();

  constructor(private http: HttpClient) {}

  /** The user's explicit override for this browser, or null to follow the company default. */
  getUserOverride(): ReportViewMode | null {
    const value = localStorage.getItem(REPORT_VIEW_MODE_STORAGE_KEY);
    return value === 'NEW' || value === 'CLASSIC' ? value : null;
  }

  /** Set (or clear, when null) the per-user override. */
  setUserOverride(mode: ReportViewMode | null): void {
    try {
      if (mode) {
        localStorage.setItem(REPORT_VIEW_MODE_STORAGE_KEY, mode);
      } else {
        localStorage.removeItem(REPORT_VIEW_MODE_STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to persist report view mode:', error);
    }
  }

  /** Company-wide default from CompanyConfiguration (cached per company). */
  getCompanyDefault(companyId: number): Observable<ReportViewMode> {
    if (!companyId) return of<ReportViewMode>('CLASSIC');

    let cached = this.companyDefault$.get(companyId);
    if (!cached) {
      cached = this.http
        .get<{ data: any }>(`company-config/value/${companyId}/${REPORT_COLUMN_CONFIG_NAME}`)
        .pipe(
          map((resp) => {
            const data = resp?.data;
            const rawValue = data?.ConfigurationValue ?? data?.value ?? data;
            return this.normalize(rawValue);
          }),
          catchError(() => of<ReportViewMode>('CLASSIC')),
          shareReplay(1),
        );
      this.companyDefault$.set(companyId, cached);
    }
    return cached;
  }

  /** Effective mode = user override, else company default, else CLASSIC. */
  getEffectiveMode(companyId: number): Observable<ReportViewMode> {
    const override = this.getUserOverride();
    if (override) return of(override);
    return this.getCompanyDefault(companyId);
  }

  private normalize(rawValue: any): ReportViewMode {
    return rawValue === true || rawValue === 'Y' || rawValue === 'y' ? 'NEW' : 'CLASSIC';
  }
}
