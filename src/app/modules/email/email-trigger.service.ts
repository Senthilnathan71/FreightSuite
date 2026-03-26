

import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';
import { EmailModuleService } from './email.service';
import { SettingsService } from '../settings/settings.service';
import { AppSettingsService } from 'src/app/core/services/app-settings.service';
import { EmailEntryComponent } from '../settings/email/email-entry/email-entry.component';
import { OperationService } from '../operation/operation.service';

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

  // ðŸ”¥ Modern Header (supports dynamic logo/name if provided in context)
  private buildHeaderTemplate(context?: any): string {
    const brand = this.getBrandContext(context);
    const companyName = brand.companyName || 'Company Name';
    const branchName = brand.branchName || '';
    const logoHtml = brand.logoUrl
      ? `<img src="${brand.logoUrl}" alt="${companyName}" style="width:auto;height:56px;max-width:180px;margin-right:12px;display:block;">`
      : '';

    return `
      <div style="background:#fff;padding:16px 20px;border-bottom:1px solid #e5e7eb;">
        <div style="display:flex;align-items:center;gap:12px;">
          ${logoHtml}
          <div style="color:#05608D;">
            <div style="font-size:22px;font-weight:700;line-height:1.2;">${companyName}</div>
            ${branchName ? `<div style="font-size:14px;font-weight:600;line-height:1.4;">${branchName}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // ðŸ”¥ Modern Footer
  private footerTemplate = `
    <div style="background:#f5f7fb;padding:6px 22px 14px 22px">
      <div style="
        max-width:640px;
        margin:0 auto;
        background:#05608D;
        color:#fff;
        text-align:center;
        padding:12px 16px;
        border-radius:14px;
        font-size:13px;
      ">
        <div style="margin-bottom:8px">
          <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Terms</a>
          <span>|</span>
          <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Privacy</a>
          <span>|</span>
          <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Contact</a>
          <span>|</span>
          <a href="#" style="color:#fff;text-decoration:none;margin:0 8px">Unsubscribe</a>
        </div>
        <div style="opacity:0.8">
          Â© ${new Date().getFullYear()} Dofi Infosys. All rights reserved.
        </div>
      </div>
    </div>
  `;

  constructor(
    private emailService: EmailModuleService,
    private settingsService: SettingsService,
    private appSettingService: AppSettingsService,
    private ngbModal: NgbModal,
    private operationService: OperationService
  ) {}

  triggerEmails(params: EmailTriggerParams): void {
    const { companyId, branchId, menuMasterSid, action, context, changedFields } = params;
    const menuSid = Number(menuMasterSid);

    this.emailService.getAllByCompany(companyId).subscribe({
      next: (resp: any) => {
        if (!resp.status || !resp.data) return;

        const configs = resp.data.filter((config: any) =>
          Number(config.MenuMasterSid) === menuSid &&
          config.Trigger === 'A' &&
          config.Status === 'A' &&
          this.matchesAction(config.Action, action) &&
          this.matchesUpdateFields(config, action, changedFields)
        );

        for (const config of configs) {
          if (config.AutoPopup === 'A') {
            this.sendAutoEmail(config, companyId, branchId, context);
          } else if (config.AutoPopup === 'P') {
            this.openEmailPopup(config, context);
          }
        }
      }
    });
  }

  triggerManualEmails(params: EmailTriggerParams): void {
    const { companyId, branchId, menuMasterSid, context } = params;
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
          this.appSettingService.showInfo('No manual mail configuration found.');
          return;
        }

        for (const config of configs) {
          if (config.AutoPopup === 'A') {
            this.sendAutoEmail(config, companyId, branchId, context);
          } else {
            this.openEmailPopup(config, context);
          }
        }
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
    if (!changedFields?.length) return true;

    const configFields = config.UpdateFields.split(',').map((f: string) => f.trim());
    return changedFields.some(field => configFields.includes(field));
  }

  private async enrichContext(context?: { [key: string]: any }): Promise<{ [key: string]: any }> {
    const userData = this.appSettingService.getDecryptedUserProfile();
    const companyInfo = this.appSettingService.getCurrentCompanyInfo();
    const branchInfo = this.appSettingService.getCurrentBranchInfo();

    let menuEmail = context?.['menuEmail'] || '';
    const logoUrl = this.getStoredLogoUrl();

    if (!menuEmail && context?.['customerBranchSid']) {
      try {
        const resp: any = await firstValueFrom(
          this.operationService.getCustomerBranchEmail(context['customerBranchSid'])
        );
        menuEmail = resp?.data?.Email || '';
      } catch (e) {
        console.error(e);
      }
    }

    return {
      ...context,
      menuEmail,
      organizationEmail: menuEmail,
      userEmail: userData?.userEmail || '',
      userName: context?.['userName'] || userData?.userName || '',
      companyName: companyInfo?.companyName || companyInfo?.CompanyName || 'Dofi Infosys',
      branchName: branchInfo?.branchName || branchInfo?.BranchName || '',
      logoUrl
    };
  }

  private getBrandContext(context?: any): { companyName: string; branchName: string; logoUrl: string } {
    const companyInfo = this.appSettingService.getCurrentCompanyInfo();
    const branchInfo = this.appSettingService.getCurrentBranchInfo();
    return {
      companyName: context?.companyName || companyInfo?.companyName || companyInfo?.CompanyName || 'Dofi Infosys',
      branchName: context?.branchName || branchInfo?.branchName || branchInfo?.BranchName || '',
      logoUrl: context?.logoUrl || this.getStoredLogoUrl()
    };
  }

  private getStoredLogoUrl(): string {
    const reportLogo = localStorage.getItem('current_report_logo') || '';
    const companyLogo = localStorage.getItem('current_company_logo') || '';
    if (reportLogo.startsWith('data:')) return reportLogo;
    if (companyLogo.startsWith('data:')) return companyLogo;
    return 'assets/logo/dofi-logo.svg';
  }

  // ðŸ”¥ MAIN DESIGN UPGRADE HERE
  private async sendAutoEmail(config: any, companyId: number, branchId: number, context?: any): Promise<void> {
    const userData = this.appSettingService.getDecryptedUserProfile();
    const enrichedContext = await this.enrichContext(context);

    const subject = this.replacePlaceholders(config.MailSubject, enrichedContext);
    const body = this.replacePlaceholders(config.MailBody, enrichedContext);
    const toEmail = this.replacePlaceholders(config.ToEmailidFrom || '', enrichedContext);
    const ccEmail = this.replacePlaceholders(config.CcEmailidFrom || '', enrichedContext);

    const bodyHtml = this.formatEmailBody(body);
    const headerLabel = this.getHeaderLabel(config, subject, enrichedContext);
    const summaryHtml = this.buildSummaryChips(body, subject, headerLabel);

    // ðŸ”¥ Highlight Email UI (CONTENT NOT CHANGED)
    const formattedBody = this.buildFormattedBody(bodyHtml, summaryHtml, headerLabel);

    const formData = new FormData();
    formData.append('CompanyMasterSid', companyId.toString());
    formData.append('BranchMasterSid', branchId.toString());
    formData.append('EmailTo', toEmail);
    formData.append('EmailCC', ccEmail);
    formData.append('EmailBCC', '');
    formData.append('Subject', subject);

    // âœ… Final Mail
    formData.append(
      'Mailbody',
      this.buildHeaderTemplate(enrichedContext) + formattedBody + this.footerTemplate
    );

    formData.append('CreatedBy', userData?.userEmail || '');

    this.settingsService.createNewEmailLog(formData).subscribe({
      next: (resp: any) => {
        if (resp.status) {
          this.appSettingService.showSuccess('Email sent successfully.');
        } else {
          this.appSettingService.showError('Email sending failed.');
        }
      },
      error: () => {
        this.appSettingService.showError('Email sending failed.');
      }
    });
  }
  private async openEmailPopup(config: any, context?: any): Promise<void> {
    const enrichedContext = await this.enrichContext(context);

    const modalRef = this.ngbModal.open(EmailEntryComponent, {
      size: 'lg',
      centered: true,
      backdrop: 'static'
    });

    modalRef.componentInstance.setContent = {
      EmailTo: this.replacePlaceholders(config.ToEmailidFrom || '', enrichedContext),
      EmailCC: this.replacePlaceholders(config.CcEmailidFrom || '', enrichedContext),
      EmailBCC: '',
      Subject: this.replacePlaceholders(config.MailSubject, enrichedContext),
      Mailbody: this.replacePlaceholders(config.MailBody, enrichedContext)
    };
  }

  private replacePlaceholders(text: string, context?: any): string {
    if (!text || !context) return text || '';

    let result = text;
    for (const key in context) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), context[key] ?? '');
    }
    return result;
  }

  private formatEmailBody(rawBody: string): string {
    if (!rawBody) return '';

    const withHighlight = this.applyHighlightMarkup(rawBody);
    const hasHtml = /<\/?[a-z][\s\S]*>/i.test(withHighlight);

    if (hasHtml) {
      return withHighlight.replace(/\n/g, '<br>');
    }

    const lines = withHighlight
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const htmlParts: string[] = [];
    let detailRows: Array<{ label: string; value: string }> = [];

    const pushDetails = () => {
      if (detailRows.length === 0) return;

      const rowsHtml = detailRows
        .map(
          row => `
            <tr>
              <td style="padding:8px 12px;color:#516070;font-weight:700;width:160px;vertical-align:top;background:#f2f6fa;border-bottom:1px solid #e2e9f1;">
                ${row.label}
              </td>
              <td style="padding:8px 12px;color:#1f2d3d;border-bottom:1px solid #e2e9f1;">
                <span style="background:#e8f3fb;color:#0b6aa1;padding:3px 8px;border-radius:6px;font-weight:600;display:inline-block;">
                  ${row.value}
                </span>
              </td>
            </tr>
          `
        )
        .join('');

      htmlParts.push(`
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e9f1;border-radius:10px;overflow:hidden;margin:14px 0 6px 0;">
          ${rowsHtml}
        </table>
      `);

      detailRows = [];
    };

    for (const line of lines) {
      const match = line.match(/^([^:]{2,40}):\s*(.+)$/);
      if (match) {
        detailRows.push({ label: match[1].trim(), value: match[2].trim() });
      } else {
        pushDetails();
        htmlParts.push(`<p style="margin:0 0 10px 0;">${line}</p>`);
      }
    }

    pushDetails();

    return htmlParts.join('');
  }

  private applyHighlightMarkup(text: string): string {
    return text
      .replace(/<\s*mark\s*>/gi, '<span style="background:#fff2b3;color:#7a5b00;padding:2px 6px;border-radius:6px;font-weight:700;">')
      .replace(/<\s*\/\s*mark\s*>/gi, '</span>')
      .replace(/\*\*(.+?)\*\*/g, '<span style="background:#e7f1fb;color:#0b6aa1;padding:2px 6px;border-radius:6px;font-weight:700;">$1</span>');
  }

  private getHeaderLabel(config: any, subject: string, context?: any): string {
    const candidates = [
      context?.menuName,
      config?.MenuMaster?.MenuName,
      config?.MenuName,
      config?.MailName
    ]
      .filter(Boolean)
      .map((value: string) => value.toString());

    const normalized = candidates.find((value: string) =>
      /booking|enquiry|quotation/i.test(value)
    );

    if (normalized) {
      if (/booking/i.test(normalized)) return 'Booking';
      if (/enquiry/i.test(normalized)) return 'Enquiry';
      if (/quotation/i.test(normalized)) return 'Quotation';
    }

    if (/booking/i.test(subject)) return 'Booking';
    if (/enquiry/i.test(subject)) return 'Enquiry';
    if (/quotation/i.test(subject)) return 'Quotation';

    return 'Notification';
  }

  public buildCommonTemplate(body: string, subject: string, context?: any, config?: any): string {
    const bodyHtml = this.formatEmailBody(body);
    const headerLabel = this.getHeaderLabel(config || {}, subject || '', context);
    const summaryHtml = this.buildSummaryChips(body, subject, headerLabel);
    const formattedBody = this.buildFormattedBody(bodyHtml, summaryHtml, headerLabel);
    return this.buildHeaderTemplate(context) + formattedBody + this.footerTemplate;
  }

  private buildFormattedBody(bodyHtml: string, summaryHtml: string, headerLabel: string): string {
    return `
      <div style="background:#f5f7fb;padding:28px 22px">
        
        <div style="
          max-width:700px;
          margin:0 auto;
          font-family:Arial, sans-serif;
        ">

          <!-- Summary Card -->
          <div style="
            background:#ffffff;
            border-radius:16px;
            border:1px solid #e6edf5;
            box-shadow:0 10px 26px rgba(5,96,141,0.10);
            overflow:hidden;
          ">
            <div style="
              background:linear-gradient(90deg,#0b6aa1,#1791d1);
              color:#fff;
              padding:16px 22px;
              display:flex;
              align-items:center;
              justify-content:space-between;
              gap:10px;
              flex-wrap:wrap;
            ">
              <span style="
                background:#ffffff;
                color:#0b6aa1;
                padding:6px 12px;
                border-radius:999px;
                font-size:12px;
                font-weight:800;
                letter-spacing:0.3px;
                text-transform:uppercase;
              ">${headerLabel}</span>
              
            </div>

            <div style="padding:18px 22px 20px 22px;">
              ${summaryHtml}
            </div>
          </div>

          <!-- Message Card -->
          <div style="
            margin-top:16px;
            background:#ffffff;
            border-radius:16px;
            border:1px solid #e6edf5;
            box-shadow:0 8px 20px rgba(5,96,141,0.08);
            overflow:hidden;
          ">
            <div style="
              padding:16px 20px 20px 20px;
              font-size:15px;
              line-height:1.75;
              color:#2b3a4a;
              background:#fbfdff;
            ">
              <div style="
                background:#ffffff;
                border:1px solid #e1eaf3;
                border-radius:12px;
                padding:16px 18px;
                box-shadow:0 6px 14px rgba(11,106,161,0.08);
                position:relative;
              ">
                <div style="
                  border-left:4px solid #0b6aa1;
                  padding-left:14px;
                ">
                  ${bodyHtml}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    `;
  }

  private buildSummaryChips(rawBody: string, subject?: string, headerLabel?: string): string {
    if (!rawBody && !subject) return '';

    const combinedText = `${rawBody || ''}\n${subject || ''}`;
    const lines = combinedText
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const bookingMatch = combinedText.match(/Booking\s*No\.?\s*[:\-]?\s*(.*?)(?:\s+Date\b|$)/i);
    const dateMatch = combinedText.match(/Date\s*[:\-]?\s*([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/i);
    const pooMatch = combinedText.match(/POO\s*[:\-]?\s*([^\n]+)/i);
    const podMatch = combinedText.match(/POD\s*[:\-]?\s*([^\n]+)/i);

    let route = '';
    const cleanPlace = (value: string): string =>
      value
        .replace(/Booking\s*No\.?.*?Date\s*[:\-]?\s*[0-9/]+/i, '')
        .replace(/Booking\s*No\.?.*?$/i, '')
        .replace(/Date\s*[:\-]?\s*[0-9/]+/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    const stripRefAndDate = (text: string): string => {
      if (!text) return '';
      const dateOnlyMatch = text.match(/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/);
      if (!dateOnlyMatch) return text;
      return text.split(dateOnlyMatch[1]).slice(1).join(dateOnlyMatch[1]).trim();
    };

    for (const line of lines) {
      const routeMatch = line.match(/([^-]+?)\s*-\s*([A-Z0-9]{3,5})\s*-\s*([^-]+?)\s*-\s*([A-Z0-9]{3,5})/);
      if (routeMatch) {
        const fromPlace = cleanPlace(routeMatch[1].trim());
        const toPlace = cleanPlace(routeMatch[3].trim());
        route = `${fromPlace} (${routeMatch[2]}) → ${toPlace} (${routeMatch[4]})`;
        break;
      }
    }

    const rows: Array<{ label: string; value: string }> = [];

    if (subject) {
      const subjectPattern = /^(\S+)\s+([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})\s+(.+?)\s*-\s*([A-Z0-9]{3,5})\s+(.+?)\s*-\s*([A-Z0-9]{3,5})/;
      const directMatch = subject.trim().match(subjectPattern);
      if (directMatch) {
        const isEnquiry = /enquiry/i.test(headerLabel || '');
        const isBooking = /booking/i.test(headerLabel || '');
        const refLabel = isEnquiry ? 'Enquiry No' : 'Reference No';
        const dateLabel = isEnquiry ? 'Enquiry Date' : isBooking ? 'Booking Date' : 'Date';
        rows.push({ label: refLabel, value: directMatch[1].trim() });
        rows.push({ label: dateLabel, value: directMatch[2].trim() });
        rows.push({
          label: 'Route',
          value: `${directMatch[3].trim()} (${directMatch[4].trim()}) → ${directMatch[5].trim()} (${directMatch[6].trim()})`
        });
      }
    }
    if (bookingMatch?.[1] && !rows.some(row => row.label === 'Booking No')) {
      rows.push({ label: 'Booking No', value: bookingMatch[1].trim() });
    }
    const isEnquiryHeader = /enquiry/i.test(headerLabel || '');
    const isBookingHeader = /booking/i.test(headerLabel || '');
    const dateLabel = isEnquiryHeader ? 'Enquiry Date' : isBookingHeader ? 'Booking Date' : 'Date';
    if (dateMatch?.[1] && !rows.some(row => row.label === dateLabel)) {
      rows.push({ label: dateLabel, value: dateMatch[1].trim() });
    }
    if (route && !rows.some(row => row.label === 'Route')) {
      rows.push({ label: 'Route', value: route });
    } else {
      if (pooMatch?.[1] && !rows.some(row => row.label === 'POO')) {
        rows.push({ label: 'POO', value: pooMatch[1].trim() });
      }
      if (podMatch?.[1] && !rows.some(row => row.label === 'POD')) {
        rows.push({ label: 'POD', value: podMatch[1].trim() });
      }
    }

    if (subject && /enquiry/i.test(headerLabel || '')) {
      const dateOnlyMatch = subject.match(/([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4})/);
      const dateOnly = dateOnlyMatch?.[1];
      let refNo = '';
      let subjectRoute = '';

      if (dateOnlyMatch) {
        const parts = subject.split(dateOnly);
        refNo = parts[0]?.trim() || '';
        subjectRoute = parts.slice(1).join(dateOnly).trim();
      } else {
        refNo = subject.trim();
      }

      const refLabel = 'Enquiry No';
      if (refNo && !rows.some(row => row.label === refLabel)) {
        rows.unshift({ label: refLabel, value: refNo });
      }
      const enquiryDateLabel = 'Enquiry Date';
      if (dateOnly && !rows.some(row => row.label === enquiryDateLabel)) {
        rows.push({ label: enquiryDateLabel, value: dateOnly });
      }

      if (!rows.some(row => row.label === 'Route')) {
        const parsedRoute = this.parseRouteText(stripRefAndDate(subjectRoute));
        if (parsedRoute) {
          rows.push({ label: 'Route', value: parsedRoute });
        }
      }
    }

    const normalizedRows: Array<{ label: string; value: string }> = [];
    const seenLabels = new Set<string>();
    const trimLabel = (label: string): string => label.trim();
    const labelKey = (label: string): string => trimLabel(label).toLowerCase();

    for (const row of rows) {
      row.label = trimLabel(row.label);

      if (row.label === 'Route') {
        const cleanedRoute = this.parseRouteText(stripRefAndDate(row.value));
        if (cleanedRoute) {
          row.value = cleanedRoute;
        }
      }

      const key = labelKey(row.label);
      if (seenLabels.has(key)) {
        if (key === 'route') {
          const existingIndex = normalizedRows.findIndex(r => labelKey(r.label) === 'route');
          if (existingIndex >= 0) {
            const existing = normalizedRows[existingIndex];
            const existingHasRef = /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|\bWL\/|Booking\s*No/i.test(existing.value);
            const newHasRef = /[0-9]{1,2}\/[0-9]{1,2}\/[0-9]{2,4}|\bWL\/|Booking\s*No/i.test(row.value);
            if (existingHasRef && !newHasRef) {
              normalizedRows[existingIndex] = row;
            }
          }
        }
        continue;
      }

      seenLabels.add(key);
      normalizedRows.push(row);
    }

    if (normalizedRows.length === 0) return '';

    const rowHtml = normalizedRows
      .map(
        row => `
          <tr>
            <td style="padding:8px 12px;color:#516070;font-weight:700;width:120px;vertical-align:top;background:#f2f6fa;border-bottom:1px solid #e2e9f1;">
              ${row.label}
            </td>
            <td style="padding:8px 12px;color:#1f2d3d;border-bottom:1px solid #e2e9f1;">
              ${row.value}
            </td>
          </tr>
        `
      )
      .join('');

    return `
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #e2e9f1;border-radius:12px;overflow:hidden;margin:0 0 14px 0;background:#ffffff;">
        ${rowHtml}
      </table>
    `;
  }

  private parseRouteText(routeText: string): string {
    if (!routeText) return '';

    const cleaned = routeText.replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';

    const parts = cleaned.split('-').map(part => part.trim()).filter(Boolean);

    if (parts.length >= 4) {
      const fromName = parts[0];
      const fromCode = parts[1];
      const toName = parts[2];
      const toCode = parts[3];
      return `${fromName} (${fromCode}) → ${toName} (${toCode})`;
    }

    if (parts.length >= 2) {
      return `${parts[0]} → ${parts.slice(1).join(' - ')}`;
    }

    return cleaned;
  }
}
