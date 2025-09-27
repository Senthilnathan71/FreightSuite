import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { GlobalDateFormatService } from './global-date-format.service';
import { CompanyConfigService } from '../../modules/master/company/services/company-config.service';

@Injectable({
  providedIn: 'root'
})
export class CompanySettingsManagerService {
  private currentCompanyIdSubject = new BehaviorSubject<number | null>(null);
  public currentCompanyId$ = this.currentCompanyIdSubject.asObservable();
  private isLoggingOut = false;

  constructor(
    private globalDateService: GlobalDateFormatService,
    private configService: CompanyConfigService
  ) {}

  /**
   * Set the current company and load its configuration
   */
  setCurrentCompany(companyId: number): void {
    if (this.isLoggingOut) {
      console.warn('Skipping company settings load during logout');
      return;
    }

    this.currentCompanyIdSubject.next(companyId);

    // Store in localStorage for persistence across sessions
    localStorage.setItem('selectedCompanyId', companyId.toString());

    // Load the company's date format configuration
    this.loadCompanySettings(companyId);
  }

  /**
   * Get the current company ID
   */
  getCurrentCompanyId(): number | null {
    return this.currentCompanyIdSubject.value;
  }

  /**
   * Load company settings and apply them globally
   */
  private loadCompanySettings(companyId: number): void {
    this.configService.getCompanyConfiguration(companyId).subscribe({
      next: (config) => {
        if (config?.systemSettings?.dateFormat) {
          this.globalDateService.setDateFormat(config.systemSettings.dateFormat);
        }
      },
      error: (error) => {
        console.warn('Could not load company settings:', error);
      }
    });
  }

  /**
   * Initialize from stored company ID
   */
  initializeFromStorage(): void {
    // Check if user is authenticated before making API calls
    if (this.isLoggingOut || !this.isUserAuthenticated()) {
      console.warn('User not authenticated or logging out, skipping company date format initialization');
      return;
    }

    const storedCompanyId = localStorage.getItem('selectedCompanyId');
    if (storedCompanyId) {
      const companyId = parseInt(storedCompanyId, 10);
      if (!isNaN(companyId)) {
        this.setCurrentCompany(companyId);
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  private isUserAuthenticated(): boolean {
    try {
      // Check for token using the same method as the app
      // The app uses StorageMap service for crm-token
      const userProfile = localStorage.getItem('userProfile');
      return !!userProfile;
    } catch (error) {
      console.warn('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Update date format for current company
   */
  updateDateFormat(dateFormat: string): void {
    this.globalDateService.setDateFormat(dateFormat);

    const companyId = this.getCurrentCompanyId();
    if (companyId) {
      // Store updated format in localStorage for immediate use
      localStorage.setItem('companyDateFormat', dateFormat);
    }
  }

  /**
   * Clear company settings (call during logout)
   */
  clearCompanySettings(): void {
    this.isLoggingOut = true;
    this.currentCompanyIdSubject.next(null);
    localStorage.removeItem('selectedCompanyId');
    localStorage.removeItem('companyDateFormat');
    this.globalDateService.setDateFormat('DD/MM/YYYY'); // Reset to default
  }

  /**
   * Safe initialization that won't cause API loops during logout
   */
  safeInitialize(): void {
    // Only load from localStorage cache, don't make API calls
    const cachedFormat = localStorage.getItem('companyDateFormat');
    if (cachedFormat) {
      this.globalDateService.setDateFormat(cachedFormat);
    }
  }
}