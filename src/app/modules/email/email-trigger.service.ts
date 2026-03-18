import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmailModuleService } from './email.service';
import { SettingsService } from '../settings/settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { EmailEntryComponent } from '../settings/email/email-entry/email-entry.component';

export interface EmailTriggerParams {
  companyId: number;
  branchId: number;
  menuMasterSid: number;
  action: 'CREATE' | 'UPDATE';
  context?: { [key: string]: any };
  changedFields?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EmailTriggerService {

  private headerTemplate = `
  <div style="background:#fff;padding:1rem;border-bottom:1px solid #eee">
    <a href="#" style="display:inline-flex;align-items:center;text-decoration:none;color:#05608D;font-weight:600;font-size:1.25rem">
      <img src="assets/logo/dofi-logo.svg" alt="Dofi Infosys" style="width:40px;height:40px;margin-right:8px">
      Dofi Infosys
    </a>
  </div>
`;

  private footerTemplate = `
  <div style="background:#05608D;color:#fff;text-align:center;padding:0.75rem;font-size:0.875rem">
    <div style="margin-bottom:0.5rem">
      <a href="#" style="color:#fff;text-decoration:none;margin:0 6px">Terms</a>|
      <a href="#" style="color:#fff;text-decoration:none;margin:0 6px">Privacy</a>|
      <a href="#" style="color:#fff;text-decoration:none;margin:0 6px">Contact</a>|
      <a href="#" style="color:#fff;text-decoration:none;margin:0 6px">Unsubscribe</a>
    </div>
    <p style="margin:0">&copy; ${new Date().getFullYear()} Dofi Infosys</p>
  </div>
`;

  constructor(
    private emailService: EmailModuleService,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private ngbModal: NgbModal
  ) {}

  triggerEmails(params: EmailTriggerParams): void {
    const { companyId, branchId, menuMasterSid, action, context, changedFields } = params;
    const menuSid = Number(menuMasterSid);

    console.log('EmailTriggerService: triggerEmails called', { companyId, menuSid, action });

    this.emailService.getAllByCompany(companyId).subscribe({
      next: (resp: any) => {
        if (!resp.status || !resp.data) {
          console.log('EmailTriggerService: No mail configs found for company', companyId);
          return;
        }

        console.log('EmailTriggerService: Total configs fetched:', resp.data.length);
        console.log('EmailTriggerService: Configs:', resp.data.map((c: any) => ({
          MenuMasterSid: c.MenuMasterSid, Trigger: c.Trigger, Status: c.Status, Action: c.Action, AutoPopup: c.AutoPopup
        })));

        const configs = resp.data.filter((config: any) =>
          Number(config.MenuMasterSid) === menuSid &&
          config.Trigger === 'A' &&
          config.Status === 'A' &&
          this.matchesAction(config.Action, action) &&
          this.matchesUpdateFields(config, action, changedFields)
        );

        console.log('EmailTriggerService: Matching configs after filter:', configs.length);

        for (const config of configs) {
          if (config.AutoPopup === 'A') {
            this.sendAutoEmail(config, companyId, branchId, context);
          } else if (config.AutoPopup === 'P') {
            this.openEmailPopup(config, context);
          }
        }
      },
      error: (err) => {
        console.error('EmailTriggerService: Error fetching mail configurations', err);
      }
    });
  }

  triggerManualEmails(params: EmailTriggerParams): void {
    const { companyId, branchId, menuMasterSid, action, context, changedFields } = params;
    const menuSid = Number(menuMasterSid);

    this.emailService.getAllByCompany(companyId).subscribe({
      next: (resp: any) => {
        if (!resp.status || !resp.data) return;

        const configs = resp.data.filter((config: any) =>
          Number(config.MenuMasterSid) === menuSid &&
          config.Trigger === 'M' &&
          config.Status === 'A'
        );

        if (configs.length === 0) {
          this.appSettingService.showInfo('No manual mail configuration found for this menu.');
          return;
        }

        for (const config of configs) {
          if (config.AutoPopup === 'A') {
            this.sendAutoEmail(config, companyId, branchId, context);
          } else if (config.AutoPopup === 'P') {
            this.openEmailPopup(config, context);
          }
        }
      },
      error: (err) => {
        console.error('EmailTriggerService: Error fetching manual mail configurations', err);
      }
    });
  }

  private matchesAction(configAction: string, currentAction: string): boolean {
    if (!configAction) return false;
    const actions = configAction.split(',').map(a => a.trim().toUpperCase());
    return actions.includes(currentAction.toUpperCase());
  }

  private matchesUpdateFields(config: any, action: string, changedFields?: string[]): boolean {
    if (action !== 'UPDATE') return true;
    if (!config.UpdateFields) return true;
    if (!changedFields || changedFields.length === 0) return true;
    const configFields = config.UpdateFields.split(',').map((f: string) => f.trim());
    return changedFields.some(field => configFields.includes(field));
  }

  private enrichContext(context?: { [key: string]: any }): { [key: string]: any } {
    const userData = this.appSettingService.getDecryptedUserProfile();
    return {
      ...context,
      organizationEmail: context?.['menuEmail'] || '',
      userEmail: userData?.userEmail || '',
      userName: context?.['userName'] || userData?.userName || ''
    };
  }

  private sendAutoEmail(config: any, companyId: number, branchId: number, context?: { [key: string]: any }): void {
    const userData = this.appSettingService.getDecryptedUserProfile();
    const enrichedContext = this.enrichContext(context);
    const subject = this.replacePlaceholders(config.MailSubject, enrichedContext);
    const body = this.replacePlaceholders(config.MailBody, enrichedContext);
    const toEmail = this.replacePlaceholders(config.ToEmailidFrom || '', enrichedContext);
    const ccEmail = this.replacePlaceholders(config.CcEmailidFrom || '', enrichedContext);

    const formData = new FormData();
    formData.append('CompanyMasterSid', companyId.toString());
    formData.append('BranchMasterSid', branchId.toString());
    formData.append('EmailTo', toEmail);
    formData.append('EmailCC', ccEmail);
    formData.append('EmailBCC', '');
    formData.append('Subject', subject);
    formData.append('Mailbody', this.headerTemplate + `<pre style="min-height:400px;padding:2rem;margin:0;font-family:system-ui,sans-serif;font-size:1rem;line-height:1.6;white-space:pre-wrap;background:#f9f9f9;border-radius:4px">${body}</pre>` + this.footerTemplate);
    formData.append('CreatedBy', userData?.userEmail || '');

    this.settingsService.createNewEmailLog(formData).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Email sent automatically.');
        } else {
          this.appSettingService.showError('Auto email sending failed.');
        }
      },
      error: (err) => {
        console.error('EmailTriggerService: Auto email error', err);
        this.appSettingService.showError('Auto email sending failed.');
      }
    });
  }

  private openEmailPopup(config: any, context?: { [key: string]: any }): void {
    const enrichedContext = this.enrichContext(context);
    const subject = this.replacePlaceholders(config.MailSubject, enrichedContext);
    const body = this.replacePlaceholders(config.MailBody, enrichedContext);
    const toEmail = this.replacePlaceholders(config.ToEmailidFrom || '', enrichedContext);
    const ccEmail = this.replacePlaceholders(config.CcEmailidFrom || '', enrichedContext);

    const modalRef = this.ngbModal.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.setContent = {
      EmailTo: toEmail,
      EmailCC: ccEmail,
      EmailBCC: '',
      Subject: subject,
      Mailbody: body
    };
  }

  private replacePlaceholders(text: string, context?: { [key: string]: any }): string {
    if (!text || !context) return text || '';
    let result = text;
    for (const key in context) {
      if (context.hasOwnProperty(key)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), context[key] ?? '');
      }
    }
    return result;
  }
}
