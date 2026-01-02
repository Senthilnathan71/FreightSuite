import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, from } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { AppSettingsService } from './app-settings.service';

@Injectable({
  providedIn: 'root',
})
export class LogoService {
  private localStorageKey = 'current_company_logo';
  private currentLogoId: string | null = null;

  // Public observable that components can subscribe to (or use with async pipe)
  private logoSource = new BehaviorSubject<string | null>(this.getStoredLogo());
  public logo$ = this.logoSource.asObservable();

  constructor(
    private http: HttpClient,
    private appSettingsService: AppSettingsService,
  ) {}

  /** Force refresh the logo – call this when company/branch changes */
  refreshLogo(): void {
    this.clearStoredLogo();
    const logoId = this.getCurrentCompanyLogoId();
    this.currentLogoId = logoId;

    if (logoId) {
      this.fetchAndCacheLogo(logoId).subscribe({
        next: (dataUrl) => this.logoSource.next(dataUrl),
        error: () => this.logoSource.next(null),
      });
    } else {
      this.logoSource.next(null);
    }
  }

  /** Initial load – call once if needed */
  loadInitialLogo(): void {
    const logoId = this.getCurrentCompanyLogoId();
    console.log("logoId", logoId);
    if (logoId && !this.hasStoredLogo()) {
      this.refreshLogo();
    } else {
      this.logoSource.next(this.getStoredLogo());
    }
  }

  private fetchAndCacheLogo(logoId: string): Observable<string | null> {
    return this.http.get(`user/logo/${logoId}`, { responseType: 'blob' }).pipe(
      switchMap((blob: Blob) =>
        from(
          new Promise<string | null>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              localStorage.setItem(this.localStorageKey, dataUrl);
              this.currentLogoId = logoId;
              resolve(dataUrl);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
          })
        )
      ),
      catchError((err) => {
        console.error('Error fetching logo:', err);
        this.clearStoredLogo();
        return of(null);
      })
    );
  }

  private getCurrentCompanyLogoId(): string | null {
    const currentBranch = this.appSettingsService.getCurrentCompanyInfo();
    return currentBranch?.companyLogo || null;
  }

  private getStoredLogo(): string | null {
    try {
      return localStorage.getItem(this.localStorageKey);
    } catch {
      return null;
    }
  }

  private clearStoredLogo(): void {
    try {
      localStorage.removeItem(this.localStorageKey);
      this.currentLogoId = null;
    } catch {}
  }

  hasStoredLogo(): boolean {
    return !!this.getStoredLogo();
  }
}