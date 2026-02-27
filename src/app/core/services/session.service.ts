import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Subscription, interval, switchMap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';
import { AppSettingsService } from './app-settings.service';
import { CompanySettingsManagerService } from './company-settings-manager.service';

@Injectable({
  providedIn: 'root'
})
export class SessionService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private pollingSubscription: Subscription | null = null;
  private isPolling = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private appSettingsService: AppSettingsService,
    private companySettingsManager: CompanySettingsManagerService
  ) {
    // Listen for localStorage changes from other tabs (multi-tab logout sync)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === null) {
          // localStorage was cleared (logout from another tab)
          this.stopHeartbeat();
          this.router.navigate(['auth/login']);
        }
      });
    }
  }

  /**
   * Start polling the heartbeat endpoint every 30 seconds.
   * Called after successful login and on app initialization (if token exists).
   */
  startHeartbeat(): void {
    if (this.isPolling) return;
    this.isPolling = true;

    this.pollingSubscription = interval(30000)
      .pipe(
        switchMap(() => this.checkSession()),
        catchError(error => {
          if (error?.status === 401) {
            this.stopHeartbeat();
          }
          return of(null);
        })
      )
      .subscribe(response => {
        if (response && response.status === false && response.message === 'SESSION_INVALIDATED') {
          this.handleSessionInvalidation();
        }
      });
  }

  /**
   * Stop the heartbeat polling.
   */
  stopHeartbeat(): void {
    this.isPolling = false;
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Call the backend logout endpoint.
   */
  logoutFromServer() {
    return this.http.post<any>('auth/logout', {});
  }

  /**
   * Call the heartbeat endpoint.
   */
  private checkSession() {
    return this.http.get<any>('auth/session/heartbeat', {
      headers: { skipLoader: 'true' }
    });
  }

  /**
   * Handle session invalidation — clean up and redirect to login.
   */
  private handleSessionInvalidation(): void {
    this.stopHeartbeat();

    // Clear company settings
    this.companySettingsManager.clearCompanySettings();

    // Preserve remembered credentials
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedPassword = localStorage.getItem('rememberedPassword');
    const lastUsedFinancialYear = localStorage.getItem('current-year-id');

    // Clear all localStorage
    localStorage.clear();

    // Restore preserved data
    if (rememberedEmail) localStorage.setItem('rememberedEmail', rememberedEmail);
    if (rememberedPassword) localStorage.setItem('rememberedPassword', rememberedPassword);
    if (lastUsedFinancialYear) localStorage.setItem('current-year-id', lastUsedFinancialYear);

    // Clear token and redirect
    this.appSettingsService.sessionExpire().then(() => {
      this.appSettingsService.showWarning(
        'You have been logged out because your account was logged in from another device.',
        'Session Ended'
      );
      this.router.navigate(['auth/login']);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopHeartbeat();
  }
}
