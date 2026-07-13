import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppSettingsService } from './app-settings.service';
import { LeadService } from 'src/app/modules/crm-mobile/Services/lead.service';

/**
 * Authorize-before-print guard shared by the operation bill screens
 * (MBL / MAWB / HBL / HAWB / Agent MAWB), mirroring the Booking print gate.
 */
@Injectable({ providedIn: 'root' })
export class PrintAuthorizationService {
  constructor(
    private leadService: LeadService,
    private appSettingsService: AppSettingsService,
  ) {}

  /**
   * Department-scoped authorization check before printing a bill.
   * Normal flow: when the menu has no authority rule for the document's department there are no
   * authorizers, so printing is allowed. When a rule applies, the document must be fully Approved.
   * Returns true when printing may proceed; shows a warning and returns false otherwise.
   */
  async ensureAuthorizedToPrint(params: {
    menuMasterSid: number | null | undefined;
    documentSid: number | null | undefined;
    companyMasterSid?: number;
    branchMasterSid?: number;
    departmentMasterSid?: number | null;
    documentLabel?: string;
  }): Promise<boolean> {
    const menuMasterSid = Number(params.menuMasterSid);
    const documentSid = Number(params.documentSid);
    // Nothing to gate (e.g. an unsaved record) — existing save/dirty guards already cover this.
    if (!menuMasterSid || !documentSid) {
      return true;
    }
    try {
      const resp: any = await firstValueFrom(
        this.leadService.getApprovalStatusByMenuAndDocument(
          menuMasterSid,
          documentSid,
          params.companyMasterSid,
          params.branchMasterSid,
          params.departmentMasterSid ?? undefined,
        ),
      );
      const logData: any[] = resp?.data?.logData || [];
      // No authorizers configured for this menu + department -> normal flow.
      if (logData.length === 0 || resp?.data?.status === 'Approved') {
        return true;
      }
      const label = params.documentLabel || 'document';
      this.appSettingsService.showWarning(`This ${label} must be authorized before it can be printed.`);
      return false;
    } catch (error) {
      console.error('Print authorization check failed:', error);
      this.appSettingsService.showError('Unable to verify authorization. Please try again.');
      return false;
    }
  }
}
