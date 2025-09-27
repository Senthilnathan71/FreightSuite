import { APP_INITIALIZER } from '@angular/core';
import { CompanySettingsManagerService } from '../services/company-settings-manager.service';

export function dateFormatInitializerFactory(companySettingsManager: CompanySettingsManagerService) {
  return () => {
    try {
      // Use safe initialization to avoid API calls during logout/auth issues
      companySettingsManager.safeInitialize();

      // Schedule full initialization after a delay to ensure auth is ready
      setTimeout(() => {
        companySettingsManager.initializeFromStorage();
      }, 1000);

    } catch (error) {
      console.warn('Error initializing date format:', error);
    }

    // Return resolved promise since this is not async critical
    return Promise.resolve();
  };
}

export const DATE_FORMAT_INITIALIZER = {
  provide: APP_INITIALIZER,
  useFactory: dateFormatInitializerFactory,
  deps: [CompanySettingsManagerService],
  multi: true
};