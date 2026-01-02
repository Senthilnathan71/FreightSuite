import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, from } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AppSettingsService } from './app-settings.service';

@Injectable({
  providedIn: 'root',
})
export class LogoService {
  // Path to your fallback logo in assets
  private defaultLogoUrl = new URL(
    'assets/images/logos/xtreme-dark-icon.svg',
    document.baseURI
  ).href;


  private companyLogoKey = 'current_company_logo';
  private reportLogoKey = 'current_report_logo';

  private currentCompanyLogoId: string | null = null;
  private currentReportLogoId: string | null = null;

  // Always start with default to avoid broken images
  private companyLogoSource = new BehaviorSubject<string>(this.getStoredCompanyLogo() || this.defaultLogoUrl);
  public companyLogo$ = this.companyLogoSource.asObservable();

  private reportLogoSource = new BehaviorSubject<string>(this.getStoredReportLogo() || this.defaultLogoUrl);
  public reportLogo$ = this.reportLogoSource.asObservable();

  constructor(
    private http: HttpClient,
    private appSettingsService: AppSettingsService,
  ) {}

  // ==================== COMBINED METHODS ====================

  refreshBothLogos(): void {
    this.clearAllStoredLogos();

    const companyInfo = this.appSettingsService.getCurrentCompanyInfo();
    const companyLogoId = companyInfo?.companyLogo || null;
    const reportLogoId = companyInfo?.reportLogo || null;

    this.currentCompanyLogoId = companyLogoId;
    this.currentReportLogoId = reportLogoId;

    this.fetchLogoIfNeeded(companyLogoId, this.companyLogoKey, this.companyLogoSource);
    this.fetchLogoIfNeeded(reportLogoId, this.reportLogoKey, this.reportLogoSource);
  }

  loadInitialBothLogos(): void {
    const storedCompany = this.getStoredCompanyLogo();
    const storedReport = this.getStoredReportLogo();

    this.companyLogoSource.next(storedCompany || this.defaultLogoUrl);
    this.reportLogoSource.next(storedReport || this.defaultLogoUrl);

    if (!storedCompany || !storedReport) {
      this.refreshBothLogos();
    }
  }

  // ==================== SEPARATE METHODS ====================

  refreshCompanyLogo(): void {
    this.clearStoredCompanyLogo();
    const logoId = this.getCurrentCompanyLogoId();
    this.currentCompanyLogoId = logoId;
    this.fetchLogoIfNeeded(logoId, this.companyLogoKey, this.companyLogoSource);
  }

  refreshReportLogo(): void {
    this.clearStoredReportLogo();
    const logoId = this.getCurrentReportLogoId();
    this.currentReportLogoId = logoId;
    this.fetchLogoIfNeeded(logoId, this.reportLogoKey, this.reportLogoSource);
  }

  loadInitialCompanyLogo(): void {
    const stored = this.getStoredCompanyLogo();
    this.companyLogoSource.next(stored || this.defaultLogoUrl);
    if (!stored) this.refreshCompanyLogo();
  }

  loadInitialReportLogo(): void {
    const stored = this.getStoredReportLogo();
    this.reportLogoSource.next(stored || this.defaultLogoUrl);
    if (!stored) this.refreshReportLogo();
  }

  // ==================== PRIVATE HELPERS ====================

  private fetchLogoIfNeeded(
    logoId: string | null,
    storageKey: string,
    subject: BehaviorSubject<string>
  ): void {
    if (!logoId) {
      subject.next(this.defaultLogoUrl);
      return;
    }

    this.fetchAndCacheLogo(logoId, storageKey).subscribe({
      next: (dataUrl) => subject.next(dataUrl || this.defaultLogoUrl),
      error: () => subject.next(this.defaultLogoUrl),
    });
  }

  private fetchAndCacheLogo(logoId: string, storageKey: string): Observable<string | null> {
    return this.http.get(`user/logo/${logoId}`, { responseType: 'blob' }).pipe(
      switchMap((blob: Blob) =>
        from(
          new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              localStorage.setItem(storageKey, dataUrl);
              resolve(dataUrl);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          })
        )
      ),
      catchError((err) => {
        console.error(`Error fetching logo (${storageKey}):`, err);
        localStorage.removeItem(storageKey);
        return of(null);
      })
    );
  }

  private getCurrentCompanyLogoId(): string | null {
    return this.appSettingsService.getCurrentCompanyInfo()?.companyLogo || null;
  }

  private getCurrentReportLogoId(): string | null {
    return this.appSettingsService.getCurrentCompanyInfo()?.reportLogo || null;
  }

  private getStoredCompanyLogo(): string | null {
    try {
      const item = localStorage.getItem(this.companyLogoKey);
      return item && item.startsWith('data:') ? item : null;
    } catch {
      return null;
    }
  }

  private getStoredReportLogo(): string | null {
    try {
      const item = localStorage.getItem(this.reportLogoKey);
      return item && item.startsWith('data:') ? item : null;
    } catch {
      return null;
    }
  }

  private clearStoredCompanyLogo(): void {
    try { localStorage.removeItem(this.companyLogoKey); } catch {}
  }

  private clearStoredReportLogo(): void {
    try { localStorage.removeItem(this.reportLogoKey); } catch {}
  }

  private clearAllStoredLogos(): void {
    this.clearStoredCompanyLogo();
    this.clearStoredReportLogo();
  }

  // Optional: Force fallback
  useDefaultLogo(): void {
    this.companyLogoSource.next(this.defaultLogoUrl);
    this.reportLogoSource.next(this.defaultLogoUrl);
  }
}